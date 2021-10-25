const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const utils=require("../utils/utils");
const Language=require("../../miscellaneous/languages/en.json");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[],
   *  language:Language
   * }} param0 
   */
  func:async({client,message,language})=>{
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1
    });
    lobby.start(async(players,botMessage)=>{
      function randint(min,max){
        min=Math.ceil(min);
        max=Math.floor(max);
        return Math.floor(Math.random()*(max-min+1))+min;
      };
      const gameStart=Date.now();
      if(players.length<2)players.push(client.user.id);
      const inGamePlayers=[...utils.shuffle(players)];
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:botMessage.embeds
      });
      const emojis=["⬛","<:stick:889048643397627904>"];
      const restSticks=[];
      const fillSticks=[];
      const maxSticks=Math.floor(Math.random()*10)+10;
      for(let i=0;i<maxSticks;i++)restSticks.push(emojis[1]);
      const remove3=new Discord.MessageButton().setCustomId("3").setLabel(language.REMOVE3).setStyle("SECONDARY");
      const remove2=new Discord.MessageButton().setCustomId("2").setLabel(language.REMOVE2).setStyle("SECONDARY");
      const remove1=new Discord.MessageButton().setCustomId("1").setLabel(language.REMOVE1).setStyle("SECONDARY");
      const row=new Discord.MessageActionRow().addComponents(remove3,remove2,remove1);
      var turn=0;
      botMessage.embeds=[];
      botMessage.components=[row];
      botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(inGamePlayers,turn)).user}\n${restSticks.join(" ")} ${fillSticks.join(" ")}\n${restSticks.join(" ")} ${fillSticks.join(" ")}\n${restSticks.join(" ")} ${fillSticks.join(" ")}`;
      refreshMessage();
      applyBotTurn();
      const collector=botMessage.createMessageComponentCollector({time:3e5});
      client.addListener("gameDelete",endGame);
      function endGame(gameId){
        if(gameId!=message.author.id)return;
        collector.stop();
        client.removeListener("gameDelete",endGame);
      };
      collector.on("collect",async button=>{
        await button.deferUpdate().catch(()=>{});
        if(button.user.id!=utils.loopIdGetter(inGamePlayers,turn))return;
        turn++;
        const stickNumber=parseInt(button.customId);
        removeSticks(stickNumber);
        const end=checkEnd(utils.loopIdGetter(inGamePlayers,turn+1));
        if(!end)applyBotTurn();
        botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(inGamePlayers,turn)).user}\n${restSticks.join(" ")} ${fillSticks.join(" ")}\n${restSticks.join(" ")} ${fillSticks.join(" ")}\n${restSticks.join(" ")} ${fillSticks.join(" ")}`;
        refreshMessage();
      });
      collector.on("end",()=>{
        client.removeListener("gameDelete",endGame);
      });
      function playBotTurn(){
        var stickAmount=randint(1,3);
        if(restSticks.length>1&&restSticks.length<5)stickAmount=restSticks.length-1;
        removeSticks(stickAmount);
        turn++;
      };
      function applyBotTurn(){
        if(utils.loopIdGetter(inGamePlayers,turn)==client.user.id){
          setTimeout(()=>{
            playBotTurn();
            checkEnd(client.user.id);
            botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(inGamePlayers,turn)).user}\n${restSticks.join(" ")} ${fillSticks.join(" ")}\n${restSticks.join(" ")} ${fillSticks.join(" ")}\n${restSticks.join(" ")} ${fillSticks.join(" ")}`;
            refreshMessage();
          },randint(1e3,2e3));
        };
      };
      function removeSticks(num){
        if(restSticks.length-num>=0){
          restSticks.length-=num;
          for(let i=0;i<num;i++)fillSticks.push(emojis[0]);
        }else{
          const turnNumber=(restSticks.length+1-num)*-1;
          restSticks.length=0;
          for(let i=0;i<turnNumber;i++)fillSticks.push(emojis[0]);
        };
      };
      function checkEnd(userTurn){
        if(restSticks.length<=0){
          collector.stop();
          new EndMessage({icon:module.exports.icon,
            channel:message.channel,
            winners:inGamePlayers.filter(playerId=>playerId!=userTurn),
            losers:inGamePlayers.filter(playerId=>playerId==userTurn),
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            reason:language.NO_STICKS,
            rules:module.exports.description
          }).send();
          return true;
        }else return false;
      };
    });
  },
  name:"sticks",
  aliases:["removesticks","stick","rs"],
  description:"You must remove one to three sticks from the board each turn, if you remove the last stick, you have lost the game!",
  category:"game",
  shortRules:"To play to sticks",
  exemples:`\`${process.env.BOT_PREFIX}sticks\` <- no args required`,
  gameName:"Sticks",
  icon:"https://i.imgur.com/Kumiad1.png",
  cooldown:1.5e4
};