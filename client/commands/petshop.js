const Discord=require("discord.js");
const Language=require("../../miscellaneous/languages/en.json");
const db=require("quick.db");
const utils=require("../utils/utils");
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
    const prefix=db.get(`${message.guildId}-prefix`)||process.env.BOT_PREFIX;
    const pets=require("../../public/json/pets.json");
    const embed=new Discord.MessageEmbed();
    embed.setColor("#ff5757");
    embed.setFooter(`${language.DO} ${prefix}buy [<pet-name>] ${language.TO_BUY_PET}`);
    embed.setTitle(`${language.PET_SHOP} 🛍️`);
    pets.forEach(pet=>{
      embed.addField(`${pet.emoji} ${pet.name.charAt(0).toUpperCase()+pet.name.slice(1)} ─ <a:star:893889889756663849> ${pet.price}`,`Health: **${pet.hp}**\nStrength: **${pet.strength}**\nSpeed: **${pet.speed}**`,true);
    });
    embed.setDescription(`Current Balance: <:sand_dollar:893893210248728597> ${utils.numberWithCommas(db.get(`${message.author.id}.tokens.sand`)||0)} ─ <a:heart:893889889760845854> ${utils.numberWithCommas(db.get(`${message.author.id}.tokens.heart`)||0)} ─ <a:star:893889889756663849> ${utils.numberWithCommas(db.get(`${message.author.id}.tokens.star`)||0)}\n`);
    message.channel.send({embeds:[embed]});
  },
  name:"petshop",
  aliases:["ps"],
  description:"To get a list of pets",
  category:"economy",
  shortRules:"To get a list of pets",
  exemples:`\`${process.env.BOT_PREFIX}petshop\` <- no args`,
  cooldown:5e3
};