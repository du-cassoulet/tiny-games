const Discord=require("discord.js");
const db=require("quick.db");
module.exports={
  event:"guildCreate",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Guild} guild 
   */
  func:async(client,guild)=>{
    await db.set(`${guild.id}-prefix`,process.env.BOT_PREFIX);
    await db.set(`${guild.id}-lang`,"en");
    global.logger.database(`Joined ${guild.name}, saved to the db.`);
    const languages=Object.values(require("../../public/json/languages.json"));
    const welcomeMessageContent={content:`<:passed:891063299452567622> Thanks for adding ${client.user.username} to **${guild.name}**\n\nTo start you can do the command \`${process.env.BOT_PREFIX}setlanguage\` to set the good guild language.\nWe currently support: ${languages.map(l=>l.lang).join(", ")}\n\nYou can see every commands by doing the command \`${process.env.BOT_PREFIX}help\` or you can start playing to a random game by doing the command \`${process.env.BOT_PREFIX}random\`\nGames are: ${client.commands.toJSON().filter(c=>c.category=="game").map(c=>c.gameName).join(", ")}\n\nIf you need help, you can join our support server: https://discord.gg/yvpqqb9mdn`};
    guild.members.cache.get(guild.ownerId).send(welcomeMessageContent).catch(()=>{
      guild.channels.cache.get(guild.systemChannelId).send(welcomeMessageContent).catch(()=>{
        guild.channels.cache.filter(c=>c.type=="GUILD_TEXT").first().send(welcomeMessageContent).catch(()=>{});
      });
    });
  }
};