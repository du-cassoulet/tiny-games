const Discord=require("discord.js");
const Game=require("../utils/Game");
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
    if(client.games.has(message.author.id))return message.reply({content:language.CANT_LEAVE});
    if(!client.inGame.has(message.author.id))return message.reply({content:language.NOT_INGAME});
    new Game.RemovePlayer({client,userId:message.author.id});
  },
  name:"leave",
  aliases:["quit"],
  description:"To leave a game",
  category:"match",
  shortRules:"To leave a game",
  exemples:`\`${process.env.BOT_PREFIX}leave\` <- no args required`,
  cooldown:1e3
};