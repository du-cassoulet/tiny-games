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
    const items=require("../../public/json/items.json");
    const embed=new Discord.MessageEmbed();
    function translateType(n){
      if(n==0)return{s:"Badge",p:"Badges"};
      if(n==1)return{s:"Theme",p:"Themes"};
    };
    function translateRarity(n){
      if(n==0)return{name:"<a:common:893932940906627082>",chance:50};
      if(n==1)return{name:"<a:rare:893932940814319676>",chance:35};
      if(n==2)return{name:"<a:epic:893932940424282143>",chance:15};
      if(n==3)return{name:"<a:unobtainable:893932940764016670>",chance:.01};
    };
    embed.setColor("#ff5757");
    embed.setFooter(`${language.DO} ${prefix}buy [<item-name>] ${language.BUY_SOMETHING}`);
    embed.setTitle(`${language.SHOP} 🛒`);
    items.forEach(item=>{
      embed.addField(`${item.value.emoji} ${item.name} ─ <:sand_dollar:893893210248728597> ${utils.numberWithCommas(item.price)}`,`${language.TYPE}: **${translateType(item.type).s.toLowerCase()}**\n${language.RARITY}: **${translateRarity(item.rarity).name} (${translateRarity(item.rarity).chance}%)**`,true);
    });
    embed.setDescription(`${language.CURRENT_BALANCE}: <:sand_dollar:893893210248728597> ${utils.numberWithCommas(db.get(`${message.author.id}.tokens.sand`)||0)} ─ <a:heart:893889889760845854> ${utils.numberWithCommas(db.get(`${message.author.id}.tokens.heart`)||0)} ─ <a:star:893889889756663849> ${utils.numberWithCommas(db.get(`${message.author.id}.tokens.star`)||0)}\n`);
    message.channel.send({embeds:[embed]});
  },
  name:"shop",
  description:"To get a of buyable items",
  category:"economy",
  shortRules:"To get a of buyable items",
  exemples:`\`${process.env.BOT_PREFIX}petshop\` <- no args`,
  cooldown:5e3
};