const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const utils=require("../utils/utils");
const ms=require("ms");
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
    const isFloat=n=>Number(n)==n&&n%1!=0;
    const lobby=new Lobby({
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1,
      message:message,
      rules:module.exports.description,
      gamemodes:[
        {
          label:language.EASY,
          description:`${language.A_NUMBER_BETWEEN} 1 ${language.AND} 999`,
          emoji:"❤️"
        },
        {
          label:language.MEDIUM,
          description:`${language.A_NUMBER_BETWEEN} 1 ${language.AND} 9,999`,
          emoji:"❤️‍🩹"
        },
        {
          label:language.HARD,
          description:`${language.A_NUMBER_BETWEEN} 1 ${language.AND} 99,999`,
          emoji:"❤️‍🔥"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      if(gamemode==language.EASY.toLowerCase().replace(/ /g,"_"))var maxNumber=998;
      else if(gamemode==language.MEDIUM.toLowerCase().replace(/ /g,"_"))var maxNumber=9998;
      else if(gamemode==language.HARD.toLowerCase().replace(/ /g,"_"))var maxNumber=99998;
      else var maxNumber=9998;
      const startDate=Date.now();
      const inGamePlayers=[...players];
      if(inGamePlayers.length<2)playGame(Math.floor(Math.random()*maxNumber)+1,inGamePlayers[0]);
      else{
        const composer=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
        var end=false;
        message.guild.members.cache.get(composer).send({content:`:speech_balloon: ${language.TEXT_ME_NUMBER}`}).catch(()=>{
          message.channel.send(`${language.CANT_SEND_TO} ${message.guild.members.cache.get(composer).user.username}`);
          new EndMessage({icon:module.exports.icon,
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            losers:[playerId],
            reason:language.VILLAGERS_WON,
            rules:module.exports.description,
            winners:allPlayers.filter(pid=>pid!=playerId),
            gameStart:startDate
          }).send();
          end=true;
        });
        if(end)return;
        botMessage.edit({
          content:`${language.WAIT_UNTIL} ${message.guild.members.cache.get(composer).user} ${language.FINISHED_WRITING}`,
          components:[],
          embeds:[]
        });
        askWord();
        async function askWord(){
          const dmChannel=await message.guild.members.cache.get(composer).createDM();
          const filter=m=>m.author.id==composer;
          const collector=dmChannel.createMessageCollector({filter});
          var chosen=false;
          collector.on("collect",async numberMessage=>{
            const correctNumber=await numberMessage.content.trim();
            if(isNaN(correctNumber)||isFloat(correctNumber)||parseInt(correctNumber)>(maxNumber+1)||parseInt(correctNumber)<1){
              await dmChannel.send({content:`${language.NUMBER_FILTER} ${utils.numberWithCommas(maxNumber+1)}`});
              chosen=true;
              collector.stop();
              chosen=false;
              askWord();
            }else{
              chosen=true;
              collector.stop();
              const channelInvite=await message.channel.createInvite();
              dmChannel.send({content:`${language.NUMBER_CREATED}\n${channelInvite}`});
              return playGame(parseInt(correctNumber),inGamePlayers[0],composer);
            };
          });
          collector.on("end",()=>{
            if(!chosen){
              dmChannel.send({content:language.TOOK_TOO_LONG_NUMBER});
              return playGame(Math.floor(Math.random()*maxNumber)+1,inGamePlayers[0]);
            };
          });
        };
      };
      function playGame(correctNumber,guesser,composer){
        const time=6e4;
        var ended=false;
        botMessage.edit({
          components:[],
          embeds:[],
          content:`:1234: ${language.NUMBER_IS_BETWEEN} \`1\` ${language.AND} \`${utils.numberWithCommas(maxNumber+1)}\`\n${language.GUESS_NUMBER_TIME} ${ms(time,{long:true})}`
        });
        const collector=message.channel.createMessageCollector({
          time,
          filter:numberMessage=>numberMessage.author.id==guesser
        });
        client.addListener("gameDelete",endGame);
        function endGame(gameId){
          if(gameId!=message.author.id)return;
          ended=true;
          collector.stop();
          client.removeListener("gameDelete",endGame);
        };
        collector.on("collect",async numberMessage=>{
          const number=await numberMessage.content.trim();
          if(isNaN(correctNumber)||isFloat(correctNumber)||parseInt(correctNumber)>(maxNumber+1)||parseInt(correctNumber)<1){
            numberMessage.reply({content:language.NUMBER_FILTER});
          }else{
            if(parseInt(number)<correctNumber)numberMessage.reply({content:language.MORE});
            if(parseInt(number)>correctNumber)numberMessage.reply({content:language.LESS});
            else if(parseInt(number)==correctNumber){
              ended=true;
              new EndMessage({icon:module.exports.icon,
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                rules:module.exports.description,
                losers:composer?[composer]:undefined,
                winners:[guesser],
                reason:`${language.CORRECT_NUMBER_WAS} ${correctNumber}`,
                gameStart:startDate
              }).send();
              return collector.stop();
            };
          };
        });
        collector.on("end",()=>{
          client.removeListener("gameDelete",endGame);
          if(!ended)return new EndMessage({icon:module.exports.icon,
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            rules:module.exports.description,
            losers:[guesser],
            winners:composer?[composer]:undefined,
            reason:`${language.CORRECT_NUMBER_WAS} ${utils.numberWithCommas(correctNumber)}`,
            gameStart:startDate
          }).send();
        });
      };
    });
  },
  name:"guessthenumber",
  aliases:["gtn"],
  description:"You have to guess the correct number thanks to the plus or minus, you have to find the correct number to win the game.",
  category:"game",
  shortRules:"To play to the guess number game",
  exemples:`\`${process.env.BOT_PREFIX}guessthenumber\` <- no args required`,
  gameName:"Guess the number",
  icon:"https://i.imgur.com/VAlYiSw.png",
  cooldown:1.5e4
};