const Discord=require("discord.js");
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
    const start=Date.now();
    await client.channels.cache.get("886339792785264640").send(start.toString());
    message.reply({content:`:ping_pong: ${language.PONG} **${(utils.numberWithCommas(Date.now()-start))}** ${language.MS}`});
  },
  name:"ping",
  description:"To get the bot's ping",
  category:"utility",
  shortRules:"To get the bot's ping",
  exemples:`\`${process.env.BOT_PREFIX}ping\` <- no args required`,
  cooldown:5e3
};