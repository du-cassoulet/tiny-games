const Discord=require("discord.js");
const dictionnary=require("dictionaries-in-array")("en");
const utils=require("../utils/utils");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
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
  func:async({message,language})=>{
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
      const startDate=new Date();
      var trys=3;
      var msg="";
      botMessage.embeds=[];
      botMessage.components=[];
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        embeds:botMessage.embeds,
        components:botMessage.components
      });
      const IDtoUserJSON=id=>message.guild.members.cache.get(id).user;
      if(players.length>1){
        const inGamePlayers=[...players];
        const guesser=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
        const host=inGamePlayers[0];
        botMessage.content=`${language.WAIT_UNTIL} ${message.guild.members.cache.get(host).user} ${language.FINISHED_WRITING}`;
        refreshMessage();
        var end=false;
        IDtoUserJSON(host).send({content:`:speech_balloon: ${language.TEXT_ME_WORD}`}).catch(()=>{
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
        askWord();
        async function askWord(){
          var wordDone=false;
          const dmChannel=await message.guild.members.cache.get(host).createDM();
          const filter=m=>m.author.id==host;
          const collector=dmChannel.createMessageCollector({filter,time:3e4});
          collector.on("collect",async wordMessage=>{
            if(wordMessage.author.id!=host)return;
            const textToGuess=await wordMessage.content.trim();
            var hasOtherThanLetters=false;
            for(const letter of textToGuess){
              if(!letter.match(/[a-zA-Z]/g))hasOtherThanLetters=true;
              wordDone=true;
              collector.stop();
              wordDone=false;
            };
            if(textToGuess.length>16||textToGuess.length<3||hasOtherThanLetters){
              await dmChannel.send({content:`${language.SCRAMBLE_FILTER}\n:speech_balloon: ${language.SEND_WORD}`});
              askWord();
              wordDone=true;
              collector.stop();
              wordDone=false;
            }else{
              message.channel.createInvite().then(channelInvite=>{
                dmChannel.send({content:`${language.WORD_CREATED}\n${channelInvite}`});
                playGame(textToGuess.toLowerCase().split(""),guesser);
                wordDone=true;
                collector.stop();
              }).catch(()=>{
                dmChannel.send({content:`${language.WORD_CREATED}`});
                playGame(textToGuess.toLowerCase().split(""),guesser);
                wordDone=true;
                collector.stop();
              });
            };
          });
          collector.on("end",()=>{
            if(!wordDone){
              dmChannel.send({content:language.TOOK_TOO_LONG_WORD});
              const randomWord=dictionnary[Math.floor(Math.random()*dictionnary.length)].split("").filter(l=>l.match(/[a-z]/g));
              playGame(randomWord,players[0]);
            };
          });
        };
      }else{
        const randomWord=dictionnary[Math.floor(Math.random()*dictionnary.length)].split("").filter(l=>l.match(/[a-z]/g));
        playGame(randomWord,players[0]);
      };
      function playGame(entireWord,guesser){
        const word=[...entireWord];
        var hiddenWord=[];
        word.forEach(()=>hiddenWord.push("__"));
        const scrambled=utils.shuffle(entireWord);
        botMessage.content=`\`\`\`${language.LETTERS}: ${scrambled.join(" ")}\n${hiddenWord.join(" ")}\n${msg}\`\`\``;
        refreshMessage();
        const letters="azertyuiopqsdfghjklmwxcvbn";
        const letterEmojis="🇦 🇿 🇪 🇷 🇹 🇾 🇺 🇮 🇴 🇵 🇶 🇸 🇩 🇫 🇬 🇭 🇯 🇰 🇱 🇲 🇼 🇽 🇨 🇻 🇧 🇳".split(" ");
        scrambled.forEach(letter=>{
          botMessage.react(letterEmojis[letters.indexOf(letter)]);
        });
        var stack={};
        word.forEach(letter=>{
          stack[letter]?stack[letter]++:stack[letter]=1;
        });
        const filter=(_,user)=>user.id==guesser;
        const collector=botMessage.createReactionCollector({filter,time:3e5});
        client.addListener("gameDelete",endGame);
        function endGame(gameId){
          if(gameId!=message.author.id)return;
          collector.stop();
          client.removeListener("gameDelete",endGame);
        };
        collector.on("collect",(reaction,user)=>{
          const letter=letters[letterEmojis.indexOf(reaction.emoji.name)];
          stack[letter]--;
          if(!stack[letter]){
            reaction.remove();
          }else{
            try{reaction.users.remove(user.id)}catch(_){};
          };
          const hiddenLength=()=>hiddenWord.filter(l=>!l.match(/[a-z]/g)).length;
          hiddenWord[word.length-hiddenLength()]=letter;
          if(!hiddenLength()){
            if(hiddenWord.join("")==word.join("")){
              collector.stop();
              const endMessage=new EndMessage({icon:module.exports.icon,
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                rules:module.exports.description,
                winners:[guesser],
                reason:language.GUESSER_WON,
                gameStart:startDate
              });
              if(players.length>1)endMessage.losers=players.filter(playerId=>playerId!=guesser);
              endMessage.send();
            }else{
              if(trys){
                hiddenWord=word.map(()=>"__");
                msg=language.WRONG_WORD;
                trys--;
                scrambled.forEach(letter=>{
                  botMessage.react(letterEmojis[letters.indexOf(letter)]);
                });
                word.forEach(letter=>{
                  stack[letter]?stack[letter]++:stack[letter]=1;
                });
              }else{
                collector.stop();
                const endMessage=new EndMessage({icon:module.exports.icon,
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  rules:module.exports.description,
                  losers:[guesser],
                  reason:language.GUESSER_LOST,
                  gameStart:startDate
                });
                if(players.length>1)endMessage.winners=players.filter(playerId=>playerId!=guesser);
                endMessage.send();
              };
            };
          };
          botMessage.content=`\`\`\`${language.LETTERS}: ${scrambled.join(" ")}\n${hiddenWord.join(" ")}\n${msg}\`\`\``;
          refreshMessage();
          msg="";
        });
        collector.on("end",()=>{
          client.removeListener("gameDelete",endGame);
        });
      };
    });
  },
  name:"scramble",
  aliases:["unscramble","unscrambler","uscr","us"],
  description:"Unscramble the letters of a random word chosen by another player, if you find the correct word, you win the game, but if you don't the player who chosen the word win the game.",
  category:"game",
  shortRules:"To play to a scramble game",
  exemples:`\`${process.env.BOT_PREFIX}scramble\` <- no args required`,
  gameName:"Scramble",
  icon:"https://i.imgur.com/7z2BTwD.png",
  cooldown:1.5e4
};