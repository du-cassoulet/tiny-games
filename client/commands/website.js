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
  func:async({client,message})=>{
    message.reply({
      embeds:[
        new Discord.MessageEmbed()
        .setURL(`https://du-cassoulet.github.io/tinygamesweb/`)
        .setTitle(`Click here to go to the website of ${client.user.username}`)
        .setColor("#ff5757")
      ]
    });
  },
  name:"website",
  description:"To go to the official website.",
  category:"utility",
  shortRules:"To go to the official website.",
  exemples:`\`${process.env.BOT_PREFIX}website\` <- no args required`,
  cooldown:1e3
};