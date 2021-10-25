const Discord=require("discord.js");
const Language=require("../../miscellaneous/languages/en.json");
const db=require("quick.db");
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
    const languages=Object.values(require("../../public/json/languages.json"));
    if(!args.length)return message.reply({content:language.NO_LANG});
    var lang=languages.find(l=>l.LCID.toLowerCase().replace(/-/g,"")==args[0].toLowerCase().replace(/[ \-_]/g,""));
    if(!lang)lang=languages.find(l=>l.code==args[0].toLowerCase());
    if(!lang)lang=languages.find(l=>l.lang.toLowerCase()==args[0].toLowerCase());
    if(!lang)return message.reply({content:`**${language.WRONG_LANG}**\n${languages.map(lan=>`${lan.flag} ${lan.lang}: ${lan.LCID} (${lan.code})`).join("\n")}`});
    db.set(`${message.guild.id}-lang`,lang.code);
    const newLang=require(`../../miscellaneous/languages/${lang.code}.json`);
    message.reply({content:`${lang.flag} **${lang.lang}** ${newLang.NEW_LANGUAGE}`});
  },
  name:"setlanguage",
  aliases:["setlang","language","lang","sl"],
  description:"To change the server's language",
  category:"utility",
  shortRules:"To change the server's language",
  exemples:`\`${process.env.BOT_PREFIX}setlanguage en-US\` <- language LCID
\`${process.env.BOT_PREFIX}setlanguage en\` <- language code
\`${process.env.BOT_PREFIX}setlanguage english\` <- language name`,
  cooldown:5e3
};