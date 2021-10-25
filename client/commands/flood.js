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
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:3,
      message:message,
      minPlayers:1,
      rules:module.exports.description,
      gamemodes:[
        {
          label:language.EASY,
          description:`${language.BOARD}: 7x7, 14 ${language.TRYS}, 5 ${language.COLORS}`,
          emoji:"❤️"
        },
        {
          label:language.MEDIUM,
          description:`${language.BOARD}: 10x10, 22 ${language.TRYS}, 6 ${language.COLORS}`,
          emoji:"❤️‍🩹"
        },
        {
          label:language.HARD,
          description:`${language.BOARD}: 14x14, 26 ${language.TRYS}, 7 ${language.COLORS}`,
          emoji:"❤️‍🔥"
        },
        {
          label:language.IMPOSSIBLE,
          description:`${language.BOARD}: 14x14, 46 ${language.TRYS}, 9 ${language.COLORS}`,
          emoji:"💔"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      const gameStart=Date.now();
      var ended=false;
      if(gamemode==language.EASY.toLowerCase().replace(/ /g,"_")){
        var mapborder=7;
        var emojis=["🟥","🟧","🟨","🟩","🟦"];
        var avaliableTurns=14;
      }else if(gamemode==language.MEDIUM.toLowerCase().replace(/ /g,"_")){
        var mapborder=10;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪"];
        var avaliableTurns=22;
      }else if(gamemode==language.HARD.toLowerCase().replace(/ /g,"_")){
        var mapborder=14;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪","🟫"];
        var avaliableTurns=26;
      }else if(gamemode==language.IMPOSSIBLE.toLowerCase().replace(/ /g,"_")){
        var mapborder=14;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪","🟫","⬛","⬜"];
        var avaliableTurns=46;
      }else{
        var mapborder=10;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪"];
        var avaliableTurns=22;
      };
      const randomEmoji=()=>emojis[Math.floor(Math.random()*emojis.length)];
      const map=[];
      for(let y=0;y<mapborder;y++){
        const row=[];
        for(let x=0;x<mapborder;x++)row.push(randomEmoji());
        map.push(row);
      };
      function colorMap(emoji){
        colorAllAround(0,0,emoji);
        function colorAllAround(x,y,emoji){
          const oldColor=map[y][x];
          map[y][x]=emoji;
          if(map[y][x+1]==oldColor)colorAllAround(x+1,y,emoji);
          if(map[y][x-1]==oldColor)colorAllAround(x-1,y,emoji);
          if(map[y+1]&&map[y+1][x]==oldColor)colorAllAround(x,y+1,emoji);
          if(map[y-1]&&map[y-1][x]==oldColor)colorAllAround(x,y-1,emoji);
        };
      };
      function checkEnd(){
        var sameColorEverywhere=true;
        map.forEach(row=>row.forEach(color=>{
          if(color!=map[0][0])sameColorEverywhere=false;
        }));
        if(sameColorEverywhere){
          new EndMessage({icon:module.exports.icon,
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            winners:players,
            reason:language.PUZZLE_COMPLETED,
            rules:module.exports.description
          }).send();
          return true;
        }else if(!avaliableTurns){
          new EndMessage({icon:module.exports.icon,
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            losers:players,
            reason:language.TURNS_EXCEEDED,
            rules:module.exports.description
          }).send();
          return true;
        }else return false;
      };
      botMessage.edit({
        content:`${players.length>1?`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,avaliableTurns)).user}\n`:""}**${avaliableTurns}** ${language.TURNS_REMAINING}\n${map.map(row=>row.join("")).join("\n")}`,
        embeds:[],
        components:[]
      });
      emojis.forEach(emoji=>botMessage.react(emoji));
      const collector=botMessage.createReactionCollector({
        filter:(reaction,user)=>emojis.includes(reaction.emoji.name)&&players.includes(user.id),
        time:3e5
      });
      client.addListener("gameDelete",endGame);
      function endGame(gameId){
        if(gameId!=message.author.id)return;
        ended=true;
        collector.stop();
        client.removeListener("gameDelete",endGame);
      };
      collector.on("collect",(reaction,user)=>{
        const curPlayer=utils.loopIdGetter(players,avaliableTurns);
        try{reaction.users.remove(user.id)}catch(_){};
        if(user.id!=curPlayer)return;
        avaliableTurns--;
        if(reaction.emoji.name!=map[0][0])colorMap(reaction.emoji.name);
        botMessage.edit({content:`${players.length>1?`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,avaliableTurns)).user}\n`:""}**${avaliableTurns}** ${language.TURNS_REMAINING}\n${map.map(row=>row.join("")).join("\n")}`});
        const end=checkEnd();
        if(end||ended){
          ended=true;
          collector.stop();
          client.removeListener("gameDelete",endGame);
        };
      });
      collector.on("end",()=>{
        if(!ended){
          client.removeListener("gameDelete",endGame);
          new EndMessage({icon:module.exports.icon,
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            losers:players,
            reason:language.END_INACTIVITY,
            rules:module.exports.description
          }).send();
        };
      });
    });
  },
  name:"flood",
  description:"Click on the colors, all similar colors will change, if the board becomes a solid color before the 24 turns you have won the game!",
  category:"game",
  shortRules:"To play to the flood",
  exemples:`\`${process.env.BOT_PREFIX}flood\` <- no args required`,
  gameName:"Flood",
  icon:"https://i.imgur.com/UtW9HZX.png",
  cooldown:1.5e4
};