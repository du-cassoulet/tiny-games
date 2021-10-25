const Discord=require("discord.js");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({client,message,args})=>{
    const games=client.commands.filter(c=>c.category=="game").toJSON();
    games[Math.floor(Math.random()*games.length)].func({client,message,args});
  },
  name:"random",
  aliases:["randomgame","rg"],
  description:`To play to a random game: ${global.client.commands.filter(c=>c.category=="game").map(c=>c.gameName).join(", ")}`,
  category:"match",
  shortRules:"To play to a random game",
  exemples:`\`${process.env.BOT_PREFIX}random\` <- no args required`,
  cooldown:1.5e3
};