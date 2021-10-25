const Discord=require("discord.js");
const Language=require("../../miscellaneous/languages/en.json");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
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
      acceptablePlayers:1,
      game:module.exports.gameName,
      hostId:message.author.id,
      icon:module.exports.icon,
      maxPlayers:3,
      minPlayers:1,
      message:message,
      rules:module.exports.description
    });
    lobby.start((players,botMessage)=>{
      const gameStart=Date.now();
      var score=0;
      var curTurn=0;
      const emojis=["⬜","📍","🔻"];
      const blocks=["🟥","🟧","🟨","🟩","🟦","🟪","🟫"];
      var map=[];
      for(let i=0;i<6;i++){
        map.push([emojis[0],emojis[0],emojis[0],emojis[0]]);
      };
      const numbers=["1️⃣","2️⃣","3️⃣","4️⃣"];
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:[]
      });
      var cBlock=blocks[Math.floor(Math.random()*blocks.length)];
      function mapToContent(map,cBlock){
        const potMap=[];
        map.forEach(row=>potMap.push([...row]));
        potMap.unshift([emojis[1],emojis[1],emojis[1],emojis[1]]);
        if(players.length>1){
          potMap[0].push(` **|** ${language.TURN_FOR} ${message.guild.members.cache.get(utils.loopIdGetter(players,curTurn)).user}`)
          potMap[1].push(` **|** 🔹 ${language.SCORE}: **${score}**`);
          potMap[2].push(` **|** 🧱 Block: **${cBlock}**`);
        }else{
          potMap[0].push(` **|** 🔹 ${language.SCORE}: **${score}**`);
          potMap[1].push(` **|** 🧱 Block: **${cBlock}**`);
        };
        potMap.push([emojis[2],emojis[2],emojis[2],emojis[2]]);
        potMap.push(numbers);
        return potMap;
      };
      botMessage.components=[];
      botMessage.content=mapToContent(map,cBlock).map(r=>r.join("")).join("\n");
      refreshMessage();
      numbers.forEach(number=>botMessage.react(number));
      createCollector();
      function destroyExeed(map){
        destroyPart();
        function destroyPart(){
          const allDeletable=[];
          for(let y=0;y<6;y++)for(let x=0;x<4;x++){
            if(blocks.includes(map[y][x])){
              const sameAround=[];
              sameAround.push({x,y});
              if(map[y][x+1]==map[y][x])sameAround.push({x:x+1,y:y});
              if(map[y][x-1]==map[y][x])sameAround.push({x:x-1,y:y});
              if(map[y+1]&&map[y+1][x]==map[y][x])sameAround.push({x:x,y:y+1});
              if(map[y-1]&&map[y-1][x]==map[y][x])sameAround.push({x:x,y:y-1});
              if(sameAround.length>2)allDeletable.push(sameAround);
            };
          };
          const toDelete=[];
          allDeletable.forEach(results=>results.forEach(coordinates=>{
            if(!toDelete.find(c=>c.x==coordinates.x&&c.y==coordinates.y))toDelete.push(coordinates);
          }));
          toDelete.forEach(coordinates=>map[coordinates.y][coordinates.x]=emojis[0]);
          if(toDelete.length)score+=(toDelete.length-2);
          for(let x=3;x>=0;x--)for(let y=5;y>=0;y--){
            var lowerCoef=1;
            while(map[y+lowerCoef]&&!blocks.includes(map[y+lowerCoef][x])){
              map[y+lowerCoef][x]=map[y+lowerCoef-1][x];
              map[y+lowerCoef-1][x]=emojis[0];
              lowerCoef++;
            };
          };
          if(toDelete.length)destroyPart();
        };
        return map;
      };
      function createCollector(){
        var ended=false;
        const collector=botMessage.createReactionCollector({
          max:1,
          time:6e4,
          filter:(reaction,user)=>numbers.includes(reaction.emoji.name)&&user==utils.loopIdGetter(players,curTurn)
        });
        client.addListener("gameDelete",endGame);
        function endGame(gameId){
          if(gameId!=message.author.id)return;
          ended=true;
          collector.stop();
          client.removeListener("gameDelete",endGame);
        };
        collector.on("collect",(reaction,user)=>{
          try{reaction.users.remove(user.id)}catch(_){};
          const blockIndex=numbers.indexOf(reaction.emoji.name);
          var rowPos=0;
          for(let y=0;y<6;y++){
            if(blocks.includes(map[y][blockIndex]))rowPos++;
          };
          if(rowPos>5)return new EndMessage({
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            icon:module.exports.icon,
            losers:players,
            reason:"You reached the limit",
            rules:module.exports.description
          }).send();
          map[5-rowPos][blockIndex]=cBlock;
          map=destroyExeed(map);
          if(score>=15)return new EndMessage({
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            icon:module.exports.icon,
            winners:players,
            reason:"You reached the score of 30",
            rules:module.exports.description
          }).send();
          cBlock=blocks[Math.floor(Math.random()*blocks.length)];
          curTurn++;
          botMessage.content=mapToContent(map,cBlock).map(r=>r.join("")).join("\n");
          refreshMessage();
          if(!ended)createCollector();
        });
        collector.on("end",collected=>{
          client.removeListener("gameDelete",endGame);
          if(!collected.size)return new EndMessage({
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            losers:players,
            reason:language.END_INACTIVITY,
            rules:module.exports.description,
            gameStart:gameStart,
            icon:module.exports.icon
          });
        });
      };
    });
  },
  name:"3colors",
  gameName:"3 colors",
  aliases:["3c"],
  description:"You have to connect 3 colors to destroy them, if you reach the score of 15, you win the game but if you reach the height limit, you lose!",
  category:"game",
  shortRules:"To play to 3 colors",
  exemples:`\`${process.env.BOT_PREFIX}3colors\` <- no args required`,
  cooldown:1.5e4
};