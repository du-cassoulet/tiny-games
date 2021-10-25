const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const mathjs=require("mathjs");
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
  func:async({message,language})=>{
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:6,
      minPlayers:2
    });
    lobby.start(async(players,botMessage)=>{
      const inGamePlayers=[...players];
      const gameStart=Date.now();
      function randint(min,max){
        min=Math.ceil(min);
        max=Math.floor(max);
        return Math.floor(Math.random()*(max-min+1))+min;
      };
      botMessage.embeds=[];
      botMessage.components=[];
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:botMessage.embeds
      });
      var operation="";
      const operators=["+","-","*"];
      const operator=operators[Math.floor(Math.random()*operators.length)];
      if(operator==operators[0]){
        const fn=randint(-500,5000)/10;
        const ln=randint(-500,5000)/10;
        operation=`${fn} ${operator} ${ln}`;
      }else if(operator==operators[1]){
        const fn=randint(-500,5000)/10;
        const ln=randint(-500,5000)/10;
        operation=`${fn} ${operator} ${ln}`;
      }else if(operator==operators[2]){
        const fn=randint(-50,50);
        const ln=randint(-50,50);
        operation=`${fn} ${operator} ${ln}`;
      };
      const opResult=mathjs.round(mathjs.evaluate(operation)*100)/100;
      botMessage.content=`<:calculator:888485615233036350> **${language.ANSWER_OPERATION}:** ${operation}\n(${language.ROUNDED})`;
      refreshMessage();
      const collector=message.channel.createMessageCollector({
        time:3e5,
        filter:resMessage=>inGamePlayers.includes(resMessage.author.id)
      });
      client.addListener("gameDelete",endGame);
      function endGame(gameId){
        if(gameId!=message.author.id)return;
        ended=true;
        collector.stop();
        client.removeListener("gameDelete",endGame);
      };
      var ended=false;
      collector.on("collect",async resMessage=>{
        if(resMessage.content.toLowerCase().replace(/ /g,"")==opResult){
          ended=true;
          collector.stop();
          return new EndMessage({icon:module.exports.icon,
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            losers:inGamePlayers.filter(playerId=>playerId!=resMessage.author.id),
            winners:inGamePlayers.filter(playerId=>playerId==resMessage.author.id),
            reason:language.ANSWER_FOUND,
            rules:module.exports.description,
            additionalText:`${language.ANSWER_WAS} ${opResult}`
          }).send();
        }else{
          const iAnswer=await resMessage.reply({content:language.WRONG_ANSWER});
          setTimeout(()=>{
            if(iAnswer.deletable)iAnswer.delete();
          },3e3);
        };
      });
      collector.on("end",()=>{
        client.removeListener("gameDelete",endGame);
        if(!ended)return new EndMessage({icon:module.exports.icon,
          channel:message.channel,
          game:module.exports.gameName,
          gameStart:gameStart,
          hostId:message.author.id,
          losers:inGamePlayers,
          reason:language.END_INACTIVITY,
          rules:module.exports.description
        }).send();
      });
    });
  },
  name:"humancalculator",
  aliases:["fastcalculation","hc","fc"],
  description:"I ask you a calculation, you have to answer the correct answer at first to win the game, if you type an incorrect answer, you have to try again.",
  category:"game",
  shortRules:"To play to the human calculator game",
  exemples:`\`${process.env.BOT_PREFIX}humancalculator\``,
  gameName:"Human calculator",
  icon:"https://i.imgur.com/k4xggat.png",
  cooldown:5e3
};