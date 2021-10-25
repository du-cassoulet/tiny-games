const Discord=require("discord.js");
const db=require("quick.db");
const utils=require("../utils/utils");
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
    function sum(para){
      var sum=0;
      para.forEach(p=>sum+=(p||0));
      return sum;
    };
    setLead();
    async function setLead(botMessage=undefined,isWorld=false,game="global"){
      const serverUsers=db.fetchAll().filter(e=>{
        return e.data.tokens&&message.guild.members.cache.has(e.ID)&&e.ID!=client.user.id;
      }).sort((a,b)=>game=="global"?((b.data.tp||1000)-(a.data.tp||1000)):((b.data.games[game]||[0,0])[1]-(a.data.games[game]||[0,0])[1]));
      const everyUsers=db.fetchAll().filter(e=>e.data.tokens).sort((a,b)=>game=="global"?((b.data.tp||1000)-(a.data.tp||1000)):((b.data.games[game]||[0,0])[1]-(a.data.games[game]||[0,0])[1]));
      const embed=new Discord.MessageEmbed();
      embed.setDescription((isWorld?everyUsers:serverUsers).slice(0,10).map((u,i)=>{
        function convertToPlacement(n){
          if(n==1)return"🥇";
          if(n==2)return"🥈";
          if(n==3)return"🥉";
          if(n>3)return`**º${n}**`;
        };
        const defeats=sum(Object.entries(u.data.games).filter(g=>game=="global"?true:g[0]==game).map(game=>(game[1][0]||0)));
        const victories=sum(Object.entries(u.data.games).filter(g=>game=="global"?true:g[0]==game).map(game=>(game[1][1]||0)));
        return`${convertToPlacement(i+1)} ${u.data.tp}tp | ${client.users.cache.get(u.ID)?`**${client.users.cache.get(u.ID).username}**#${client.users.cache.get(u.ID).discriminator}`:"**Unknown user**"} ─ **${(Math.round(victories*100)/100)}** ${language.WINS} • **${(Math.round(defeats*100)/100)}** ${language.LOSSES} • WLR: **${isNaN((Math.round(victories*100)/100)/(Math.round(defeats*100)/100))||(Math.round(victories*100)/100)/(Math.round(defeats*100)/100)==Infinity?"- -":utils.numberWithCommas(Math.round((victories/defeats)*100)/100)}**`;
      }).join("\n\n"));
      embed.setAuthor(`${isWorld?"Global":message.guild.name} ${language.GAMES_LEADERBOARD} ${game!="global"?`(${game})`:""}`,message.guild.iconURL());
      embed.setTimestamp();
      embed.setColor("#ff5757");
      const games=client.commands.toJSON().filter(c=>c.category=="game");
      const gamesOptions=[{label:"Global",value:"global",description:"To see the global leaderboard"}];
      games.forEach(game=>{
        gamesOptions.push({
          label:game.gameName,
          value:game.name,
          description:`Displays the leaderboard for the game ${game.gameName}`
        });
      });
      const gameSelector=new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageSelectMenu()
        .setCustomId("game")
        .setPlaceholder("Select a game filter")
        .addOptions(...gamesOptions)
      );
      const worldToggler=new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageButton()
        .setCustomId("toggle-world")
        .setLabel("World leaderboard")
        .setStyle(isWorld?"PRIMARY":"SECONDARY")
      );
      const leadContent={
        content:`**#${serverUsers.findIndex(u=>u.ID==message.author.id)+1}** ${language.IN_SERVER} ─ **#${everyUsers.findIndex(u=>u.ID==message.author.id)+1}** ${language.IN_WORLD}`,
        embeds:[embed],
        components:[gameSelector,worldToggler]
      };
      if(botMessage)botMessage.edit(leadContent);
      else botMessage=await message.channel.send(leadContent);
      const collector=botMessage.createMessageComponentCollector({time:3e4,max:1});
      collector.on("collect",interaction=>{
        interaction.deferUpdate();
        if(interaction.user.id!=message.author.id)return;
        if(interaction.customId=="game"){
          const selectedGame=interaction.values[0];
          setLead(botMessage,isWorld,selectedGame);
        };
        if(interaction.customId=="toggle-world"){
          setLead(botMessage,isWorld?false:true,game);
        };
      });
    };
  },
  name:"leaderboard",
  aliases:["lead","lb"],
  description:"To get the leaderboard",
  category:"infos",
  shortRules:"To get the leaderboard",
  exemples:`\`${process.env.BOT_PREFIX}leaderboard\` <- no args required`,
  cooldown:1.5e4
};