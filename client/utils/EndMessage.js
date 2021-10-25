const Discord=require("discord.js");
const utils=require("./utils");
const Game=require("./Game");
const ms=require("ms");
const db=require("quick.db");
const checkAchievementPass=require("./checkAchievementPass");
const checkClassPass=require("./checkClassPass");
const translateElo=require("./eloTranslator");
const levelCard=require("./lvlCard");
class EndMessage{
  constructor({winners,losers,equals,reason,channel,game,rules,gameStart,hostId,additionalText,icon}){
    this.winners=winners;
    this.losers=losers;
    this.equals=equals;
    this.reason=reason;
    this.game=game;
    this.channel=channel;
    this.rules=rules;
    this.gameStart=gameStart;
    this.hostId=hostId;
    this.additionalText=additionalText;
    this.icon=icon;
  };
  send(){
    (async()=>{
      const language=require(`../../miscellaneous/languages/${db.get(`${this.channel.guild.id}-lang`)||"en"}.json`);
      const commandId=this.game.toLowerCase().replace(/ /g,"");
      if(!client.games.has(this.hostId))return;
      new Game.Delete({client:this.channel.client,gameId:this.hostId});
      const reason=await require("./textToImage")(this.reason);
      const restart=new Discord.MessageButton().setCustomId(`res${commandId}`).setStyle("PRIMARY").setEmoji("🔄").setLabel("Restart");
      const gameDuration=Date.now()-this.gameStart;
      if(!db.has("gametimespent"))db.set("gametimespent",gameDuration);
      else db.add("gametimespent",gameDuration);
      this.channel.send({
        content:`<:discord_joined_new:891064564060401694> **${this.game}** ${language.LASTED} **${ms(gameDuration,{long:true})}**\n<:script:891197007035772938> **${language.RULES}:** ${this.rules}`,
        files:[
          new Discord.MessageAttachment(reason,"reason.jpg")
        ],
        components:[
          new Discord.MessageActionRow().addComponents(restart)
        ]
      }).catch(()=>{});
      if(!this.winners)this.winners=[];
      if(!this.losers)this.losers=[];
      if(!this.equals)this.equals=[];
      const players=[...this.winners,...this.losers,...this.equals];
      var allElo=[];
      players.forEach(playerId=>{
        if(playerId==this.channel.client.user.id)allElo.push(1e3);
        else allElo.push(db.get(`${playerId}.tp`)||1e3);
      });
      function calculateElo(elos,userElo){
        if(elos)return{lowElo:10,highElo:10};
        function sum(para){
          var sum=0;
          para.forEach(p=>sum+=(p||0));
          return sum;
        };
        const gameElo=20;
        elos.splice(elos.indexOf(userElo),1);
        const eloMoy=Math.round(sum(elos)/elos.length);
        const highEloDiff=eloMoy-userElo;
        const lowEloDiff=userElo-eloMoy;
        var highElo=gameElo-Math.round((1000-highEloDiff)/100);
        if(highElo<0)highElo=1;
        var lowElo=gameElo-Math.round((1000-lowEloDiff)/100);
        if(lowElo<0)lowElo=1;
        return{lowElo,highElo};
      };
      if(this.winners&&this.winners.length>0)this.winners.forEach(async winnerId=>{
        if(winnerId==this.channel.client.user.id)return;
        if(!db.get(`${winnerId}.tp`))db.set(`${winnerId}.tp`,1e3);
        const userElo=db.get(`${winnerId}.tp`)||1e3;
        const eloToAdd=calculateElo(allElo,userElo).highElo;
        db.add(`${winnerId}.games.${commandId}[1]`,1);
        if(!db.has(`${winnerId}.games.${commandId}[2]`))db.push(`${winnerId}.games.${commandId}`,1);
        else db.add(`${winnerId}.games.${commandId}[2]`,1);
        if(!db.has(`${winnerId}.games.${commandId}[3]`))db.push(`${winnerId}.games.${commandId}`,gameDuration);
        else db.add(`${winnerId}.games.${commandId}[3]`,gameDuration);
        const classPass=checkClassPass(db.get(`${winnerId}.tp`)+eloToAdd,winnerId);
        const oldLevel=db.get(`${winnerId}.leveling.level`)||1;
        const tokens=utils.addTokens(winnerId,true);
        const leveling=utils.addExp(winnerId,true);
        const achievements=checkAchievementPass({userId:winnerId,guild:this.channel.guild});
        db.add(`${winnerId}.tp`,eloToAdd);
        if(winnerId==this.channel.client.user.id||!db.get(`${winnerId}.dm`))return;
        const lvlCard=await levelCard(this.channel.guild.members.cache.get(winnerId));
        this.channel.guild.members.cache.get(winnerId).send({
          content:`:joystick: **${this.game}** has ended\n**+${eloToAdd} TP** (${utils.numberWithCommas(userElo+eloToAdd)}) 🔺\n${tokens.addedSand?`<:sand_dollar:893893210248728597> **+${utils.numberWithCommas(tokens.addedSand)}** (${utils.numberWithCommas(db.get(`${winnerId}.tokens.sand`)||0)})\n`:""}${tokens.addedHeart?`<a:heart:893889889760845854> **+${tokens.addedHeart}** (${utils.numberWithCommas(db.get(`${winnerId}.tokens.heart`)||0)})\n`:""}${tokens.addedStar?`<a:star:893889889756663849> **+${tokens.addedStar}** (${utils.numberWithCommas(db.get(`${winnerId}.tokens.star`)||0)})\n`:""}${oldLevel<oldLevel+leveling.addedLevel?`🔹 You gained a level! now **level ${oldLevel+leveling.addedLevel}**\n`:""}${achievements.length?`${achievements.map(achievement=>`🎁 ${language.ACHIE_GET} **${achievement.name}** (+ <:sand_dollar:893893210248728597> ${achievement.reward})`).join("\n")}\n`:""}The game lasted **${global.time(gameDuration)}** ⏱️\n${classPass?`📍 ${classPass.oldElo<classPass.newElo?`${language.CONGRATS} `:""}${language.CLASS_CHANGE} **${translateElo(classPass.newElo).class}**`:""}`,
          files:[
            new Discord.MessageAttachment(reason,"reason.jpg"),
            new Discord.MessageAttachment(lvlCard,"lvl-card.jpg")
          ]
        }).catch(()=>{});
      });
      if(this.losers&&this.losers.length>0)this.losers.forEach(async loserId=>{
        if(loserId==this.channel.client.user.id)return;
        if(!db.get(`${loserId}.tp`))db.set(`${loserId}.tp`,1e3);
        const userElo=db.get(`${loserId}.tp`);
        const eloToRemove=calculateElo(allElo,userElo).lowElo;
        db.add(`${loserId}.games.${commandId}[0]`,1);
        if(!db.has(`${loserId}.games.${commandId}[2]`))db.push(`${loserId}.games.${commandId}`,0);
        else db.set(`${loserId}.games.${commandId}[2]`,0);
        if(!db.has(`${loserId}.games.${commandId}[3]`))db.push(`${loserId}.games.${commandId}`,gameDuration);
        else db.add(`${loserId}.games.${commandId}[3]`,gameDuration);
        const classPass=checkClassPass(db.get(`${loserId}.tp`)-eloToRemove,loserId);
        const oldLevel=db.get(`${loserId}.leveling.level`)||1;
        const tokens=utils.addTokens(loserId,false);
        const leveling=utils.addExp(loserId,true);
        const achievements=checkAchievementPass({userId:loserId,guild:this.channel.guild});
        utils.addExp(loserId,false);
        db.subtract(`${loserId}.tp`,eloToRemove);
        if(!db.get(`${loserId}.dm`))return;
        const lvlCard=await levelCard(this.channel.guild.members.cache.get(loserId));
        this.channel.guild.members.cache.get(loserId).send({
          content:`:joystick: **${this.game}** has ended\n**-${eloToRemove} TP** (${utils.numberWithCommas(userElo-eloToRemove)}) 🔻\n${tokens.addedSand?`<:sand_dollar:893893210248728597> **+${utils.numberWithCommas(tokens.addedSand)}** (${utils.numberWithCommas(db.get(`${loserId}.tokens.sand`)||0)})\n`:""}${tokens.addedHeart?`<a:heart:893889889760845854> **+${tokens.addedHeart}** (${utils.numberWithCommas(db.get(`${loserId}.tokens.heart`)||0)})\n`:""}${tokens.addedStar?`<a:star:893889889756663849> **+${tokens.addedStar}** (${utils.numberWithCommas(db.get(`${loserId}.tokens.star`)||0)})\n`:""}${oldLevel<oldLevel+leveling.addedLevel?`🔹 You gained a level! now **level ${oldLevel+leveling.addedLevel}**\n`:""}${achievements.length?`${achievements.map(achievement=>`🎁 ${language.ACHIE_GET} **${achievement.name}** (+ <:sand_dollar:893893210248728597> ${achievement.reward})`).join("\n")}\n`:""}The game lasted **${global.time(gameDuration)}** ⏱️\n${classPass?`📍 ${classPass.oldElo<classPass.newElo?`${language.CONGRATS} `:""}${language.CLASS_CHANGE} **${translateElo(classPass.newElo).class}**`:""}`,
          files:[
            new Discord.MessageAttachment(reason,"reason.jpg"),
            new Discord.MessageAttachment(lvlCard,"lvl-card.jpg")
          ]
        }).catch(()=>{});
      });
      if(this.equals&&this.equals.length>0)this.equals.forEach(async equalId=>{
        if(equalId==this.channel.client.user.id)return;
        db.add(`${equalId}.games.${commandId}[1]`,1);
        if(!db.has(`${equalId}.games.${commandId}[2]`))db.push(`${equalId}.games.${commandId}`,1);
        else db.add(`${equalId}.games.${commandId}[2]`,1);
        if(!db.has(`${equalId}.games.${commandId}[3]`))db.push(`${equalId}.games.${commandId}`,gameDuration);
        else db.add(`${equalId}.games.${commandId}[3]`,gameDuration);
        const oldLevel=db.get(`${equalId}.leveling.level`)||1;
        const tokens=utils.addTokens(equalId,false);
        const leveling=utils.addExp(equalId,false);
        const achievements=checkAchievementPass({userId:equalId,guild:this.channel.guild});
        if(equalId==this.channel.client.user.id||!db.get(`${equalId}.dm`))return;
        const lvlCard=await levelCard(this.channel.guild.members.cache.get(equalId));
        this.channel.guild.members.cache.get(equalId).send({
          content:`:joystick: **${this.game}** has ended\n${tokens.addedSand?`<:sand_dollar:893893210248728597> **+${utils.numberWithCommas(tokens.addedSand)}** (${utils.numberWithCommas(db.get(`${equalId}.tokens.sand`)||0)})\n`:""}${tokens.addedHeart?`<a:heart:893889889760845854> **+${tokens.addedHeart}** (${utils.numberWithCommas(db.get(`${equalId}.tokens.heart`)||0)})\n`:""}${tokens.addedStar?`<a:star:893889889756663849> **+${tokens.addedStar}** (${utils.numberWithCommas(db.get(`${equalId}.tokens.star`)||0)})\n`:""}${oldLevel<oldLevel+leveling.addedLevel?`🔹 You gained a level! now **level ${oldLevel+leveling.addedLevel}**\n`:""}${achievements.length?`${achievements.map(achievement=>`🎁 ${language.ACHIE_GET} **${achievement.name}** (+ <:sand_dollar:893893210248728597> ${achievement.reward})`).join("\n")}\n`:""}The game lasted **${global.time(gameDuration)}** ⏱️`,
          files:[
            new Discord.MessageAttachment(reason,"reason.jpg"),
            new Discord.MessageAttachment(lvlCard,"lvl-card.jpg")
          ]
        }).catch(()=>{});
      });
    })();
  };
};
module.exports=EndMessage;