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
    const backgrounds=require("../../public/json/backgrounds.json");
    const avaliableBgs=db.get(`${message.author.id}.bgs`)||[0];
    passBackground(0,undefined,avaliableBgs);
    async function passBackground(curBg,botMessage,avaliableBgs){
      const msgContent={
        content:`> ${language.THEME}: **${backgrounds[curBg].name.charAt(0).toUpperCase()+backgrounds[curBg].name.slice(1)}** — ${language.PRICE}: <a:heart:893889889760845854> **${!backgrounds[curBg].price?"Free":utils.numberWithCommas(backgrounds[curBg].price)}**\n${avaliableBgs.includes(backgrounds.findIndex(b=>b.image==backgrounds[curBg].image))?backgrounds[curBg].image:backgrounds[curBg].grayscale}`,
        components:[
          new Discord.MessageActionRow()
          .addComponents(
            new Discord.MessageButton()
            .setCustomId("beginning")
            .setEmoji("⏪")
            .setStyle("SECONDARY")
            .setDisabled(curBg==0),
            new Discord.MessageButton()
            .setCustomId("back")
            .setEmoji("◀️")
            .setStyle("SECONDARY")
            .setDisabled(curBg==0),
            new Discord.MessageButton()
            .setCustomId("get")
            .setLabel(!avaliableBgs.includes(backgrounds.findIndex(b=>b.image==backgrounds[curBg].image))?"Buy":"Select")
            .setStyle("PRIMARY")
            .setDisabled((db.get(`${message.author.id}.selected_background`)||0)==backgrounds.findIndex(b=>b.image==backgrounds[curBg].image)||!avaliableBgs.includes(backgrounds.findIndex(b=>b.image==backgrounds[curBg].image))&&db.get(`${message.author.id}.tokens.heart`)<backgrounds[curBg].price),
            new Discord.MessageButton()
            .setCustomId("fore")
            .setEmoji("▶️")
            .setStyle("SECONDARY")
            .setDisabled(curBg==backgrounds.length-1),
            new Discord.MessageButton()
            .setCustomId("end")
            .setEmoji("⏩")
            .setStyle("SECONDARY")
            .setDisabled(curBg==backgrounds.length-1)
          )
        ]
      };
      if(!botMessage)botMessage=await message.reply(msgContent);
      else botMessage.edit(msgContent);
      const collector=botMessage.createMessageComponentCollector({
        max:1,
        filter:b=>b.user.id==message.author.id,
        time:6e4
      });
      collector.on("collect",async button=>{
        button.deferUpdate().catch(()=>{});
        if(button.customId=="beginning"){
          passBackground(0,botMessage,avaliableBgs);
        }else if(button.customId=="back"){
          passBackground(curBg-1,botMessage,avaliableBgs);
        }else if(button.customId=="get"){
          if(avaliableBgs.includes(backgrounds.findIndex(b=>b.image==backgrounds[curBg].image))){
            db.set(`${message.author.id}.selected_background`,curBg);
            passBackground(curBg,botMessage,db.get(`${message.author.id}.bgs`));
          }else{
            db.push(`${message.author.id}.bgs`,curBg);
            db.set(`${message.author.id}.selected_background`,curBg);
            db.subtract(`${message.author.id}.tokens.heart`,backgrounds[curBg].price);
            passBackground(curBg,botMessage,db.get(`${message.author.id}.bgs`));
          };
        }else if(button.customId=="fore"){
          passBackground(curBg+1,botMessage,avaliableBgs);
        }else if(button.customId=="end"){
          passBackground(backgrounds.length-1,botMessage,avaliableBgs);
        };
      });
    };
  },
  name:"background",
  aliases:["backgrounds","bgs","bg"],
  description:"To select a background",
  category:"economy",
  shortRules:"To select a background",
  exemples:`\`${process.env.BOT_PREFIX}background main_theme\` <- to select a theme`,
  cooldown:1.5e4
};