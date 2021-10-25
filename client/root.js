require("dotenv").config();
const Discord=require("discord.js");
const client=new Discord.Client({
  intents:[
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_INTEGRATIONS
  ]
});
client.options.restTimeOffset=0;
client.commands=new Discord.Collection();
client.aliases=new Discord.Collection();
client.games=new Discord.Collection();
client.inGame=new Discord.Collection();
global.client=client;
global.logger=require("../miscellaneous/logger");
global.time=require("../miscellaneous/time");
global.pIcons=require("../public/json/players.json");
(async()=>{
  await client.login(process.env.BOT_TOKEN);
  client.setMaxListeners(50);
  require("./modules/eventHandler")(client);
  require("./modules/commandHandler")(client);
  global.logger.infos(`Logged as ${client.user.tag}`);
  global.logger.infos(`${client.user.username} version ${require("../package.json").version}`);
})();
// process.on("unhandledRejection",err=>{
//   if(err.code)global.logger.error(Object.entries(Discord.Constants.APIErrors).find(p=>p[1]==err.code)[0]);
//   else global.logger.error(err);
// });