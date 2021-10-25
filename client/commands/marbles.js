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
  func:async({client,message})=>{
    const lobby=new Lobby({
      acceptablePlayers:1,
      game:module.exports.gameName,
      hostId:message.author.id,
      icon:module.exports.icon,
      maxPlayers:2,
      minPlayers:1,
      message:message,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const gameStart=Date.now();
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:[]
      });
      if(players.length<2)players.push(client.user.id);
      var curTurn=0;
      players=utils.shuffle(players);
      const marbleNumber=10;
      const allPlayers=players.map(player=>({id:player,marbleNumber}));
      playTurn();
      function playTurn(){
        betTime();
        function betTime(){
          const buttons=[];
          for(let i=0;i<4;i++){
            buttons.push(
              new Discord.MessageButton()
              .setCustomId((i+1).toString())
              .setStyle("SECONDARY")
              .setLabel(`${i+1} marbles`)
            );
          };
          botMessage.content=`${message.guild.members.cache.get(utils.loopIdGetter(allPlayers,curTurn).id).user} have to input a number of marbles to bet (you have 30 seconds)\n\n${allPlayers.map(player=>{
            const marbles=[];
            for(let i=0;i<player.marbleNumber;i++)marbles.push("🟢");
            return`> ${message.guild.members.cache.get(player.id).user.username}'s marble bag: ${marbles.join(" ")} [${marbles.length}]`;
          }).join("\n")}`;
          botMessage.components=[
            new Discord.MessageActionRow()
            .addComponents(...buttons)
          ];
          refreshMessage();
          if(utils.loopIdGetter(allPlayers,curTurn).id==client.user.id){
            setTimeout(()=>{
              return pairOrNot(Math.floor(Math.random()*4)+1);
            },Math.floor(Math.random()*3e3)+2e3);
          }else{
            const collector=botMessage.createMessageComponentCollector({
              time:3e4,
              max:1,
              filter:button=>button.user.id==utils.loopIdGetter(allPlayers,curTurn).id
            });
            collector.on("collect",async button=>{
              await button.deferUpdate();
              return pairOrNot(parseInt(button.customId));
            });
            collector.on("end",collected=>{
              if(!collected.size)return new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                icon:module.exports.icon,
                losers:players.find(p=>p==utils.loopIdGetter(allPlayers,curTurn).id),
                winners:players.find(p=>p!=utils.loopIdGetter(allPlayers,curTurn).id),
                reason:`${message.guild.members.cache.get(utils.loopIdGetter(allPlayers,curTurn).id).user.username} took to long`,
                rules:module.exports.description
              });
            });
          };
        };
        function pairOrNot(marbleNumber){
          curTurn++;
          const isPair=num=>num%2==0;
          botMessage.components=[
            new Discord.MessageActionRow()
            .addComponents(
              new Discord.MessageButton()
              .setCustomId("pair")
              .setStyle("SECONDARY")
              .setLabel("Pair"),
              new Discord.MessageButton()
              .setCustomId("odd")
              .setStyle("SECONDARY")
              .setLabel("Odd")
            )
          ];
          botMessage.content=`${message.guild.members.cache.get(utils.loopIdGetter(allPlayers,curTurn).id).user} is the number of bet marbles pair or odd ?`;
          refreshMessage();
          if(utils.loopIdGetter(allPlayers,curTurn).id==client.user.id){
            const possibleResponces=["pair","odd"];
            setTimeout(()=>{
              return response(possibleResponces[Math.floor(Math.random()*possibleResponces.length)]);
            },Math.floor(Math.random()*3e3)+2e3);
          }else{
            const collector=botMessage.createMessageComponentCollector({
              time:3e4,
              max:1,
              filter:button=>button.user.id==utils.loopIdGetter(allPlayers,curTurn).id
            });
            collector.on("collect",async button=>{
              await button.deferUpdate();
              response(button.customId);
            });
            collector.on("end",collected=>{
              if(!collected.size)return new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                icon:module.exports.icon,
                losers:players.filter(p=>p==utils.loopIdGetter(allPlayers,curTurn).id),
                winners:players.filter(p=>p!=utils.loopIdGetter(allPlayers,curTurn).id),
                reason:`${message.guild.members.cache.get(utils.loopIdGetter(allPlayers,curTurn).id).user.username} took to long`,
                rules:module.exports.description
              }).send();
            });
          };
          function response(resp){
            if((resp=="pair"&&isPair(marbleNumber))||(resp=="odd"&&!isPair(marbleNumber))){
              allPlayers.find(p=>p.id==utils.loopIdGetter(allPlayers,curTurn).id).marbleNumber+=marbleNumber;
              allPlayers.find(p=>p.id!=utils.loopIdGetter(allPlayers,curTurn).id).marbleNumber-=marbleNumber;
              botMessage.content=`**Good answer!** The number was ${marbleNumber} (${isPair(marbleNumber)?"pair":"odd"})`;
            }else{
              allPlayers.find(p=>p.id==utils.loopIdGetter(allPlayers,curTurn).id).marbleNumber-=marbleNumber;
              allPlayers.find(p=>p.id!=utils.loopIdGetter(allPlayers,curTurn).id).marbleNumber+=marbleNumber;
              botMessage.content=`**Wrong answer!** The number was ${marbleNumber} (${isPair(marbleNumber)?"pair":"odd"})`;
            };
            botMessage.components=[];
            refreshMessage();
            setTimeout(()=>{
              const noMarblesPlayer=allPlayers.find(player=>player.marbleNumber<=0);
              if(noMarblesPlayer){
                return new EndMessage({
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  icon:module.exports.icon,
                  losers:players.filter(p=>p==noMarblesPlayer.id),
                  winners:players.filter(p=>p!=noMarblesPlayer.id),
                  reason:`${message.guild.members.cache.get(players.find(p=>p==noMarblesPlayer.id)).user.username} lost all of his marbles`,
                  rules:module.exports.description
                }).send();
              }else betTime();
            },3e3);
          };
        };
      };
    });
  },
  name:"marbles",
  gameName:"Marbles",
  description:"Everyone have 10 marbles at the begining of the game, you have to bet a number of marbles ans your opponent have to guess if you bet a pair or an odd number of marbles, if he is correct, he have to pick the number of marbles you bet, if he is incorrect, you have to pick the number of marbles you bet.",
  category:"game",
  shortRules:"To play to the marbles",
  exemples:`\`${process.env.BOT_PREFIX}marbles\` <- no args required`,
  cooldown:1.5e4
};