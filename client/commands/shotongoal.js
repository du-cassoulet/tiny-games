const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
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
      hostId:message.author.id,
      icon:module.exports.icon,
      maxPlayers:2,
      message:message,
      minPlayers:1,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const gameStart=Date.now();
      botMessage.embeds=[];
      const emojis=["<:N_:718506491660992735>","<:goalkeeper:888445197866926110>","<:pixilframe072:888448595219587142>","<:pixilframe068:888448049280589836>","<:pixilframe067:888447673143808031>"];
      const placements=[emojis[0],emojis[1],emojis[0]];
      const goal=[emojis[2],emojis[3],emojis[4]];
      var map=[goal.join(emojis[3]),placements.join(emojis[0])];
      const row=new Discord.MessageActionRow();
      row.addComponents(
        new Discord.MessageButton().setCustomId("left").setLabel(language.LEFT).setStyle("SECONDARY"),
        new Discord.MessageButton().setCustomId("center").setLabel(language.CENTER).setStyle("SECONDARY"),
        new Discord.MessageButton().setCustomId("right").setLabel(language.RIGHT).setStyle("SECONDARY")
      );
      botMessage.components=[row];
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:botMessage.embeds
      });
      const inGamePlayers=[...players];
      if(players.length>1){
        const goalkeeper=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
        const shooter=inGamePlayers[0];
        playGame(goalkeeper,shooter);
      }else playGame(client.user.id,inGamePlayers[0]);
      function playGame(goalkeeper,shooter){
        botMessage.content=`${message.guild.members.cache.get(shooter).user} ${language.IS_SHOOTER}\n${map.join("\n")}`;
        refreshMessage();
        var shooted=false;
        if(goalkeeper==client.user.id){
          randomlyMove();
          function randomlyMove(){
            if(!shooted)setTimeout(async()=>{
              const possibleIndexes=placements.map((gk,index)=>{
                return{index,gk};
              }).filter(u=>u.gk!=emojis[1]).map(u=>u.index);
              const randomPos=possibleIndexes[Math.floor(Math.random()*possibleIndexes.length)];
              placements[placements.indexOf(emojis[1])]=emojis[0];
              placements[randomPos]=emojis[1];
              map=[goal.join(emojis[3]),placements.join(emojis[0])];
              botMessage.content=`${message.guild.members.cache.get(shooter).user} ${language.IS_SHOOTER}\n${map.join("\n")}`;
              await refreshMessage();
              randomlyMove();
            },Math.floor(Math.random()*2e3)+5e2);
          };
        };
        const collector=botMessage.createMessageComponentCollector({
          time:3e5,
          filter:button=>inGamePlayers.includes(button.user.id)
        });
        client.addListener("gameDelete",endGame);
        function endGame(gameId){
          if(gameId!=message.author.id)return;
          shooted=true;
          collector.stop();
          client.removeListener("gameDelete",endGame);
        };
        collector.on("collect",async button=>{
          await button.deferUpdate().catch(()=>{});
          if(button.customId=="left"){
            if(button.user.id==shooter)shoot(0);
            else if(button.user.id==goalkeeper){
              placements[placements.indexOf(emojis[1])]=emojis[0];
              placements[0]=emojis[1];
              map=[goal.join(emojis[3]),placements.join(emojis[0])];
              botMessage.content=`${message.guild.members.cache.get(shooter).user} ${language.IS_SHOOTER}\n${map.join("\n")}`;
              refreshMessage();
            };
          }else if(button.customId=="center"){
            if(button.user.id==shooter)shoot(1);
            else if(button.user.id==goalkeeper){
              placements[placements.indexOf(emojis[1])]=emojis[0];
              placements[1]=emojis[1];
              map=[goal.join(emojis[3]),placements.join(emojis[0])];
              botMessage.content=`${message.guild.members.cache.get(shooter).user} ${language.IS_SHOOTER}\n${map.join("\n")}`;
              refreshMessage();
            };
          }else if(button.customId=="right"){
            if(button.user.id==shooter)shoot(2);
            else if(button.user.id==goalkeeper){
              placements[placements.indexOf(emojis[1])]=emojis[0];
              placements[2]=emojis[1];
              map=[goal.join(emojis[3]),placements.join(emojis[0])];
              botMessage.content=`${message.guild.members.cache.get(shooter).user} ${language.IS_SHOOTER}\n${map.join("\n")}`;
              refreshMessage();
            };
          };
          function shoot(index){
            collector.stop();
            shooted=true;
            const goalkeeperIndex=placements.indexOf(emojis[1]);
            if(goalkeeperIndex==index)return new EndMessage({icon:module.exports.icon,
              channel:message.channel,
              game:module.exports.gameName,
              gameStart:gameStart,
              hostId:message.author.id,
              losers:[shooter],
              winners:[goalkeeper],
              reason:language.CATCHED_BALL,
              rules:module.exports.description
            }).send();
            else return new EndMessage({icon:module.exports.icon,
              channel:message.channel,
              game:module.exports.gameName,
              gameStart:gameStart,
              hostId:message.author.id,
              losers:[goalkeeper],
              winners:[shooter],
              reason:language.GOAL,
              rules:module.exports.description
            }).send();
          };
        });
        collector.on("end",()=>{
          client.removeListener("gameDelete",endGame);
        });
      };
    });
  },
  name:"shotongoal",
  aliases:["sog","soccer"],
  description:"Shoot at the right place, if the goalkeeper is there, you have lost, if the goalkeeper is not there you have won!",
  category:"game",
  shortRules:"To play to a shot on goal game.",
  exemples:`\`${process.env.BOT_PREFIX}shotongoal\` <- no args required`,
  gameName:"Shot on goal",
  icon:"https://i.imgur.com/Gq4AuVT.png",
  cooldown:1.5e4
};