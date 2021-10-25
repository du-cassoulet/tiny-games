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
  func:async({message,args,language})=>{
    if(!message.member.permissions.has("ADMINISTRATOR"))return message.reply({content:`<:off:869978532489617458> ${language.NO_PERM}\n${language.REQUIRED_PERM}: [ADMINISTRATOR]`});
    if(!args.length||args.length>3)return message.reply({content:language.PREFIX_MAXCHARS});
    db.set(`${message.guild.id}-prefix`,args[0].toLowerCase());
    message.reply({content:`\`${db.get(`${message.guild.id}-prefix`)}\` ${language.NEW_GUILD_PREFIX} 🔗`});
  },
  name:"setprefix",
  aliases:["sp","prefix"],
  description:"To set a new bot prefix for a server",
  category:"utility",
  shortRules:"To set a new bot prefix for a server",
  exemples:`\`${process.env.BOT_PREFIX}setprefix\` <- new prefix (max length:3)`,
  cooldown:5e3
};