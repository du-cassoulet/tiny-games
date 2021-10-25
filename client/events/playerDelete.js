const Discord=require("discord.js");
const EndMessage=require("../utils/EndMessage");
const db=require("quick.db");
module.exports={
  event:"playerDelete",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {String} userId 
   */
  func:async(client,userId)=>{
    const gameId=client.inGame.get(userId);
    const game=client.games.get(gameId);
    const channel=client.channels.cache.get(game.channelId);
    game.players.splice(game.players.indexOf(userId),1);
    client.games.set(gameId,game);
    client.inGame.delete(userId);
    const language=require(`../../miscellaneous/languages/${db.get(`${game.guildId}-lang`)||"en"}.json`);
    if(game.players.length<game.minPlayers&&!game.starting){
      new EndMessage({icon:module.exports.icon,
        channel:channel,
        game:game.name,
        gameStart:game.start,
        hostId:gameId,
        losers:[userId],
        winners:game.players.filter(playerId=>playerId!=userId),
        reason:`${channel.guild.members.cache.get(userId).user.username} ${language.LEFT_GAME}`,
        rules:client.commands.get(game.name.toLowerCase().replace(/ /g,"")).description
      }).send();
      client.games.delete(gameId);
    };
    const leaveMessage=await channel.send(`<:discord_joined_new:891064564060401694> ${channel.guild.members.cache.get(userId).user.username} ${language.LEFT_GAME}`);
    setTimeout(()=>{
      if(leaveMessage.deletable)leaveMessage.delete().catch(()=>{});
    },2e3);
  }
};