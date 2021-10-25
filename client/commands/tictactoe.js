const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const Language=require("../../miscellaneous/languages/en.json");
const utils=require("../utils/utils");
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
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1,
      message:message,
      rules:module.exports.description,
      acceptablePlayers:2
    });
    lobby.start(async(players,botMessage)=>{
      const gameStart=Date.now();
      const emojis=["718506491660992735","896682404410982450","896682404222226433"];
      var ended=false;
      var curTurn=0;
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:[]
      });
      if(players.length<2)players.push(client.user.id);
      players=utils.shuffle(players);
      botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,curTurn)).user}`;
      botMessage.components=[];
      for(let y=0;y<3;y++){
        const buttons=[];
        for(let x=0;x<3;x++){
          buttons.push(
            new Discord.MessageButton()
            .setCustomId(`${x}${y}`)
            .setStyle("SECONDARY")
            .setEmoji(emojis[0])
          );
        };
        botMessage.components.push(
          new Discord.MessageActionRow()
          .addComponents(...buttons)
        );
      };
      const emojiIndex=curTurn=>players.indexOf(utils.loopIdGetter(players,curTurn))+1;
      refreshMessage();
      playTurn();
      function checkVictory(){
        const getItem=(x,y)=>botMessage.components[y].components[x].emoji.id;
        var hasVoid=false;
        for(let y=0;y<3;y++)for(let x=0;x<3;x++){
          if(getItem(x,y)==emojis[0])hasVoid=true;
          else{
            try{
              if(getItem(x,y)==getItem(x+1,y)&&getItem(x,y)==getItem(x+2,y))return[{x,y},{x:x+1,y},{x:x+2,y}];
            }catch(_){};
            try{
              if(getItem(x,y)==getItem(x,y+1)&&getItem(x,y)==getItem(x,y+2))return[{x,y},{x,y:y+1},{x,y:+2}];
            }catch(_){};
            try{
              if(getItem(x,y)==getItem(x+1,y+1)&&getItem(x,y)==getItem(x+2,y+2))return[{x,y},{x:x+1,y:y+1},{x:x+2,y:y+2}];
            }catch(_){};
            try{
              if(getItem(x,y)==getItem(x+1,y-1)&&getItem(x,y)==getItem(x+2,y-2))return[{x,y},{x:x+1,y:y-1},{x:x+2,y:y-2}];
            }catch(_){};
          };
        };
        if(!hasVoid)return[];
        return;
      };
      function playTurn(){
        if(utils.loopIdGetter(players,curTurn)==client.user.id){
          client.addListener("gameDelete",endGame);
          function endGame(gameId){
            if(gameId!=message.author.id)return;
            ended=true;
            client.removeListener("gameDelete",endGame);
          };
          if(!ended)setTimeout(()=>{
            if(ended)return;
            const botPawn=emojis[emojiIndex(curTurn)];
            const userPawn=emojis[emojiIndex(curTurn+1)];
            function botPlacement(){
              const avaliablePlacements=[];
              const getItem=(x,y)=>botMessage.components[y].components[x].emoji.id;
              function isPossible(y,x){
                if(x){
                  if(botMessage.components[y])return botMessage.components[y].components[x];
                  else return botMessage.components[y];
                }else return botMessage.components[y];
              };
              const isVoid=(x,y)=>botMessage.components[y].components[x].emoji.id==emojis[0];
              function placeForPawn(userPawn){
                for(let y=0;y<3;y++)for(let x=0;x<3;x++){
                  if(getItem(x,y)==emojis[0])avaliablePlacements.push({x,y});
                  else if(getItem(x,y)==userPawn){
                    if(isPossible(y+1)&&getItem(x,y+1)==userPawn&&isPossible(y+2)&&isVoid(x,y+2))return{x:x,y:y+2};
                    if(isPossible(y-1)&&getItem(x,y-1)==userPawn&&isPossible(y-2)&&isVoid(x,y-2))return{x:x,y:y-2};
                    if(isPossible(y,x-1)&&getItem(x-1,y)==userPawn&&isPossible(y,x-2)&&isVoid(x-2,y))return{x:x-2,y:y};
                    if(isPossible(y,x+1)&&getItem(x+1,y)==userPawn&&isPossible(y,x+2)&&isVoid(x+2,y))return{x:x+2,y:y};
                    if(isPossible(y+1,x+1)&&getItem(x+1,y+1)==userPawn&&isPossible(y+2,x+2)&&isVoid(x+2,y+2))return{x:x+2,y:y+2};
                    if(isPossible(y-1,x-1)&&getItem(x-1,y-1)==userPawn&&isPossible(y-2,x-2)&&isVoid(x-2,y-2))return{x:x-2,y:y-2};
                    if(isPossible(y+1,x-1)&&getItem(x-1,y+1)==userPawn&&isPossible(y+2,x-2)&&isVoid(x-2,y+2))return{x:x-2,y:y+2};
                    if(isPossible(y-1,x+1)&&getItem(x+1,y-1)==userPawn&&isPossible(y-2,x+2)&&isVoid(x+2,y-2))return{x:x+2,y:y-2};
                  };
                };
              };
              var placement=placeForPawn(botPawn);
              if(placement)return placement;
              placement=placeForPawn(userPawn);
              if(placement)return placement;
              return avaliablePlacements[Math.floor(Math.random()*avaliablePlacements.length)];
            };
            const placement=botPlacement();
            botMessage.components[placement.y].components[placement.x].setEmoji(emojis[emojiIndex(curTurn)]);
            const isVictory=checkVictory();
            if(isVictory){
              if(!isVictory.length)new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                icon:module.exports.icon,
                equals:players,
                rules:module.exports.description,
                reason:language.EQUALITY
              }).send();
              isVictory.forEach(pos=>{
                botMessage.components[pos.y].components[pos.x].setStyle("SUCCESS");
                return new EndMessage({
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  icon:module.exports.icon,
                  winners:players.filter(p=>p==utils.loopIdGetter(players,curTurn)),
                  losers:players.filter(p=>p!=utils.loopIdGetter(players,curTurn)),
                  rules:module.exports.description,
                  reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,curTurn)).user.username} ${language.WON_THE_GAME}`
                }).send();
              });
              refreshMessage();
            }else{
              curTurn++;
              botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,curTurn)).user}`;
              refreshMessage();
              if(!ended)playTurn();
            };
            client.removeListener("gameDelete",endGame);
          },Math.floor(Math.random()*2e3)+1e3);
        }else{
          const collector=botMessage.createMessageComponentCollector({
            time:3e4
          });
          client.addListener("gameDelete",endGame);
          function endGame(gameId){
            if(gameId!=message.author.id)return;
            ended=true;
            collector.stop();
            client.removeListener("gameDelete",endGame);
          };
          collector.on("collect",button=>{
            if(ended)return;
            button.deferUpdate().catch(()=>{});
            if(button.user.id!=utils.loopIdGetter(players,curTurn))return;
            var[x,y]=button.customId.split("");
            x=parseInt(x);
            y=parseInt(y);
            if(botMessage.components[y].components[x].emoji.id!=emojis[0])return;
            botMessage.components[y].components[x].setEmoji(emojis[emojiIndex(curTurn)]);
            const isVictory=checkVictory();
            if(isVictory){
              if(!isVictory.length)new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                icon:module.exports.icon,
                equals:players,
                rules:module.exports.description,
                reason:language.EQUALITY
              }).send();
              isVictory.forEach(pos=>{
                botMessage.components[pos.y].components[pos.x].setStyle("SUCCESS");
                return new EndMessage({
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  icon:module.exports.icon,
                  winners:players.filter(p=>p==utils.loopIdGetter(players,curTurn)),
                  losers:players.filter(p=>p!=utils.loopIdGetter(players,curTurn)),
                  rules:module.exports.description,
                  reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,curTurn)).user.username} ${language.WON_THE_GAME}`
                }).send();
              });
              refreshMessage();
            }else{
              curTurn++;
              botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,curTurn)).user}`;
              refreshMessage();
              collector.stop();
              if(!ended)playTurn();
            };
          });
          collector.on("end",()=>{
            client.removeListener("gameDelete",endGame);
          });
        };
      };
    });
  },
  name:"tictactoe",
  aliases:["ttt"],
  description:"The game is played on a grid that's 3 squares by 3 squares. You are X, your friend is O. Players take turns putting their marks in empty squares. The first player to get 3 of her marks in a row (up, down, across, or diagonally) is the winner. When all 9 squares are full, the game is over.",
  category:"game",
  shortRules:"To play to the tic tac toe",
  exemples:`\`${process.env.BOT_PREFIX}tictactoe\` <- no args required`,
  gameName:"Tic tac toe",
  icon:"https://i.imgur.com/lwvTuhr.png",
  cooldown:1.5e4
};