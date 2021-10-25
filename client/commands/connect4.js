const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const numberToText=require("number-to-text");
const emojiConvert=require("discord-emoji-converter");
const utils=require("../utils/utils");
const Language=require("../../miscellaneous/languages/en.json");
const db=require("quick.db");
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
      gamemodes:[
        {
          label:language.EASY,
          description:`${language.EASY} ${language.GAME}`,
          emoji:"😎"
        },
        {
          label:language.MEDIUM,
          description:`${language.MEDIUM} ${language.GAME}`,
          emoji:"😵"
        },
        {
          label:language.HARD,
          description:`${language.HARD} ${language.GAME}`,
          emoji:"😵‍💫"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      if(!gamemode)gamemode==language.MEDIUM.toLowerCase();
      const gameStart=Date.now();
      var turn=0;
      if(players.length<2)players.push(client.user.id);
      players=utils.shuffle(players);
      const emojis=["⚪"];
      if(db.get(`${players[0]}.connect4`)&&db.get(`${players[0]}.connect4`)[0]!=emojis[0])emojis.push(db.get(`${players[0]}.connect4`)[0]);
      else emojis.push("🟡");
      if(db.get(`${players[1]}.connect4`)&&db.get(`${players[1]}.connect4`)[0]!=emojis[0])emojis.push(db.get(`${players[1]}.connect4`)[0]);
      else emojis.push("🔴");
      const map=[];
      for(let y=0;y<6;y++){
        const row=[];
        for(let x=0;x<7;x++)row.push(emojis[0]);
        map.push(row);
      };
      function addNumbers(map){
        const numbers=[];
        for(let i=0;i<map[0].length;i++)numbers.push(`:${numberToText.convertToText(i+1).toLowerCase()}:`);
        return[...map,numbers];
      };
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        embeds:botMessage.embeds,
        components:botMessage.components
      });
      botMessage.components=[];
      botMessage.embeds=[];
      botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(players[0]).user}\n\n${addNumbers(map).map(row=>row.join(" ")).join("\n")}`;
      refreshMessage();
      const reactions=[];
      for(let i=0;i<map[0].length;i++)reactions.push(emojiConvert.emojify(`:${numberToText.convertToText(i+1).toLowerCase()}:`));
      reactions.forEach(reaction=>botMessage.react(reaction));
      createCollector();
      function createCollector(){
        const curPlayer=utils.loopIdGetter(players,turn);
        if(curPlayer==client.user.id){
          const botColor=emojis[players.indexOf(curPlayer)+1];
          var userColor=emojis.find(emoji=>emoji!=emojis[0]&&emoji!=botColor);
          setTimeout(()=>{
            function botPlacement(){
              const avaliableSlots=[0,1,2,3,4,5,6];
              for(let x=0;x<map[0].length;x++){
                var hasEmpty=false;
                for(let y=0;y<map.length;y++)if(map[y][x]==emojis[0])hasEmpty=true;
                if(!hasEmpty)avaliableSlots.splice(avaliableSlots.indexOf(x),1);
              };
              var place=placement(userColor);
              if(!place&&gamemode==language.HARD.toLowerCase())place=placement(botColor);
              if(!place)place=avaliableSlots[Math.floor(Math.random()*avaliableSlots.length)];
              return place;
              function placement(color){
                const isEmpty=(x,y)=>map[y][x]==emojis[0];
                const isPlayer=(x,y)=>map[y][x]==color;
                const isOut=(x,y)=>y>=6||y<=0||x>=7||x<=0;
                for(let y=0;y<map.length;y++)for(let x=0;x<map[0].length;x++){
                  if(isPlayer(x,y)){
                    try{
                      if(isPlayer(x,y-1)&&isPlayer(x,y-2)&&isEmpty(x,y-3))return x;
                    }catch(error){};
                    try{
                      if(isPlayer(x+1,y)&&isPlayer(x+2,y)&&isEmpty(x+3,y)&&(isOut(x+3,y+1)||!isEmpty(x+3,y+1)))return x+3;
                    }catch(error){};
                    try{
                      if(isPlayer(x-1,y)&&isPlayer(x-2,y)&&isEmpty(x-3,y)&&(isOut(x-3,y+1)||!isEmpty(x-3,y+1)))return x-3;
                    }catch(error){};
                  };
                };
                for(let y=0;y<map.length;y++)for(let x=0;x<map[0].length;x++){
                  if(isPlayer(x,y)){
                    try{
                      if(isPlayer(x+1,y)&&isEmpty(x+2,y)&&(isOut(x+2,y+1)||!isEmpty(x+2,y+1)))return x+2;
                    }catch(error){};
                    try{
                      if(isPlayer(x-1,y)&&isEmpty(x-2,y)&&(isOut(x-2,y+1)||!isEmpty(x-2,y+1)))return x-2;
                    }catch(error){};
                    try{
                      if(isPlayer(x+2,y)&&isEmpty(x+1,y)&&(isOut(x+1,y+1)||!isEmpty(x+1,y+1)))return x+1;
                    }catch(error){};
                    try{
                      if(isPlayer(x,y-1)&&isEmpty(x,y-2))return x;
                    }catch(error){};
                    if(gamemode==language.MEDIUM.toLowerCase()||gamemode==language.HARD.toLowerCase()){
                      try{
                        if(isPlayer(x-1,y-1)&&isEmpty(x-2,y-2)&&(!isEmpty(x-2,y-1)||isOut(x-2,y-1)))return x-2;
                      }catch(error){};
                      try{
                        if(isPlayer(x+1,y+1)&&isEmpty(x+2,y+2)&&(!isEmpty(x+2,y+3)||isOut(x+2,y+3)))return x+2;
                      }catch(error){};
                      try{
                        if(isPlayer(x+1,y-1)&&isEmpty(x+2,y-2)&&(!isEmpty(x+2,y-1)||isOut(x+2,y-1)))return x+2;
                      }catch(error){};
                      try{
                        if(isPlayer(x-1,y-1)&&isEmpty(x-2,y-2)&&(!isEmpty(x-2,y-3)||isOut(x-2,y-3)))return x-2;
                      }catch(error){};
                      try{
                        if(isPlayer(x+2,y-2)&&isEmpty(x+1,y-1)&&(!isEmpty(x+1,y)||isOut(x+1,y)))return x+1;
                      }catch(error){};
                      try{
                        if(isPlayer(x-2,y-2)&&isEmpty(x-1,y-1)&&(!isEmpty(x-1,y)||isOut(x-1,y)))return x-1;
                      }catch(error){};
                    };
                  };
                };
              };
            };
            const placement=botPlacement();
            const pawnYPlacement=getColPawnNumber(placement);
            if(map[map.length-1-pawnYPlacement]&&map[map.length-1-pawnYPlacement][placement])map[map.length-1-pawnYPlacement][placement]=botColor;
            botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user}\n\n${addNumbers(map).map(row=>row.join(" ")).join("\n")}`;
            turn++;
            refreshMessage();
            const end=isEnd();
            if(end){
              if(end==emojis[0])return new EndMessage({
                icon:module.exports.icon,
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                equals:players,
                reason:language.EQUALITY,
                rules:module.exports.description
              }).send();
              else if(end==emojis[players.indexOf(curPlayer)+1])return new EndMessage({
                icon:module.exports.icon,
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                winners:[utils.loopIdGetter(players,turn+1)],
                losers:[utils.loopIdGetter(players,turn)],
                reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user.username} ${language.WON_THE_GAME}`,
                rules:module.exports.description
              }).send();
              else if(end!=emojis[players.indexOf(utils.loopIdGetter(players,turn+1))+1])return new EndMessage({icon:module.exports.icon,
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                winners:[utils.loopIdGetter(players,turn)],
                losers:[utils.loopIdGetter(players,turn+1)],
                reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user.username} ${language.WON_THE_GAME}`,
                rules:module.exports.description
              }).send();
            }else createCollector();
          },2e3);
        }else{
          const collector=botMessage.createReactionCollector({
            filter:(reaction,user)=>reactions.includes(reaction.emoji.name)&&user.id==curPlayer,
            max:1,
            time:6e4
          });
          client.addListener("gameDelete",endGame);
          function endGame(gameId){
            if(gameId!=message.author.id)return;
            ended=true;
            collector.stop();
            client.removeListener("gameDelete",endGame);
          };
          collector.on("collect",async(reaction,user)=>{
            try{reaction.users.remove(user.id)}catch(_){};
            const placementIndex=reactions.indexOf(reaction.emoji.name);
            const pawnYPlacement=getColPawnNumber(placementIndex);
            client.removeListener("gameDelete",endGame);
            if(pawnYPlacement>map.length-1){
              const advMessage=await message.channel.send({content:language.CANT_PLACE_PAWN});
              createCollector();
              return setTimeout(()=>advMessage.deletable?advMessage.delete().catch(()=>{}):undefined,3e3);
            }else{
              map[map.length-1-pawnYPlacement][placementIndex]=emojis[players.indexOf(curPlayer)+1];
              botMessage.content=`${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user}\n\n${addNumbers(map).map(row=>row.join(" ")).join("\n")}`;
              turn++;
              refreshMessage();
              const end=isEnd();
              if(end){
                if(end==emojis[0])return new EndMessage({
                  icon:module.exports.icon,
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  equals:players,
                  reason:language.EQUALITY,
                  rules:module.exports.description
                }).send();
                else if(end==emojis[players.indexOf(curPlayer)+1])return new EndMessage({
                  icon:module.exports.icon,
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  winners:[utils.loopIdGetter(players,turn+1)],
                  losers:[utils.loopIdGetter(players,turn)],
                  reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user.username} ${language.WON_THE_GAME}`,
                  rules:module.exports.description
                }).send();
                else if(end!=emojis[players.indexOf(utils.loopIdGetter(players,turn+1))+1])return new EndMessage({icon:module.exports.icon,
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  winners:[utils.loopIdGetter(players,turn)],
                  losers:[utils.loopIdGetter(players,turn+1)],
                  reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user.username} ${language.WON_THE_GAME}`,
                  rules:module.exports.description
                }).send();
              }else createCollector();
            };
          });
          collector.on("end",collected=>{
            if(!collected.size){
              client.removeListener("gameDelete",endGame);
              new EndMessage({icon:module.exports.icon,
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                losers:players,
                reason:language.TURN_TIMED_OUT,
                rules:module.exports.description
              }).send();
            };
          });
        };
      };
      function isEnd(){
        function checkNullMatch(){
          var hasEmpty=false;
          for(let y=0;y<map.length;y++)for(let x=0;x<map[0].length;x++)if(map[y][x]==emojis[0])hasEmpty=true;
          return!hasEmpty;
        };
        const nullMatch=checkNullMatch();
        if(nullMatch)return emojis[0];
        for(let y=0;y<map.length;y++)for(let x=0;x<map[0].length;x++){
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y][x+1]&&map[y][x]==map[y][x+2]&&map[y][x]==map[y][x+3])return map[y][x];
          }catch(error){};
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y+1][x]&&map[y][x]==map[y+2][x]&&map[y][x]==map[y+3][x])return map[y][x];
          }catch(error){};
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y+1][x+1]&&map[y][x]==map[y+2][x+2]&&map[y][x]==map[y+3][x+3])return map[y][x];
          }catch(error){};
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y-1][x+1]&&map[y][x]==map[y-2][x+2]&&map[y][x]==map[y-3][x+3])return map[y][x];
          }catch(error){};
        };
        return undefined;
      };
      function getColPawnNumber(col){
        var pawnCount=0;
        for(let i=0;i<map.length;i++)if(map[i][col]!=emojis[0])pawnCount++;
        return pawnCount;
      };
    });
  },
  name:"connect4",
  aliases:["c4","fourinarow","fiar"],
  description:"First, decide who goes first and what color each player will have. Players must alternate turns, and only one disc can be dropped in each turn. On your turn, drop one of your colored discs from the top into any of the seven slots. The game ends when there is a 4-in-a-row or a stalemate. The starter of the previous game goes second on the next game.",
  category:"game",
  shortRules:"To play to a connect 4",
  exemples:`\`${process.env.BOT_PREFIX}connect4\` <- no args required`,
  gameName:"Connect 4",
  icon:"https://i.imgur.com/eBaWei8.png",
  cooldown:1.5e4
};