const Discord=require("discord.js");
const db=require("quick.db");
module.exports={
  event:"gameDelete",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {String} gameId 
   */
  func:async(client,gameId)=>{
    const game=client.games.get(gameId);
    global.logger.game(`Game [${gameId}] ended (${game.players.length} player${game.players.length>1?"s":""})`);
    game.players.forEach(playerId=>{
      client.inGame.delete(playerId);
    });
    const channel=client.channels.cache.get(game.channelId);
    const language=require(`../../miscellaneous/languages/${db.get(`${game.guildId}-lang`)||"en"}.json`);
    client.games.delete(gameId);
    channel.send(`<:discord_joined_new:891064564060401694> ${language.MATCH_STOPPED}`);
  }
};