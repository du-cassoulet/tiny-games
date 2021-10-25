const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const ms=require("ms");
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
  func:({client,message,language})=>{
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:12,
      minPlayers:4
    });
    lobby.start(async(players,botMessage)=>{
      try{
        const startDate=new Date();
        var end=false;
        var curNight=0;
        var killed;
        const village=`<:N_:718506491660992735>      :new_moon:\n:house_abandoned::evergreen_tree: :house_with_garden: :deciduous_tree: :homes:       :ferris_wheel:    :house_abandoned: :busstop:    :deciduous_tree:\n<:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664><:road:879686312532250664>`;
        const IDtoUsername=id=>client.users.cache.get(id).username;
        const refreshMessage=async()=>botMessage.edit({
          content:botMessage.content,
          components:botMessage.components,
          embeds:botMessage.embeds,
          files:botMessage.attachments
        });
        playGame();
        async function playGame(){
          started=true;
          var murderDone=false;
          var inspectionDone=false;
          botMessage.content=`\\🌙 Night ${curNight}\n${village}`;
          botMessage.components=[];
          botMessage.embeds=[];
          refreshMessage();
          const inGamePlayers=[...players];
          const allPlayers=[...players];
          const murdererId=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
          const detectiveId=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
          players.forEach(async playerId=>{
            if(playerId==murdererId){
              if(curNight==0){
                client.users.cache.get(playerId).send({content:"🔪 "+language.YOU_ARE_MURDERER}).catch(()=>message.channel.send(`${language.CANT_SEND_TO} ${IDtoUsername(playerId)}`));;
              };
              const selector=new Discord.MessageSelectMenu().setCustomId("murderer_action").setMaxValues(1);
              const options=[];
              players.filter(userId=>userId!=playerId).forEach(playerId=>{
                options.push({
                  label:`Kill ${IDtoUsername(playerId)}`,
                  value:`kill-${playerId}`,
                  emoji:"🔪"
                });
              });
              options.push({
                label:"Skip",
                value:"skip",
                emoji:"⏩"
              });
              selector.addOptions(...options);
              const actionMessage=await client.users.cache.get(playerId).send({
                content:language.SELECT_ACTION,
                components:[
                  new Discord.MessageActionRow().addComponents(selector)
                ]
              }).catch(()=>message.channel.send(`${language.CANT_SEND_TO} ${IDtoUsername(playerId)}`));;
              const filter=component=>component.componentType=="SELECT_MENU";
              const collector=actionMessage.createMessageComponentCollector({filter,max:1,time:3e4});
              client.addListener("gameDelete",endGame);
              function endGame(gameId){
                if(gameId!=message.author.id)return;
                end=true;
                collector.stop();
                client.removeListener("gameDelete",endGame);
              };
              collector.on("collect",async menu=>{
                menu.deferUpdate();
                const choice=menu.values[0];
                const[action,userId]=choice.split("-");
                actionMessage.delete().catch(()=>{});
                if(action=="kill"){
                  players.splice(players.indexOf(userId),1);
                  killed=userId;
                  actionMessage.channel.send(`${language.YOU_KILLED} ${IDtoUsername(userId)}`);
                }else if(action=="skip")killed=undefined;
                murderDone=true;
                if(murderDone&&inspectionDone)turnToVote(allPlayers,murdererId,detectiveId);
              });
              collector.on("end",()=>{
                client.removeListener("gameDelete",endGame);
              });
            }else if(playerId==detectiveId){
              if(players.includes(detectiveId)){
                if(curNight==0){
                  client.users.cache.get(playerId).send({content:"🔍 "+language.YOU_ARE_DETECTIVE}).catch(()=>message.channel.send(`${language.CANT_SEND_TO} ${IDtoUsername(playerId)}`));;
                };
                const selector=new Discord.MessageSelectMenu().setCustomId("detective_action");
                const options=[];
                players.filter(userId=>userId!=playerId).forEach(playerId=>{
                  options.push({
                    label:`Inspect ${IDtoUsername(playerId)}`,
                    value:`inspect-${playerId}`,
                    emoji:"🔍"
                  });
                });
                options.push({
                  label:"Skip",
                  value:"skip",
                  emoji:"⏩"
                });
                selector.addOptions(...options);
                const actionMessage=await client.users.cache.get(playerId).send({
                  content:language.SELECT_ACTION,
                  components:[
                    new Discord.MessageActionRow().addComponents(selector)
                  ]
                }).catch(()=>message.channel.send(`${language.CANT_SEND_TO} ${IDtoUsername(playerId)}`));;
                const filter=component=>component.componentType=="SELECT_MENU";
                const collector=actionMessage.createMessageComponentCollector({filter,max:1,time:3e4});
                collector.on("collect",async menu=>{
                  menu.deferUpdate();
                  const choice=menu.values[0];
                  const[action,userId]=choice.split("-");
                  actionMessage.components=[]
                  actionMessage.edit({components:actionMessage.components});
                  if(action=="inspect"){
                    actionMessage.channel.send({
                      content:`${userId==murdererId?`${IDtoUsername(userId)} ${language.IS_MURDERER}`:`${IDtoUsername(userId)} ${language.IS_VILLAGER}`}`
                    });
                    setTimeout(()=>{
                      inspectionDone=true;
                      if(murderDone&&inspectionDone)turnToVote(allPlayers,murdererId,detectiveId);
                    },3e3);
                  }else if(action=="skip"){
                    inspectionDone=true;
                    if(murderDone&&inspectionDone)turnToVote(allPlayers,murdererId,detectiveId);
                  };
                });
              }else inspectionDone=true;
            }else{
              if(curNight==0){
                client.users.cache.get(playerId).send({content:"👥 "+language.YOU_ARE_VILLAGER}).catch(()=>message.channel.send(`${language.CANT_SEND_TO} ${IDtoUsername(playerId)}`));;
              };
              client.users.cache.get(playerId).send({content:language.YOU_MUST_WAIT}).catch(()=>message.channel.send(`${language.CANT_SEND_TO} ${IDtoUsername(playerId)}`));;
            };
          });
          setTimeout(()=>{
            if(!murderDone||!inspectionDone)turnToVote(allPlayers,murdererId,detectiveId);
          },3e4);
        };
        async function turnToVote(allPlayers,murdererId,detectiveId){
          end=await checkEnd(murdererId,allPlayers);
          if(end)return;
          curNight++;
          allPlayers.forEach(async playerId=>{
            const invite=await message.channel.createInvite();
            client.users.cache.get(playerId).send({
              content:`${language.ALL_ACTIONS_DONE}\n${invite}`
            }).catch(()=>{
              message.channel.send(`${language.CANT_SEND_TO} ${IDtoUsername(playerId)}`);
              new EndMessage({icon:module.exports.icon,
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                losers:[playerId],
                reason:language.VILLAGERS_WON,
                rules:module.exports.description,
                winners:allPlayers.filter(pid=>pid!=playerId),
                gameStart:startDate
              }).send();
            });
          });
          function numToChars(spNum,char=" "){
            var str="";
            for(let i=0;i<spNum;i++)str+=char;
            return str;
          };
          const playerVotes=[];
          players.forEach(playerId=>{
            playerVotes.push({
              id:playerId,
              voteNumber:0,
              voted:false
            });
          });
          function display(){
            return`\\🌙 ${language.NIGHT} ${curNight}\n${village.replace(":new_moon:",`${numToChars(40)}:sunny:`)}\n${killed?client.users.cache.get(killed).user:language.NO_ONE} ${language.HAVE_BEEN_KILLED}\n\n${language.VOTE_SOMEONE}:\n${playerVotes.map(player=>`<:None:870024851803492433> ${IDtoUsername(player.id)}: ${numToChars(player.voteNumber,":white_small_square: ")} (${player.voteNumber})`).join("\n")}`;
          };
          botMessage.content=display();
          const itemsPerRows=3;
          const rowNum=Math.ceil(players.length/itemsPerRows);
          const rows=[];
          for(let i=0;i<rowNum;i++){
            const components=[];
            players.slice(i*itemsPerRows,i*itemsPerRows+itemsPerRows).forEach(playerId=>{
              components.push(
                new Discord.MessageButton()
                  .setCustomId(`vote-${playerId}`)
                  .setLabel(`Vote ${IDtoUsername(playerId)}`)
                  .setStyle("SECONDARY")
              );
            });
            rows.push(new Discord.MessageActionRow().addComponents(...components));
          };
          botMessage.components=rows;
          if(!botMessage.thread)botMessage.startThread({name:language.MURDERER,reason:language.DEBATE_MURDERER}).catch(()=>{});
          refreshMessage();
          const votingTime=3e4;
          const voteEnd=Date.now()+votingTime;
          const filter=component=>component.componentType=="BUTTON"&&players.includes(component.user.id);
          const collector=botMessage.createMessageComponentCollector({filter,time:votingTime});
          var isEnded=false;
          collector.on("collect",async button=>{
            if(button.customId.startsWith("vote")){
              const user=playerVotes.find(player=>player.id==button.user.id);
              if(user.voted)return;
              user.voted=true;
              const userId=button.customId.split("-")[1];
              const player=playerVotes.find(player=>player.id==userId);
              player.voteNumber++;
              botMessage.content=display();
              if(playerVotes.filter(player=>player.voted).length==players.length)setTimeout(()=>{
                if(!isEnded)voteResults()
              },3e3);
              refreshMessage();
            };
          });
          setTimeout(()=>{
            if(botMessage.thread)botMessage.thread.send({content:`${language.VOTE_END} ${ms(voteEnd-Date.now(),{long:true})}`}).catch(()=>{});
          },votingTime-5e3);
          setTimeout(()=>{
            if(!isEnded)voteResults();
          },votingTime);
          async function voteResults(){
            isEnded=true;
            botMessage.components=[];
            if(botMessage.thread)botMessage.thread.delete().catch(()=>{});
            var maxVotes={userId:undefined,number:0};
            var isEquality=false;
            playerVotes.forEach(voter=>{
              if(voter.voteNumber>maxVotes.number){
                maxVotes.userId=voter.id;
                maxVotes.number=voter.voteNumber;
              };
            });
            playerVotes.forEach(voter=>{
              if(voter.voteNumber==maxVotes.number&&voter.id!=maxVotes.userId)isEquality=true;
            });
            if(isEquality){
              botMessage.content=`\\🌙 ${language.NIGHT} ${curNight}\n${village}\n<:off:869978532489617458> ${language.NO_ONE_KILLED}`;
            }else if(!maxVotes.userId){
              botMessage.content=`\\🌙 ${language.NIGHT} ${curNight}\n${village}\n<:off:869978532489617458> ${language.NO_ONE_VOTED}`;
            }else{
              players.splice(players.indexOf(maxVotes.userId),1);
              if(maxVotes.userId==murdererId){
                  botMessage.content=`\\🌙 ${language.NIGHT} ${curNight}\n${village}\n:skull_crossbones: ${IDtoUsername(maxVotes.userId)} ${language.WAS_MURDERER}`;
              }else if(maxVotes.userId==detectiveId){
                  botMessage.content=`\\🌙 ${language.NIGHT} ${curNight}\n${village}\n:skull_crossbones: ${IDtoUsername(maxVotes.userId)} ${language.WAS_DETECTIVE}`;
              }else{
                  botMessage.content=`\\🌙 ${language.NIGHT} ${curNight}\n${village}\n:skull_crossbones: ${IDtoUsername(maxVotes.userId)} ${language.WAS_VILLAGER}`;
              };
            };
            refreshMessage();
            end=await checkEnd(murdererId,allPlayers);
            if(end)return;
            setTimeout(()=>playGame(),5e3);
          };
        };
        async function checkEnd(murdererId,allPlayers){
          if(end||!players.length)return true;
          var hasMurderer=false;
          players.forEach(playerId=>{
            if(playerId==murdererId)hasMurderer=true;
          });
          if(!hasMurderer){
            new EndMessage({icon:module.exports.icon,
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              losers:[murdererId],
              reason:language.VILLAGERS_WON,
              rules:module.exports.description,
              winners:allPlayers.filter(playerId=>playerId!=murdererId),
              gameStart:startDate
            }).send();
            return true;
          }else if(players.length==1&&players[0]==murdererId){
            new EndMessage({icon:module.exports.icon,
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              winners:[murdererId],
              reason:language.MURDERER_WON,
              rules:module.exports.description,
              losers:allPlayers.filter(playerId=>playerId!=murdererId),
              gameStart:startDate
            }).send();
            return true;
          };
          return false;
        };
      }catch(_){};
    });
  },
  name:"murdermystery",
  aliases:["murder","mm","detective","assassin","murderer"],
  description:"The goal is to find out who the killer is before he kills everyone. To do this, a detective can inspect the players to determine who the killer is.",
  category:"game",
  shortRules:"To play to the murder",
  exemples:`\`${process.env.BOT_PREFIX}murder\` <- no args required`,
  gameName:"Murder mystery",
  icon:"https://i.imgur.com/kfOEsos.png",
  cooldown:1.5e4
};