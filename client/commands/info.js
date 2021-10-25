const Discord=require("discord.js");
const db=require("quick.db");
const byteSize=require("byte-size");
const utils=require("../utils/utils");
const package=require("../../package.json");
const os=require("os");
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
    const images={
      weight:db.get(`images.weight`)||0,
      number:db.get(`images.number`)||0
    };
    var commands=[];
    Object.entries(db.get("commands.notGame")).forEach(command=>{
      if(command[0]=="undefined")return;
      return commands.push({
        name:command[0],
        playTime:command[1]
      });
    });
    commands=commands.sort((a,b)=>b.playTime-a.playTime).slice(0,5);
    var games=[];
    const gameNumber=client.commands.filter(command=>command.category=="game").size;
    Object.entries(db.get("commands.game")).forEach(game=>{
      if(game[0]=="undefined")return;
      return games.push({
        name:game[0],
        playTime:game[1]
      });
    });
    var allUsers=0;
    client.guilds.cache.toJSON().forEach(g=>allUsers+=g.memberCount);
    games=games.sort((a,b)=>b.playTime-a.playTime).slice(0,5);
    const used=process.memoryUsage().heapUsed/1024/1024;
    const embed=new Discord.MessageEmbed();
    embed.setAuthor(`${language.INFORMATIONS_FOR} ${client.user.username}`,client.user.displayAvatarURL());
    embed.setColor("#ff5757");
    embed.addField(language.GAME_STATS,`**${language.MOST_PLAYED}:**\n${games.map((game,index)=>`**${numToQual(index+1)}.** ${game.name} (${game.playTime})`).join("\n")||language.NO_STATS}`,true);
    embed.addField(language.COMMANDS_STATS,`**${language.MOST_USED_COMMANDS}:**\n${commands.map((command,index)=>`**${numToQual(index+1)}.** ${command.name} (${command.playTime})`).join("\n")||language.NO_STATS}`,true);
    embed.addField(language.VERSIONS,`${language.VERSION_OF} ${client.user.username}: **${package.version}**\n[${language.DATABASE}](https://www.npmjs.com/package/quick.db) ${language.VERSION}: **${db.version}**\n[NodeJS](https://nodejs.org/en/) **${process.version}**\n[Discord.js](https://discord.js.org/#/) ${language.VERSION}: **${Discord.version}**\n${language.PROCESS_UPTIME}: **${global.time(Math.round(process.uptime())*1000)}**`,true);
    embed.addField(language.GLOBAL_STATS,`🌐 ${language.SERVERS}: **${utils.numberWithCommas(client.guilds.cache.size)}**\n👥 ${language.USERS}: **${utils.numberWithCommas(allUsers)}**\n🗨️ ${language.CHANNELS}: **${utils.numberWithCommas(client.channels.cache.filter(channel=>channel.type=="GUILD_TEXT").size)}**\n💻 ${language.MEMORY}: **${utils.numberWithCommas(Math.round(used*100)/100)}MB**\n📡 **${utils.numberWithCommas(db.get("commandnumber")||0)}** ${language.COMMANDS}\n🕙 **${global.time(db.has("gametimespent")?db.get("gametimespent"):0)}** ${language.SPENT_PLAYING}\n🪄 **${gameNumber}** ${language.GAMES_PLAYABLE}\n🤖 ${language.UPTIME}: **${global.time(client.uptime)}**\n🏓 ${language.PING}: **${utils.numberWithCommas(client.ws.ping)}ms**\n🖼️ **${utils.numberWithCommas(images.number)}** ${language.IMAGES_GENERATED}\n📤 **${utils.numberWithCommas(byteSize(images.weight).toString().replace(/ /g,""))}** ${language.IMAGES_UPLOADED}\n❗ ${language.MAIN_PREFIX}: **${process.env.BOT_PREFIX}**\n🎛️ ${language.CPU_MODEL}: **${os.cpus()[0].model}**\n<:calculator:888485615233036350> OS: **${os.platform()}**`,true);
    embed.addField(language.BOT_DETAILS,`ID: **${client.user.id}**\n${language.USERNAME}: **${client.user.username}**\n${language.DISCRIMINATOR}: **#${client.user.discriminator}**\n${language.CREATION_DATE}: **${client.user.createdAt.toLocaleDateString("en-US")}**\n${language.AVATAR_URL}: ${client.user.displayAvatarURL({format:"jpg",size:2048})}\n${language.INVITATION_LINK}: https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=388161&scope=bot\nSupport server link: https://discord.gg/yvpqqb9mdn`,true);
    embed.setFooter(language.ENJOY_GAMES);
    message.channel.send({embeds:[embed]});
    function numToQual(n){
      if(n==1)return"🥇";
      if(n==2)return"🥈";
      if(n==3)return"🥉";
      if(n>3)return`º${n}`;
    };
  },
  name:"info",
  aliases:["infos","botinfo","botinfos","clientinfos","bi"],
  description:"To get some infos for the bot",
  category:"infos",
  shortRules:"To get some infos for the bot",
  exemples:`\`${process.env.BOT_PREFIX}info\` <- no args required`,
  cooldown:3e3
};