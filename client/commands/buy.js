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
  func:async({message,args,language})=>{
    const toFindable=str=>str.toLowerCase().replace(/[_ \-]/g,"");
    const pets=require("../../public/json/pets.json");
    const items=require("../../public/json/items.json");
    const backgrounds=require("../../public/json/backgrounds.json");
    const currencies=[
      {name:"sand",icon:"<:sand_dollar:893893210248728597>",features:items},
      {name:"heart",icon:"<a:heart:893889889760845854>",features:backgrounds},
      {name:"star",icon:"<a:star:893889889756663849>",features:pets}
    ];
    const tokens=db.get(`${message.author.id}.tokens`);
    if(!args.length)return message.reply({content:`You have to give me something to buy`});
    var item={
      data:currencies[0].features.find(i=>toFindable(i.name)==toFindable(args.join(""))),
      currency:{name:currencies[0].name,icon:currencies[0].icon},
      category:0
    };
    if(!item.data)item={
      data:currencies[1].features.find(i=>toFindable(i.name)==toFindable(args.join(""))),
      currency:{name:currencies[1].name,icon:currencies[1].icon},
      category:1
    };
    if(!item.data)item={
      data:currencies[2].features.find(i=>toFindable(i.name)==toFindable(args.join(""))),
      currency:{name:currencies[2].name,icon:currencies[2].icon},
      category:2
    };
    if(!item.data)return message.reply({content:`${language.CANT_FIND_ITEM} **${args.join(" ")}**`});
    if(item.category==0&&item.data.type==0&&db.get(`${message.author.id}.badges`).includes(item.data.value.emoji))return message.reply({content:language.ALREADY_OWN_BADGE});
    if(item.category==0&&item.data.type==1&&db.get(`${message.author.id}.themes`).includes(item.data.name.toLowerCase().replace(/ /g,"_")))return message.reply({content:language.ALREADY_OWN_THEME});
    if(item.category==1&&db.get(`${message.author.id}.bgs`).includes(currencies[1].features.findIndex(e=>e.name==item.data.name)))return message.reply({content:language.ALREADY_OWN_BG});
    if(item.category==2&&db.get(`${message.author.id}.pets`).includes(item.data.emoji))return message.reply({content:language.ALREADY_OWN_PET});
    if(tokens[item.currency.name]<item.data.price)return message.reply({content:`${language.DONT_HAVE_ENOUGH} **${item.currency.name}** ${language.TO_BUY_ITEM} (${item.currency.icon} ${utils.numberWithCommas(item.data.price)})`});
    db.subtract(`${message.author.id}.tokens.${item.currency.name}`,item.data.price);
    if(item.category==0&&item.data.type==0)db.push(`${message.author.id}.badges`,item.data.value.emoji);
    if(item.category==0&&item.data.type==1)db.push(`${message.author.id}.themes`,item.data.name.toLowerCase().replace(/ /g,"_"));
    if(item.category==1)db.push(`${message.author.id}.bgs`,currencies[1].features.findIndex(e=>e.name==item.data.name));
    if(item.category==2)db.push(`${message.author.id}.pets`,item.data.emoji);
    return message.reply({content:`${language.SUCCESFULLY_PURCHASED} **${item.data.name}**`});
  },
  name:"buy",
  aliases:["purchase"],
  description:"",
  category:"economy",
  shortRules:"",
  exemples:`\`${process.env.BOT_PREFIX}buy how did you\` <- item name`,
  cooldown:1e3
};