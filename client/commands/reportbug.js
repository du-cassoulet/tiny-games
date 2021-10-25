const Discord=require("discord.js");
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
  func:async({client,message,args,language})=>{
    const ownerId="532631412717649941";
    if(!args[0])return message.reply({content:language.DESCRIBE_BUG});
    if(message.author.id==ownerId){
      const user=client.users.cache.get(args[0]);
      if(!args[1])return message.reply({content:"You have to write an answer"});
      if(!user)return message.reply({content:"This user don't exist"});
      user.send({content:`**Report answer:**\n${args.slice(1).join(" ")}`}).catch(()=>message.reply({content:"Can't send messages to this user"}));
    }else{
      const description=args.join(" ");
      const supportServer=client.guilds.cache.get("886602749280657448");
      const bugsChannel=supportServer.channels.cache.get("896046366923583530");
      bugsChannel.send(`<:failed:891063343874445392> **Reported:** <t:${Math.round(Date.now()/1000)}> — By **${message.author.tag}** [\`${message.author.id}\`]\n\`\`\`diff\n- ${description}\`\`\``);
      message.channel.send({content:language.BUG_SENT});
    };
  },
  name:"reportbug",
  aliases:["bug","rb"],
  description:"To report a bug",
  category:"utility",
  shortRules:"To report a bug",
  exemples:`\`${process.env.BOT_PREFIX}reportbug The bot don't displays emojis correctly\` <- bug description`,
  cooldown:3e4
};