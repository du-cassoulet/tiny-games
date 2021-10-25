const Discord=require("discord.js");
const Canvas=require("canvas");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const utils=require("../utils/utils");
const fs=require("fs");
const db=require("quick.db");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[],
   * }} param0 
   */
  func:async({client,message})=>{
    const lobby=new Lobby({
      acceptablePlayers:1,
      game:module.exports.gameName,
      hostId:message.author.id,
      icon:module.exports.icon,
      maxPlayers:3,
      minPlayers:1,
      message:message,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      players=utils.shuffle(players);
      const gameStart=Date.now();
      var curTurn=0;
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        files:botMessage.files,
        embeds:botMessage.embeds,
        attachments:botMessage.attachments
      });
      function addImage(buffer){
        if(!db.has("images"))db.set("images",{});
        if(!db.has("images.weight"))db.set("images.weight",buffer.byteLength);
        db.add("images.weight",buffer.byteLength);
        if(!db.has("images.number"))db.set("images.number",1);
        db.add("images.number",1);
      };
      const scores=[];
      Canvas.registerFont("./public/fonts/MuseoModerno.ttf",{family:"MuseoModerno"});
      const cards=fs.readdirSync("./public/cards/").filter(c=>c!="card_back.png");
      const lowCards=cards.slice(0,24);
      const cardBack="card_back.png";
      const dealerDeck=[
        lowCards[Math.floor(Math.random()*lowCards.length)],
        cards[Math.floor(Math.random()*cards.length)]
      ];
      const hiddenDeck=[cardBack,dealerDeck[1]];
      const allPlayers=players.map(p=>{
        const deck=[
          lowCards[Math.floor(Math.random()*lowCards.length)],
          cards[Math.floor(Math.random()*cards.length)]
        ];
        return{id:p,deck};
      });
      function gamePicture(player,dealerDeck){
        return new Promise(async(resolve,reject)=>{
          try{
            const canvas=Canvas.createCanvas(600,900);
            const ctx=canvas.getContext("2d");
            function deckToImage(deck,x=0,y=0){
              return new Promise(resolve=>{
                var cardsNumber=0;
                deck.forEach(async(card,index)=>{
                  const image=await Canvas.loadImage(`./public/cards/${card}`);
                  ctx.drawImage(image,index*50+x,y,210,300);
                  cardsNumber++;
                  if(cardsNumber==deck.length)resolve(true);
                });
              });
            };
            const calculateDeckSize=deck=>deck.length>1?210+(deck.length-1)*50:0;
            await deckToImage(dealerDeck,(canvas.width/2)-(calculateDeckSize(dealerDeck)/2),0);
            await deckToImage(player.deck,(canvas.width/2)-(calculateDeckSize(player.deck)/2),500);
            ctx.textAlign="center";
            ctx.font="40px MuseoModerno";
            ctx.fillStyle="#fffa";
            ctx.fillText("Dealer's hand",canvas.width/2,350);
            ctx.fillText(`${message.guild.members.cache.get(player.id).user.username}'s hand`,canvas.width/2,850);
            resolve(canvas.toBuffer());
          }catch(error){
            reject(error);
          };
        });
      };
      function createDeck(deck){
        const emojiDeck=[];
        const valueDeck=[];
        var allValue=0;
        deck.forEach(card=>{
          const cardValue=cardToNumber(card);
          if(!cardValue.number)return;
          allValue+=cardValue.number;
          valueDeck.push(cardValue.number);
          emojiDeck.push(`**${cardValue.number}** ${cardValue.emoji}`);
        });
        reduceValue(emojiDeck,valueDeck,allValue);
        function reduceValue(emojiDeck,valueDeck,allValue){
          if(valueDeck.includes(1)&&allValue+10<=21){
            allValue+=10;
            const oneIndex=valueDeck.indexOf(1);
            valueDeck[oneIndex]=11;
            emojiDeck[oneIndex]=emojiDeck[oneIndex].replace("1","11");
            reduceValue(emojiDeck,valueDeck,allValue);
          };
        };
        return{emojiDeck,allValue};
      };
      async function registerTurn(valueDeck,user){
        scores.push({deckValue:valueDeck.allValue,user});
        curTurn++;
        if(valueDeck.allValue==21){
          return new EndMessage({
            channel:message.channel,
            winners:[user.id],
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            reason:`${message.guild.members.cache.get(user.id).user.username} made a blackjack!`,
            losers:players.filter(p=>p!=user.id),
            rules:module.exports.description,
            icon:module.exports.icon
          }).send();
        }else{
          if(scores.length>=allPlayers.length){
            const toHitNumber=Math.floor(Math.random()*3);
            if(!toHitNumber)dealerDeck.push(lowCards[Math.floor(Math.random()*lowCards.length)]);
            const uDeck=createDeck(user.deck);
            const dDeck=createDeck(dealerDeck);
            const gameBuffer=await gamePicture(user,dealerDeck);
            botMessage.attachments.clear();
            addImage(gameBuffer);
            botMessage.files=[new Discord.MessageAttachment(gameBuffer,"blackjack.jpg")];
            botMessage.components=[];
            botMessage.content=`${message.guild.members.cache.get(user.id).user}'s hand: ${uDeck.emojiDeck.join(" ")} (${uDeck.allValue})\nDealer's hand: ${dDeck.emojiDeck.join(" ")} (${dDeck.allValue})\n** **`;
            refreshMessage();
            const winners=[];
            const losers=[];
            const equals=[];
            allPlayers.forEach(p=>{
              const deckValue=createDeck(p.deck);
              if(deckValue.allValue>21)losers.push(p.id);
              else{
                if(deckValue.allValue>dDeck.allValue)winners.push(p.id);
                if(deckValue.allValue<dDeck.allValue)losers.push(p.id);
                if(deckValue.allValue==dDeck.allValue)equals.push(p.id);
              };
            });
            if(winners.length&&losers.length)equals.push(client.user.id);
            else if(!winners.length&&!losers.length)equals.push(client.user.id);
            else if(!winners.length&&!equals.length)winners.push(client.user.id);
            else if(!losers.length&&!equals.length)losers.push(client.user.id);
            return new EndMessage({
              channel:message.channel,
              equals,winners,losers,
              game:module.exports.gameName,
              gameStart:gameStart,
              hostId:message.author.id,
              reason:`Everyone played`,
              rules:module.exports.description,
              icon:module.exports.icon
            }).send();
          }else playTurn(utils.loopIdGetter(allPlayers,curTurn));
        };
      };
      async function playTurn(player){
        const userDeck=player.deck;
        const gameBuffer=await gamePicture(player,hiddenDeck);
        botMessage.attachments.clear();
        botMessage.files=[new Discord.MessageAttachment(gameBuffer,"blackjack.jpg")];
        botMessage.components=[
          new Discord.MessageActionRow()
          .addComponents(
            new Discord.MessageButton()
            .setCustomId("hit")
            .setStyle("PRIMARY")
            .setLabel("Hit")
            .setEmoji("🤚"),
            new Discord.MessageButton()
            .setCustomId("keep")
            .setStyle("PRIMARY")
            .setLabel("Keep")
            .setEmoji("🃏")
          )
        ];
        var uDeck=createDeck(userDeck);
        const dDeck=createDeck(hiddenDeck);
        botMessage.content=`${message.guild.members.cache.get(player.id).user}'s hand: ${uDeck.emojiDeck.join(" ")} (${uDeck.allValue})\nDealer's hand: ${dDeck.emojiDeck.join(" ")} (${dDeck.allValue})\n** **`;
        refreshMessage();
        const collector=botMessage.createMessageComponentCollector({
          time:3e4,
          filter:b=>b.user.id==utils.loopIdGetter(allPlayers,curTurn).id
        });
        client.addListener("gameDelete",endGame);
        function endGame(gameId){
          if(gameId!=message.author.id)return;
          collector.stop();
          client.removeListener("gameDelete",endGame);
        };
        collector.on("collect",async button=>{
          button.deferUpdate().catch(()=>{});
          if(button.customId=="hit"){
            allPlayers.find(p=>p.id==utils.loopIdGetter(allPlayers,curTurn).id).deck.push(lowCards[Math.floor(Math.random()*lowCards.length)]);
            uDeck=createDeck(userDeck);
            if(uDeck.allValue>=21)return registerTurn(uDeck,player);
            const gameBuffer=await gamePicture(utils.loopIdGetter(allPlayers,curTurn),hiddenDeck);
            botMessage.attachments.clear();
            addImage(gameBuffer);
            botMessage.files=[new Discord.MessageAttachment(gameBuffer,"blackjack.jpg")];
            botMessage.content=`${message.guild.members.cache.get(player.id).user}'s hand: ${uDeck.emojiDeck.join(" ")} (${uDeck.allValue})\nDealer's hand: ${dDeck.emojiDeck.join(" ")} (${dDeck.allValue})\n** **`;
            refreshMessage();
          };
          if(button.customId=="keep")return registerTurn(uDeck,player);
        });
        collector.on("end",collected=>{
          client.removeListener("gameDelete",endGame);
          if(!collected.size)registerTurn(uDeck,player);
        });
      };
      playTurn(utils.loopIdGetter(allPlayers,curTurn));
    });
  },
  name:"blackjack",
  gameName:"Blackjack",
  aliases:["bj"],
  description:"If a player's first two cards are an ace and a \"ten-card\" (a picture card or 10), giving a count of 21 in two cards, this is a natural or \"blackjack.\" If any player has a natural and the dealer does not, the dealer immediately pays that player one and a half times the amount of their bet.",
  category:"game",
  shortRules:"To play to the blackjack",
  exemples:`\`${process.env.BOT_PREFIX}blackjack\` <- no args required`,
  cooldown:1.5e4
};
function cardToNumber(card){
  if(card=="card_back.png")return{number:0,emoji:"❓"};
  const emoji=`:${card.split("_")[2].split(".")[0]}:`;
  card=card.split("_")[0];
  if(card=="ace")return{number:1,emoji};
  if(card=="jack")return{number:11,emoji};
  if(card=="queen")return{number:12,emoji};
  if(card=="king")return{number:13,emoji};
  return{number:parseInt(card),emoji};
};