const db=require("quick.db");
const Discord=require("discord.js");
function createUser({client,userId}){
  if(!db.has(userId)){
    db.set(userId,{
      tokens:{sand:3e3,heart:2e2,star:3},
      leveling:{level:1,xp:0},
      themes:["main_theme"],
      bgs:[0],
      selected_background:0,
      badges:[],
      pets:[],
      highestWinstreak:0,
      winstreak:0,
      tp:1e3,
      dm:true,
      achievements:[],
      games:{}
    });
    const user=client.users.cache.get(userId);
    user.send({
      embeds:[
        new Discord.MessageEmbed()
        .setColor("#ff5757")
        .setDescription(`__Welcome to ${client.user.username}__\n\n➼ Start playing your very first game with **GAME** commands.\n➼ Use **PROFILE** to see your profile card.\n➼ **MINE**, **DAILY** and **VOTE** are the best ways to gain <:sand_dollar:893893210248728597>\n➼ You can buy your first pet by using **PETS**\n➼ Use **LEADERBOARD** and **STATISTICS** to see your game statistics and those of others as well as your placement in the server.\n➼ Use **HELP** and **INFO** for additional informations.`)
        .addField("Rules","To improve your playing experience and that of others, you should leave or stop games as little as possible.\nCreating duplicate accounts or playing for others will result in being banned",true)
        .addField("To get started","I've given you some resources to get started!\n**<:sand_dollar:893893210248728597> 3,000\n<a:heart:893889889760845854> 200\n<a:star:893889889756663849> 3**",true)
        .setThumbnail(user.displayAvatarURL())
        .setAuthor("Account Registration")
        .setFooter("Use help command to get more informations")
      ]
    }).catch(_=>{});
    client.commands.filter(command=>command.category=="game").forEach(game=>{
      db.set(`${userId}.games.${game.name}`,[0,0,0,0]);
    });
  };
};
module.exports=createUser;