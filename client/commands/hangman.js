const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const dictionnary=require("dictionaries-in-array")("en");
const db=require("quick.db");
const Language=require("../../miscellaneous/languages/en.json");
const translate=require("@vitalets/google-translate-api");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[],
   *  language:Language
   * }} param0 
   */
  func:({client,message,language})=>{
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1
    });
    lobby.start(async(players,botMessage)=>{
      var ended=false;
      const startDate=new Date();
      const allPlayers=[...players];
      const inGamePlayers=[...players];
      if(inGamePlayers.length<2)inGamePlayers.push(client.user.id);
      var curHangStep=0;
      const hangSteps=[
        `​      __            __\n      |          |\n      |\n      |\n__      |        __`,
        ` ​       __            __\n        |          |\n        |         O\n        |\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |          |\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\\\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\\\n  __      |       __ /`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\\\n  __      |       __ / \\`
      ];
      const IDtoUserJSON=id=>message.guild.members.cache.get(id).user;
      const refreshMessage=async()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:botMessage.embeds
      });
      playGame();
      async function playGame(){
        if(inGamePlayers.includes(client.user.id)){
          var guesser=inGamePlayers[0];
          var host=client.user.id;
        }else{
          var guesser=inGamePlayers.splice(Math.floor(Math.random()*allPlayers.length),1)[0];
          var host=inGamePlayers[0];
        };
        botMessage.content=`${language.WAIT_UNTIL} ${message.guild.members.cache.get(host).user} ${language.FINISHED_WRITING}`;
        botMessage.embeds=[];
        botMessage.components=[];
        refreshMessage();
        var end=false;
        if(host!=client.user.id)IDtoUserJSON(host).send({content:`:speech_balloon: ${language.SEND_ME_WORD}`}).catch(()=>{
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
        if(inGamePlayers.includes(client.user.id)){
          var textToGuess=dictionnary[Math.floor(Math.random()*dictionnary.length)];
          textToGuess=await translate(textToGuess,{from:"en",to:language.languageRegion});
          return sendGame(textToGuess.text,guesser,client.user.id);
        }else{
          askWord();
          async function askWord(){
            var chosen=false;
            const dmChannel=await message.guild.members.cache.get(host).createDM();
            const filter=m=>m.author.id==host;
            const collector=dmChannel.createMessageCollector({filter,time:3e4});
            collector.on("collect",async wordMessage=>{
              const textToGuess=await wordMessage.content.trim();
              var hasOtherThanLetters=false;
              for(const letter of textToGuess){
                if(!letter.match(/[a-zA-Z \-_]/g))hasOtherThanLetters=true;
                chosen=true;
                collector.stop();
                chosen=false;
              };
              if(textToGuess.length>30||textToGuess.length<3||hasOtherThanLetters){
                await dmChannel.send({content:`${language.WORD_FILTER}\n:speech_balloon: ${language.SEND_ME_WORD}`});
                chosen=true;
                collector.stop();
                chosen=false;
                askWord();
              }else{
                chosen=true;
                collector.stop();
                const channelInvite=await message.channel.createInvite();
                dmChannel.send({content:`${language.WORD_CREATED}\n${channelInvite}`});
                return sendGame(textToGuess,guesser,host);
              };
            });
            collector.on("end",async()=>{
              if(!chosen){
                dmChannel.send({content:language.TOOK_TOO_LONG_WORD});
                var textToGuess=dictionnary[Math.floor(Math.random()*dictionnary.length)];
                textToGuess=await translate(textToGuess,{from:"en",to:language.languageRegion});
                return sendGame(textToGuess.text,guesser,host);
              };
            });
          };
        };
      };
      function sendGame(textToGuess,guesser,host){
        textToGuess=[...textToGuess.replace(/[ _]/g,"-").toLowerCase()];
        var hiddenWord=[...textToGuess].map(letter=>{
          if(letter.match(/[a-z]/g))return"_";
          else return letter;
        });
        botMessage.embeds=[];
        botMessage.components=[];
        botMessage.content=`${hangSteps[0]}\n\`\`\` ${hiddenWord.join("  ")} \`\`\``;
        refreshMessage();
        collectLetter();
        function collectLetter(){
          const collector=message.channel.createMessageCollector({filter:message=>message.author.id==guesser,max:1,time:3e4});
          client.addListener("gameDelete",endGame);
          function endGame(gameId){
            if(gameId!=message.author.id)return;
            ended=true;
            collector.stop();
            client.removeListener("gameDelete",endGame);
          };
          collector.on("collect",async letter=>{
            if(letter.content.startsWith(db.get(`${message.guild.id}-prefix`))&&!ended)return collectLetter();
            if(letter.deletable)letter.delete().catch(()=>{});
            if(letter.content.length!=1||!letter.content.toLowerCase().match(/[a-z]/g)){
              message.channel.send(`<:off:869978532489617458> ${language.INPUT_ONE_LETTER}`).then(bm=>setTimeout(()=>bm.deletable?bm.delete():undefined,3e3));
              if(ended)return;
              return collectLetter();
            }else{
              letter.content=letter.content.toLowerCase();
              if(hiddenWord.includes(letter.content)){
                message.channel.send(`<:off:869978532489617458> ${language.ALREADY_DISCOVERED}`).then(bm=>setTimeout(()=>bm.deletable?bm.delete():undefined,3e3));
                if(ended)return;
                return collectLetter();
              }else if(textToGuess.includes(letter.content)){
                hiddenWord=hiddenWord.map((l,index)=>{
                  if(textToGuess[index]==letter.content)return letter.content;
                  else return l;
                });
                botMessage.content=`${hangSteps[curHangStep]}\n\`\`\` ${hiddenWord.join("  ")} \`\`\``;
                await refreshMessage();
                if(hiddenWord.includes("_")&&!ended)return collectLetter();
                else new EndMessage({icon:module.exports.icon,
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:[host],
                  winners:[guesser],
                  reason:`${message.guild.members.cache.get(guesser).user.username} ${language.WON_THE_GAME}`,
                  rules:module.exports.description,
                  gameStart:startDate,
                  additionalText:`💬 ${language.THE_WORD_WAS}: **${textToGuess.join(" ")}**`
                }).send();
              }else{
                curHangStep++;
                botMessage.content=`${hangSteps[curHangStep]}\n\`\`\` ${hiddenWord.join("  ")} \`\`\``;
                await refreshMessage();
                if(curHangStep<6&&!ended)return collectLetter();
                else new EndMessage({icon:module.exports.icon,
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:[guesser],
                  winners:[host],
                  reason:`${message.guild.members.cache.get(host).user.username} ${language.WON_THE_GAME}`,
                  rules:module.exports.description,
                  gameStart:startDate,
                  additionalText:`💬 ${language.THE_WORD_WAS}: **${textToGuess.join(" ")}**`
                }).send();
              };
            };
          });
          collector.on("end",collected=>{
            client.removeListener("gameDelete",endGame);
            if(!collected.size){
              new EndMessage({icon:module.exports.icon,
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                losers:[guesser],
                winners:[host],
                reason:language.TURN_TIMED_OUT,
                rules:module.exports.description,
                gameStart:startDate,
                additionalText:`💬 ${language.THE_WORD_WAS}: **${textToGuess.join(" ")}**`
              }).send();
            };
          });
        };
      };
    });
  },
  name:"hangman",
  aliases:["hm"],
  description:"Hangman is a quick and easy game for at least two people that requires nothing more than paper, a pencil, and the ability to spell. One player, the \"host\" makes up a secret word, while the other player tries to guess the word by asking what letters it contains. However, every wrong guess brings them one step closer to losing.",
  category:"game",
  shortRules:"To play to the hangman",
  exemples:`\`${process.env.BOT_PREFIX}hangman\` <- no args required`,
  gameName:"Hangman",
  icon:"https://i.imgur.com/kI11bvU.png",
  cooldown:1.5e4
};