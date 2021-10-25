const Discord=require("discord.js");
const Trivia=require("trivia-api");
const utils=require("../utils/utils");
const ms=require("ms");
const HTMLEncodeDecode=require("html-encoder-decoder");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
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
  func:async({message,language})=>{
    const startDate=new Date();
    const lobby=new Lobby({
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:8,
      minPlayers:1,
      message:message,
      rules:module.exports.description,
      gamemodes:[
        {
          label:language.NORMAL_MODE,
          description:language["10RANDOM_QUESTIONS"],
          emoji:"💭"
        },
        {
          label:`${language.GENERAL_KNOWLEDGE} - 5`,
          description:`${language["10THEME_QUESTION"]} "General knowledge"`,
          emoji:"🧠"
        },
        {
          label:`${language.GENERAL_KNOWLEDGE} - 10`,
          description:`${language["10THEME_QUESTION"]} "General knowledge"`,
          emoji:"💡"
        },
        {
          label:language.HISTORY,
          description:`${language["10THEME_QUESTION"]} "History"`,
          emoji:"📔"
        },
        {
          label:language.ANIMES,
          description:`${language["10THEME_QUESTION"]} "Animes"`,
          emoji:"🪄"
        },
        {
          label:language.HARD,
          description:language["10HARD_QUESTIONS"],
          emoji:"😈"
        },
        {
          label:language.LONG_QUIZ,
          description:language["50QUESTIONS"],
          emoji:"⏳"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      var ended=false;
      if(!gamemode)gamemode=language.NORMAL_MODE.toLowerCase().replace(/ /g,"_");
      if(gamemode==language.NORMAL_MODE.toLowerCase().replace(/ /g,"_")){
        var turn=10;
        var difficulty=undefined;
        var category=undefined;
      }else if(gamemode==`${language.GENERAL_KNOWLEDGE.toLowerCase().replace(/ /g,"_")}___5`){
        var turn=5;
        var difficulty=undefined;
        var category=9;
      }else if(gamemode==`${language.GENERAL_KNOWLEDGE.toLowerCase().replace(/ /g,"_")}___10`){
        var turn=10;
        var difficulty=undefined;
        var category=9;
      }else if(gamemode==language.HISTORY.toLowerCase().replace(/ /g,"_")){
        var turn=10;
        var difficulty=undefined;
        var category=23;
      }else if(gamemode==language.ANIMES.toLowerCase().replace(/ /g,"_")){
        var turn=10;
        var difficulty=undefined;
        var category=31;
      }else if(gamemode==language.HARD.toLowerCase().replace(/ /g,"_")){
        var turn=10;
        var difficulty="hard";
        var category=undefined;
      }else if(gamemode==language.LONG_QUIZ.toLowerCase().replace(/ /g,"_")){
        var turn=50;
        var difficulty=undefined;
        var category=undefined;
      };
      const maxTurns=turn;
      const userResponses=[];
      players.forEach(playerId=>{
        userResponses.push({
          author:playerId,
          choice:null,
          resTime:0,
          score:0
        });
      });
      const trivia=new Trivia();
      const time=3e4;
      const buttons=[];
      for(let i=0;i<4;i++){
        buttons.push(
          new Discord.MessageButton().setCustomId(`answer${i}`).setStyle("SECONDARY").setLabel(`${language.ANSWER} ${i+1}`)
        );
      };
      const row=new Discord.MessageActionRow().addComponents(...buttons);
      trivia.getQuestions({
        amount:turn,
        type:"multiple",
        category:category,
        difficulty:difficulty
      }).then(async questions=>{
        playTurn(ended);
        async function playTurn(ended){
          if(ended)return;
          if(turn==0){
            if(players.length>1){
              new EndMessage({icon:module.exports.icon,
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                losers:userResponses.sort((a,b)=>b.score-a.score).map(p=>p.author).slice(1),
                winners:[userResponses.sort((a,b)=>b.score-a.score)[0].author],
                reason:`${message.guild.members.cache.get(userResponses.sort((a,b)=>b.score-a.score)[0].author).user.username} ${language.WON_THE_GAME}`,
                rules:module.exports.description,
                gameStart:startDate
              }).send();
            }else{
              if(userResponses[0].score>3000){
                new EndMessage({icon:module.exports.icon,
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  winners:[players[0]],
                  reason:`${message.guild.members.cache.get(players[0]).user.username} ${language.WON_THE_GAME}`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              }else{
                new EndMessage({icon:module.exports.icon,
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:[players[0]],
                  reason:`${message.guild.members.cache.get(players[0]).user.username} ${language.LOST_THE_GAME}`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              };
            };
          }else{
            const endTime=Date.now()+time;
            const questionJSON=questions.results[turn-1];
            var{correct_answer,incorrect_answers,question,difficulty,category}=questionJSON;
            var answers=incorrect_answers;
            answers.push(correct_answer);
            answers=answers.map(ent=>HTMLEncodeDecode.decode(ent));
            answers=utils.shuffle(answers);
            question=HTMLEncodeDecode.decode(question);
            category=HTMLEncodeDecode.decode(category);
            if(language.languageRegion!="en"){
              question=await translate(question,{from:"en",to:language.languageRegion});
              question=question.text;
              answers[0]=await translate(answers[0],{from:"en",to:language.languageRegion});
              answers[0]=answers[0].text;
              answers[1]=await translate(answers[1],{from:"en",to:language.languageRegion});
              answers[1]=answers[1].text;
              answers[2]=await translate(answers[2],{from:"en",to:language.languageRegion});
              answers[2]=answers[2].text;
              answers[3]=await translate(answers[3],{from:"en",to:language.languageRegion});
              answers[3]=answers[3].text;
            };
            const embed=new Discord.MessageEmbed();
            embed.setColor("#ff5757");
            answers.forEach((answer,index)=>{
              embed.addField(`${language.ANSWER} ${index+1}`,answer,true);
            });
            embed.addField(language.RESPONSES,userResponses.sort((a,b)=>b.score-a.score).map(res=>`${message.guild.members.cache.get(res.author).user} ${res.choice?"<:None:870024851803492433>":"<a:Loading:867315391939477514>"}`).join("\n"),false);
            embed.setAuthor(question,message.guild.iconURL({dynamic:true}));
            embed.setFooter(`${language.DIFFICULTY}: ${difficulty} - ${language.CATEGORY}: ${category} - ${language.TURN} ${maxTurns-turn+1}/${maxTurns}`);
            embed.setDescription(`${language.YOU_HAVE} ${ms(time,{long:true})} [${ms(endTime-Date.now())} ${language.REMAINING}]`);
            await botMessage.edit({
              embeds:[embed],
              components:[row],
              content:null
            });
            const startQuestion=Date.now();
            const collector=botMessage.createMessageComponentCollector({time});
            client.addListener("gameDelete",endGame);
            function endGame(gameId){
              if(gameId!=message.author.id)return;
              ended=true;
              collector.stop();
              client.removeListener("gameDelete",endGame);
            };
            collector.on("collect",async button=>{
              if(!players.includes(button.user.id))return;
              await button.deferUpdate().catch(()=>{});
              const responseIndex=parseFloat(button.customId.slice(6));
              userResponses.find(res=>res.author==button.user.id).choice=responseIndex;
              userResponses.find(res=>res.author==button.user.id).time=startQuestion-Date.now()+time;
              embed.setDescription(`${language.YOU_HAVE} ${ms(time,{long:true})} [${ms(endTime-Date.now())} ${language.REMAINING}]`);
              embed.fields[4].value=userResponses.sort((a,b)=>b.score-a.score).map(res=>`${message.guild.members.cache.get(res.author).user} ${res.choice!=null?"<:None:870024851803492433>":"<a:Loading:867315391939477514>"}`).join("\n");
              botMessage.edit({embeds:[embed]});
              var allDone=true;
              userResponses.forEach(res=>{
                if(res.choice==null)allDone=false;
              });
              if(allDone){
                if(ended)return;
                client.addListener("gameDelete",endGame);
                collector.stop();
                if(!ended)setTimeout(()=>{
                  if(ended)return;
                  function timeToscore(val){
                    return Math.round(val/(time/1e3));
                  };
                  embed.fields[4].value=userResponses.sort((a,b)=>b.score-a.score).map(res=>`${message.guild.members.cache.get(res.author).user} ${res.choice!=null?answers[res.choice]==HTMLEncodeDecode.decode(correct_answer)?`<:On:870024897315880991> + ${timeToscore(res.time)} (${utils.numberWithCommas(res.score+timeToscore(res.time))})`:`<:off:869978532489617458> + 0 (${utils.numberWithCommas(res.score)})`:"<a:Loading:867315391939477514>"}`).join("\n");
                  botMessage.edit({embeds:[embed]});
                  userResponses.forEach(async res=>{
                    correct=HTMLEncodeDecode.decode(correct_answer);
                    correct=await translate(correct,{from:"en",to:language.languageRegion});
                    if(answers[res.choice]==correct.text)res.score+=timeToscore(res.time);
                    res.choice=null;
                    res.time=0;
                  });
                  if(!ended)setTimeout(()=>{
                    turn--;
                    if(!ended)playTurn(ended);
                  },2e3);
                },2e3);
              };
            });
            collector.on("end",collected=>{
              if(ended)return;
              client.removeListener("gameDelete",endGame);
              if(collected.size!=players.length){
                function timeToscore(val){
                  return Math.round(val/(time/1e3));
                };
                embed.fields[4].value=userResponses.sort((a,b)=>b.score-a.score).map(res=>`${message.guild.members.cache.get(res.author).user} ${res.choice!=null?answers[res.choice]==HTMLEncodeDecode.decode(correct_answer)?`<:On:870024897315880991> + ${utils.numberWithCommas(timeToscore(res.time))} (${res.score+timeToscore(res.time)})`:`<:off:869978532489617458> + 0 (${utils.numberWithCommas(res.score)})`:"<a:Loading:867315391939477514>"}`).join("\n");
                botMessage.edit({embeds:[embed]});
                userResponses.forEach(res=>{
                  if(answers[res.choice]==HTMLEncodeDecode.decode(correct_answer))res.score+=timeToscore(res.time);
                  res.choice=null;
                  res.time=0;
                });
                if(!ended)setTimeout(()=>{
                  turn--;
                  if(!ended)playTurn(ended);
                },2e3);
              };
            });
          };
        };
      }).catch(()=>message.channel.send("An error has occured."));
    });
  },
  name:"quiz",
  aliases:["trivia"],
  description:"Several questions will be asked, the player with the most score wins the game. Please note that the time it takes to answer the questions also counts in the calculation of the score. The fastest to answer the right question will be the winner. If you play alone, you need to have a higher score than 3000.",
  category:"game",
  shortRules:"To play a quiz",
  exemples:`\`${process.env.BOT_PREFIX}quiz\` <- no args required`,
  gameName:"Quiz",
  icon:"https://i.imgur.com/mlfJ1kS.png",
  cooldown:1.5e4
};