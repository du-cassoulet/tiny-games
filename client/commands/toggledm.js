const Discord=require("discord.js");
const db=require("quick.db");
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
    if(!db.get(`${message.author.id}.dm`))db.set(`${message.author.id}.dm`,true);
    else db.delete(`${message.author.id}.dm`);
    message.reply({
      content:`<:alert:893940712708669440> ${language.YOU_WILL} ${db.get(`${message.author.id}.dm`)?language.RECIEVE:language.STOP_RECIEVING} ${language.LEVEL_PROGRESSION_DM}`
    });
  },
  name:"toggledm",
  aliases:["tdm"],
  description:"To toggle DMs",
  category:"utility",
  shortRules:"To toggle DMs",
  exemples:`\`${process.env.BOT_PREFIX}toggledm\` <- no args required`,
  cooldown:1.5e4
};