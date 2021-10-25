const Discord=require("discord.js");
const ms=require("ms");
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
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1,
      message:message,
      rules:module.exports.description,
      gamemodes:[
        {
          label:language.NORMAL_MODE,
          description:language.LARGE_PALETTE,
          emoji:"🔰"
        },
        {
          label:language.CLOCKS,
          description:language.ONLY_CLOCKS,
          emoji:"🕐"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      const startDate=new Date();
      const block="718506491660992735";
      const bigPalette=["😈","👿","👹","👺","💀","☠","👻","👽","👾","🤖","💩","😺","🙈","🐶","🐺","🐱","🦁","🐯","🦒","🦊","🦝","🐷","🐹","🐰","🦓","🐔","🐲","🐨","🐾","🐕‍🦺","🦏","🐈","🐽","🦙","🐁","🦦","👄","👅","🦷","🦴","👀","👁","👥","👤","🦂","🕷","🧞‍♀️","🦠","🗣","🦿","🦾","🧠","👊","👆","✋","🎈","🎆","🎞","🧧","🎪","🧵","🎀","🩲","🥿","👝","👞","🏉","🛷","🏑","🏅","🏆","🎰","🎮","🧩","🔈","🪕","🎧","🎷","🔓","🧬","🗝","⚗","🩸","🔋","🖥","📹","🕯","🔦","📚","📧","📥","📰","📦","📌","🖇","⌚","🕰","🗑","🗃","🍕","🍟","🍔","🥚","🥞","🍗","🥠","🦪","🍦","🍰","🍫","🍩","🥃","🍽","🍌","🍇","🍄","🌻","🍓","💐","🥔","🍁","🌰","🌳","🚗","🚜","🚐","🦼","🚟","🚁","⛵","🚨","🚧","🌋","🏕","🏖","⛩","🗽","⛺","🪑","🌗","🌓","🌚","🌂","🌀","⛱","🌊","❤","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💦","💫","💨","⛔","❌","⭕","🛑","✅","✔","💲","💱","➕","➖","✖","➗","🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","🔺","🔻","👁‍🗨","💬","🕑","💭"];
      if(gamemode==language.NORMAL_MODE.toLowerCase().replace(/ /g,"_")){
        var allEmojis=bigPalette;
      }else if(gamemode==language.CLOCKS.toLowerCase().replace(/ /g,"_")){
        var allEmojis=["🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛","🕜","🕝","🕞","🕟","🕠","🕡","🕢","🕣","🕤","🕥","🕦","🕧"];
      }else var allEmojis=bigPalette;
      const emojis=[];
      for(let i=0;i<10;i++){
        const emoji=allEmojis[Math.floor(Math.random()*allEmojis.length)];
        emojis.push(emoji);
        allEmojis.splice(allEmojis.indexOf(emoji),1);
      };
      const[discover,miss]=[1,0];
      const rows=[];
      const map=[[],[],[],[],[]];
      const dMap=[[],[],[],[],[]];
      const discovered=[];
      const time=1e5;
      const startTime=Date.now();
      const collection=[];
      const remainingTime=(long=false)=>ms(startTime+time-Date.now(),{long});
      var deck=[];
      var canPlay=true;
      var firstCard=true;
      var choice={};
      var score=0;
      var results=[];
      var ended=false;
      const itemsPerRows=4;
      for(let i=0;i<emojis.length*2;i++){
        if(i<emojis.length)deck.push(emojis[i]);
        else deck.push(emojis[i-emojis.length]);
      };
      deck=utils.shuffle(deck);
      for(let i=0;i<map.length;i++){
        var row=[];
        for(let j=0;j<itemsPerRows;j++){
          map[i].push(deck[i*itemsPerRows+j]);
          dMap[i].push(block);
          row.push(
            new Discord.MessageButton().setEmoji(block).setCustomId(`crd${j}:${i}`).setStyle("SECONDARY")
          );
        };
        row=new Discord.MessageActionRow().addComponents(...row);
        rows.push(row);
      };
      if(players.length>1){
        const playerCards=players.map(playerId=>{
          return{id:playerId,cards:[]};
        });
        var curTurn=0;
        function content(){
          return`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,curTurn)).user}\n**${language.TURNS}:** ${results.length}\n${playerCards.map(player=>{
            return`- ${message.guild.members.cache.get(player.id).user.username}: [${player.cards.join(" ")||language.NO_CARDS}]`
          }).join("\n")}`;
        };
        botMessage.components=rows;
        botMessage.content=content();
        await botMessage.edit({
          content:botMessage.content,
          components:botMessage.components,
          embeds:[]
        });
        createCollector();
        function createCollector(){
          const filter=button=>button.user.id==utils.loopIdGetter(players,curTurn);
          const collector=botMessage.createMessageComponentCollector({filter,time,max:2});
          client.addListener("gameDelete",endGame);
          function endGame(gameId){
            if(gameId!=message.author.id)return;
            ended=true;
            collector.stop();
            client.removeListener("gameDelete",endGame);
          };
          collector.on("collect",async button=>{
            await button.deferUpdate().catch(()=>{});
            button.customId=button.customId.slice(3);
            var[x,y]=button.customId.split(":");
            y=parseInt(y);
            x=parseInt(x);
            if(firstCard){
              botMessage.components[y].components[x].setStyle("PRIMARY");
              botMessage.components[y].components[x].setEmoji(map[y][x]);
              await botMessage.edit({
                embed:content(),
                components:botMessage.components
              });
              choice={emoji:map[y][x],x,y};
              firstCard=false;
            }else{
              botMessage.components[y].components[x].setEmoji(map[y][x]);
              if(map[y][x]==choice.emoji){
                botMessage.components[y].components[x].setStyle("SUCCESS");
                botMessage.components[choice.y].components[choice.x].setStyle("SUCCESS");
                score+=2;
                discovered.push({x,y});
                discovered.push({x:choice.x,y:choice.y});
                dMap[y][x]=choice.emoji;
                dMap[choice.y][choice.x]=choice.emoji;
                playerCards.find(player=>player.id==button.user.id).cards.push(map[y][x]);
              }else{
                botMessage.components[y].components[x].setStyle("DANGER");
                botMessage.components[choice.y].components[choice.x].setStyle("DANGER");
                results.push(miss);
              };
              await botMessage.edit({
                embed:content(),
                components:botMessage.components
              });
              if(score>=20){
                ended=true;
                const endMessage=new EndMessage({icon:module.exports.icon,
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:startDate
                });
                const winner=playerCards.sort((a,b)=>b.cards.length-a.cards.length)[0];
                const loser=playerCards.sort((a,b)=>b.cards.length-a.cards.length)[1];
                if(winner.cards.length==loser.cards.length){
                  endMessage.equals=[winner.id,loser.id];
                  endMessage.reason=language.EQUALITY;
                }else{
                  endMessage.winners=[winner.id];
                  endMessage.losers=[loser.id];
                  endMessage.reason=`${message.guild.members.cache.get(winner.id).user.username} ${language.WON_THE_GAME}`;
                };
                endMessage.send();
              };  
              setTimeout(async()=>{
                botMessage.components[y].components[x].setStyle("SECONDARY");
                botMessage.components[choice.y].components[choice.x].setStyle("SECONDARY");
                if(map[y][x]!=choice.emoji){
                  botMessage.components[y].components[x].setEmoji(block);
                  botMessage.components[choice.y].components[choice.x].setEmoji(block);
                  curTurn++;
                };
                await botMessage.edit({
                  content:content(),
                  components:botMessage.components
                });
                firstCard=true;
                choice={};
                if(!ended)createCollector();
              },2e3);
            };
          });
          collector.on("end",()=>{
            client.removeListener("gameDelete",endGame);
          });
        };
      }else{
        function content(){
          return`**${language.SCORE}:** ${score} • **${language.TURNS}:** ${results.length} • **${language.TIME_REMAINING}:** ${remainingTime()}`;
        };
        botMessage.components=rows;
        botMessage.content=content();
        await botMessage.edit({
          content:botMessage.content,
          components:botMessage.components,
          embeds:[]
        });
        const filter=buttons=>buttons.user.id==players[0];
        const collect=botMessage.createMessageComponentCollector({filter,time});
        client.addListener("gameDelete",endGame);
        function endGame(gameId){
          if(gameId!=message.author.id)return;
          ended=true;
          collect.stop();
          client.removeListener("gameDelete",endGame);
        };
        setTimeout(async()=>{
          if(ended)return;
          ended=true;
          return new EndMessage({icon:module.exports.icon,
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:startDate,
            hostId:message.author.id,
            losers:players,
            reason:language.YOU_LOST_GAME,
            rules:module.exports.description,
          }).send();
        },time);
        collect.on("collect",async button=>{
          await button.deferUpdate().catch(()=>{});
          if(ended)return;
          if(!canPlay)return;
          canPlay=false;
          button.customId=button.customId.slice(3);
          var[x,y]=button.customId.split(":");
          y=parseInt(y);
          x=parseInt(x);
          if(discovered.find(pos=>pos.x==x&&pos.y==y)||choice.x==x&&choice.y==y){
            botMessage.components[y].components[x].setStyle("DANGER");
            await botMessage.edit({
              embed:content(),
              components:botMessage.components
            });
            setTimeout(async()=>{
              if(choice.x==x&&choice.y==y){
                botMessage.components[y].components[x].setStyle("PRIMARY");
              }else{
                botMessage.components[y].components[x].setStyle("SECONDARY");
              };
              await botMessage.edit({
                content:content(),
                components:botMessage.components
              });
              canPlay=true;
            },2e3);
          }else{
            botMessage.components[y].components[x].setEmoji(map[y][x]);
            if(firstCard){
              if(ended)return;
              botMessage.components[y].components[x].setStyle("PRIMARY");
              await botMessage.edit({
                content:content(),
                components:botMessage.components
              });
              firstCard=false;
              canPlay=true;
              choice={emoji:map[y][x],x,y};
            }else{
              if(map[y][x]==choice.emoji){
                botMessage.components[y].components[x].setStyle("SUCCESS");
                botMessage.components[choice.y].components[choice.x].setStyle("SUCCESS");
                score+=2;
                discovered.push({x,y});
                discovered.push({x:choice.x,y:choice.y});
                dMap[y][x]=choice.emoji;
                dMap[choice.y][choice.x]=choice.emoji;
                collection.push(choice.emoji);
                results.push(discover);
              }else{
                botMessage.components[y].components[x].setStyle("DANGER");
                botMessage.components[choice.y].components[choice.x].setStyle("DANGER");
                results.push(miss);
              };
              await botMessage.edit({
                content:content(),
                components:botMessage.components
              });
              if(score>=20){
                ended=true;
                return new EndMessage({icon:module.exports.icon,
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:startDate,
                  hostId:message.author.id,
                  winners:players,
                  reason:language.YOU_WON_GAME,
                  rules:module.exports.description,
                }).send();
              };
              if(ended)return;
              setTimeout(async()=>{
                botMessage.components[y].components[x].setStyle("SECONDARY");
                botMessage.components[choice.y].components[choice.x].setStyle("SECONDARY");
                if(map[y][x]!=choice.emoji){
                  botMessage.components[y].components[x].setEmoji(block);
                  botMessage.components[choice.y].components[choice.x].setEmoji(block);
                };
                await botMessage.edit({
                  content:content(),
                  components:botMessage.components
                });
                canPlay=true;
                firstCard=true;
                choice={};
              },2e3);
            };
          };
        });
        collect.on("end",()=>{
          client.removeListener("gameDelete",endGame);
        });
      };
    });
  },
  name:"memory",
  aliases:["memo"],
  description:"The rules are simple, the person with the most cards at the end of the game wins, if you play alone, you must finish the game before the time limit. The player must turn over two cards, if they match, he can play again, otherwise it's the other player's turn.",
  category:"game",
  shortRules:"To play to the memory",
  exemples:`\`${process.env.BOT_PREFIX}memory\` <- no args required`,
  gameName:"Memory",
  icon:"https://i.imgur.com/w57tcNU.png",
  cooldown:1.5e3
};