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
  func:async({client,message,language})=>{
    message.reply({
      embeds:[
        new Discord.MessageEmbed()
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=388161&scope=bot`)
        .setTitle(`${language.CLICK_INVITE} ${client.user.username}`)
        .setDescription(`[${language.NEED_ALL_PERMISSIONS} ${client.user.username} ${language.TO_WORK}](https://discordapi.com/permissions.html#388161)`)
        .setColor("#ff5757")
      ]
    });
  },
  name:"invite",
  aliases:["inv","invitebot"],
  description:"To invite me to your server",
  category:"utility",
  shortRules:"To invite me to your server",
  exemples:`\`${process.env.BOT_PREFIX}invite\` <- no args required`,
  cooldown:1.5e3
};