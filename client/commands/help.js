const Discord=require("discord.js");
const utils=require("../utils/utils");
const db=require("quick.db");
const ms=require("ms");
const Language=require("../../miscellaneous/languages/en.json");
const translate=require("@vitalets/google-translate-api");
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
    var prefix=db.get(`${message.guild.id}-prefix`)||process.env.BOT_PREFIX;
    if(prefix[prefix.length-1].match(/[a-z1-9]/g))prefix=`${prefix} `;
    const commands=client.commands.toJSON();
    if(!args.length){
      const cat={};
      commands.forEach(command=>{
        if(!cat[command.category])cat[command.category]=[command];
        else cat[command.category].push(command);
      });
      var curCat="game";
      var cmds=cat[curCat];
      const content=[];
      if(curCat=="game"){
        content[0]=cmds.map(command=>{
          return`${command.gameName} \`${prefix}${command.name}\` ${command.shortRules}`;
        }).join("\n");
      }else{
        content[0]=cmds.map(command=>{
          return`${command.name.charAt(0).toUpperCase()+command.name.slice(1)} \`${prefix}${command.name}\` ${command.shortRules}`;
        }).join("\n");
      };
      content.push(`${language.JOIN_SUPPORT}: https://discord.gg/yvpqqb9mdn`);
      const botMessage=await message.reply({
        content:content.join("\n\n"),
        components:[
          new Discord.MessageActionRow()
          .addComponents(
            new Discord.MessageSelectMenu()
            .setPlaceholder(language.SELECT_CATEGORY)
            .setCustomId("categories")
            .addOptions(Object.keys(cat).map(c=>{
              return{
                label:c.charAt(0).toUpperCase()+c.slice(1),
                value:c,
                description:`${language.SELECT_CATEGORY} "${c.charAt(0).toUpperCase()+c.slice(1)}"`
              };
            }))
          )
        ]
      });
      const collector=botMessage.createMessageComponentCollector({time:6e4});
      collector.on("collect",menu=>{
        menu.deferUpdate();
        if(menu.user.id!=message.author.id)return;
        curCat=menu.values[menu.values.length-1];
        cmds=cat[curCat];
        if(curCat=="game"){
          content[0]=cmds.map(command=>{
            return`${command.gameName} \`${prefix}${command.name}\` ${command.shortRules}`;
          }).join("\n");
        }else{
          content[0]=cmds.map(command=>{
            return`${command.name.charAt(0).toUpperCase()+command.name.slice(1)} \`${prefix}${command.name}\` ${command.shortRules}`;
          }).join("\n");
        };
        botMessage.edit({
          content:content.join("\n\n"),
          components:[
            new Discord.MessageActionRow()
            .addComponents(
              new Discord.MessageSelectMenu()
              .setPlaceholder(language.SELECT_CATEGORY)
              .setCustomId("categories")
              .addOptions(Object.keys(cat).map(c=>{
                return{
                  label:c.charAt(0).toUpperCase()+c.slice(1),
                  value:c,
                  description:`${language.SELECT_CATEGORY} "${c.charAt(0).toUpperCase()+c.slice(1)}"`
                };
              }))
            )
          ]
        });
      });
    }else{
      if(client.commands.has(args[0].toLowerCase())){
        sendInfos(args[0].toLowerCase());
      }else if(client.aliases.has(args[0].toLowerCase())){
        sendInfos(client.aliases.get(args[0].toLowerCase()));
      }else return message.reply({
        content:`<:off:869978532489617458> ${language.THE_COMMAND} ${args[0].toLowerCase()} ${language.DOESNT_EXIST}`
      });
    };
    async function sendInfos(commandName){
      const command=client.commands.get(commandName);
      const embed=new Discord.MessageEmbed();
      embed.setColor(utils.userStyle(message.author.id).main_color);
      embed.setThumbnail(command.icon||process.env.BOT_NAMETAG);
      const description=await translate(command.description,{from:"en",to:language.languageRegion});
      embed.setDescription(
        `\\🕹️ **${command.name}**${command.aliases?` [${command.aliases.join(", ")}]`:""}\n${description.text}\n\n${language.CATEGORY}: ${command.category} - ${language.COOLDOWN}: ${ms(command.cooldown,{long:true})}\n${language.USAGE_EXEMPLES}:\n${command.exemples}`
      );
      message.channel.send({embeds:[embed]});
    };
  },
  name:"help",
  description:"To get the help message",
  category:"utility",
  shortRules:"To get the help message",
  exemples:`\`${process.env.BOT_PREFIX}help\` <- list all the commands
help hangman\` <- get help for another command`,
  cooldown:3e3
};