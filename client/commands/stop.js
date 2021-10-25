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
    if(!client.games.has(message.author.id))return message.reply({content:language.NOT_HOSTING});
    new Game.Delete({client,gameId:message.author.id});
  },
  name:"stop",
  description:"To stop the playing game",
  category:"match",
  shortRules:"To stop the playing game",
  exemples:`\`${process.env.BOT_PREFIX}stop\` <- no args required`,
  cooldown:1e3
};