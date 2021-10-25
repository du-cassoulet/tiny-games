const Discord=require("discord.js");
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
  func:async({client,message,language})=>{
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const startDate=new Date();
      const inGamePlayers=[...players];
      const decoder=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
      const codemaker=inGamePlayers.filter(p=>p!=decoder)[0];
      var end=false;
      var turns=9;
      const emojis=["🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","⚪"];
      const[wrongPlacement,goodPlacement]=["❕","❗"];
      const code=[];
      if(!codemaker){
        for(let i=0;i<4;i++){
          code.push(emojis[Math.floor(Math.random()*emojis.length)]);
        };
        playGame(code);
      }else{
        client.users.cache.get(codemaker).send({content:language.COMPOSE_CODE}).catch(()=>{
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
        const dmChannel=await message.guild.members.cache.get(codemaker).user.createDM();
        messageCollect();
        function messageCollect(){
          const filter=codeMessage=>codeMessage.author.id==codemaker;
          const collector=dmChannel.createMessageCollector({time:6e4,max:1,filter});
          var prompted=false;
          collector.on("collect",async codeMessage=>{
            var emojiCount=0;
            prompted=true;
            for(const emoji of codeMessage.content.trim().split(/ +/g)){
              emojiCount++;
              if(emojiCount>4||!emojis.includes(emoji)){
                messageCollect();
                const exCode=[];
                for(let i=0;i<4;i++){
                  exCode.push(emojis[Math.floor(Math.random()*emojis.length)]);
                };
                return codeMessage.reply({
                  content:`${language.COLORS_EMOJI} \`${exCode.join(" ")}\` ${language["4COLORS"]}`
                });
              };
            };
            playGame(codeMessage.content.trim().split(/ +/g));
            dmChannel.send({
              content:`${language.CODE} \`${codeMessage.content.trim()}\` ${language.CREATED}`
            });
          });
          collector.on("end",()=>{
            if(prompted)return;
            dmChannel.send({content:language.CODE_AUTO_COMPOSED});
            for(let i=0;i<4;i++){
              code.push(emojis[Math.floor(Math.random()*emojis.length)]);
            };
            playGame(code);
          });
        };
      };
      function playGame(code){
        var composedCode=[];
        const pastCodes=[];
        const content=()=>`${language.WRITE_CODE}:\n\n${pastCodes.map(c=>`${c.code.join(" ")} ${c.results.gPlacement.join("")}${c.results.wPlacement.join("")}`).join("\n")}\n-----------------\n${composedCode.join(" ")}`;
        botMessage.edit({
          content:content(),
          components:[],
          embeds:[]
        });
        emojis.forEach(emoji=>botMessage.react(emoji));
        const collector=botMessage.createReactionCollector({time:3e5});
        client.addListener("gameDelete",endGame);
        function endGame(gameId){
          if(gameId!=message.author.id)return;
          end=true;
          collector.stop();
          client.removeListener("gameDelete",endGame);
        };
        collector.on("end",()=>{
          client.removeListener("gameDelete",endGame);
          if(end)return;
          return message.channel.send({content:language.TIME_ELAPSED});
        });
        collector.on("collect",async(reaction,user)=>{
          if(user.id!=decoder)return;
          try{reaction.users.remove(user.id)}catch(_){};
          composedCode.push(reaction.emoji.name);
          if(composedCode.length>=4){
            const results={gPlacement:[],wPlacement:[]};
            const usedColors=[];
            composedCode.forEach(color=>{
              if(usedColors.includes(color))return;
              usedColors.push(color);
              const recurNum=code.filter(c=>c==color).length;
              var recurNumComp=composedCode.filter(c=>c==color).length;
              if(recurNumComp>recurNum)recurNumComp=recurNum;
              const turnNum=recurNumComp-recurNum+recurNum;
              for(let i=0;i<turnNum;i++){
                results.wPlacement.push(wrongPlacement);
              };
            });
            composedCode.forEach((color,index)=>{
              if(code[index]==color){
                results.gPlacement.push(goodPlacement);
                results.wPlacement.length--;
              };
            });
            pastCodes.push({code:composedCode,results});
            composedCode=[];
            botMessage.edit({
              content:content()
            });
            if(results.gPlacement.length>=4)return endMessage(true,collector);
            if(turns==0)return endMessage(false,collector);
            turns--;
          }else{
            botMessage.edit({
              content:content()
            });
          };
        });
        function endMessage(isWin,collector){
          end=true;
          collector.stop();
          if(isWin){
            const endMessage=new EndMessage({icon:module.exports.icon,
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              winners:[decoder],
              reason:`${message.guild.members.cache.get(decoder).user.username} ${language.WON_THE_GAME}`,
              rules:module.exports.description,
              gameStart:startDate
            });
            if(codemaker)endMessage.losers=[codemaker];
            endMessage.send();
            return;
          }else{
            const endMessage=new EndMessage({icon:module.exports.icon,
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              losers:[decoder],
              rules:module.exports.description,
              gameStart:startDate
            });
            if(codemaker){
              endMessage.winners=[codemaker];
              endMessage.reason=`${message.guild.members.cache.get(codemaker).user.username} ${language.WON_THE_GAME}`;
            }else endMessage.reason=`${message.guild.members.cache.get(decoder).user.username} ${language.LOST_THE_GAME}`;
            endMessage.send();
            return;
          };
        };
      };
    });
  },
  name:"mastermind",
  aliases:["codemaster","codebreaker","colorcodes","cc"],
  description:"That player must lift the Secrecy screen at the end of the unit and insert four Code pegs (their secret code) into the holes underneath. Once the code is set, the Decoder can begin guessing, trying to duplicate the exact colors and positions of the hidden Code pegs. Each guess is made by placing a row of Code pegs on the unit.",
  category:"game",
  shortRules:"To play to the mastermind",
  exemples:`\`${process.env.BOT_PREFIX}mastermind\` <- no args required`,
  gameName:"Mastermind",
  icon:"https://i.imgur.com/wm7gkLT.png",
  cooldown:1.5e4
};