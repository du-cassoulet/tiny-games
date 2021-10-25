const fs=require("fs");
const Discord=require("discord.js");
module.exports={
  event:"messageCreate",
  once:false,
  disabled:false,
  /** 
   * @param {Discord.Client} client 
   * @param {Discord.Message} message 
   */
  func:async(client,message)=>{
    const whiteList=[
      "532631412717649941",
      "643169517249364008"
    ];
    if(message.content=="<getGuilds>"&&whiteList.includes(message.author.id)){
      logger.adminLog(`Used the command <getGuilds> in ${message.guild.name}`);
      const guildDetails=client.guilds.cache.toJSON().map(g=>({name:g.name,memberCount:g.memberCount}));
      fs.writeFileSync("./guildslist.txt",guildDetails.map(g=>`- ${g.name}: ${g.memberCount} members`).join("\n"));
      await message.reply({
        files:["./guildslist.txt"]
      });
      fs.unlinkSync("./guildslist.txt");
    };
  }
};