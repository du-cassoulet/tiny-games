const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const utils=require("../utils/utils");
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
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:6,
      minPlayers:1
    });
    lobby.start(async(players,botMessage)=>{
      const gameStart=Date.now();
      const inGamePlayers=players.map(p=>{
        return{id:p,choice:undefined};
      });
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:botMessage.embeds
      });
      botMessage.embeds=[
        new Discord.MessageEmbed()
        .setDescription(inGamePlayers.map(player=>`${message.guild.members.cache.get(player.id).user}: ${player.choice?"<:On:870024897315880991>":"<:None:870024851803492433>"}`).join("\n"))
        .setColor(utils.userStyle(message.author.id).main_color)
      ];
      botMessage.components=[
        new Discord.MessageActionRow()
        .addComponents(
          new Discord.MessageButton().setCustomId("heads").setLabel(language.HEADS).setStyle("SECONDARY"),
          new Discord.MessageButton().setCustomId("tails").setLabel(language.TAILS).setStyle("SECONDARY")
        )
      ];
      botMessage.content="🪙 "+language.SELECT_SIDE;
      refreshMessage();
      var alreadyFell=false;
      const collector=botMessage.createMessageComponentCollector({time:1.5e4});
      client.addListener("gameDelete",endGame);
      function endGame(gameId){
        if(gameId!=message.author.id)return;
        ended=true;
        collector.stop();
        client.removeListener("gameDelete",endGame);
      };
      collector.on("collect",async button=>{
        await button.deferUpdate().catch(()=>{});
        inGamePlayers.find(player=>player.id==button.user.id).choice=button.customId;
        const embed=new Discord.MessageEmbed()
        .setDescription(inGamePlayers.map(player=>`${message.guild.members.cache.get(player.id).user}: ${player.choice?"<:On:870024897315880991>":"<:None:870024851803492433>"}`).join("\n"))
        .setColor(utils.userStyle(message.author.id).main_color);
        if(inGamePlayers.filter(player=>player.choice).length>=inGamePlayers.length){
          alreadyFell=true;
          collector.stop();
          embed.setImage("https://i.pinimg.com/originals/8f/06/04/8f0604aedc34d33d2f41113c312a588d.gif");
          setTimeout(()=>{
            embed.setImage(undefined);
            botMessage.embeds=[embed];
            refreshMessage();
            const results=["heads","tails"];
            const result=results[Math.floor(Math.random()*results.length)];
            new EndMessage({icon:module.exports.icon,
              reason:`${language.COIN_FELL_ON} ${result}`,
              channel:message.channel,
              game:module.exports.gameName,
              hostId:message.author.id,
              gameStart:gameStart,
              losers:inGamePlayers.filter(player=>player.choice!=result).map(p=>p.id),
              winners:inGamePlayers.filter(player=>player.choice==result).map(p=>p.id),
              rules:module.exports.description
            }).send();
          },1.2e3);
        };
        botMessage.embeds=[embed];
        refreshMessage();
      });
      collector.on("end",()=>{
        client.removeListener("gameDelete",endGame);
        if(alreadyFell)return;
        const embed=new Discord.MessageEmbed()
        .setDescription(inGamePlayers.map(player=>`${message.guild.members.cache.get(player.id).user}: ${player.choice?"<:On:870024897315880991>":"<:None:870024851803492433>"}`).join("\n"))
        .setColor(utils.userStyle(message.author.id).main_color);
        embed.setImage("https://i.pinimg.com/originals/8f/06/04/8f0604aedc34d33d2f41113c312a588d.gif");
        setTimeout(()=>{
          embed.setImage(undefined);
          botMessage.embeds=[embed];
          refreshMessage();
          const results=["heads","tails"];
          const result=results[Math.floor(Math.random()*results.length)];
          new EndMessage({icon:module.exports.icon,
            reason:`${language.COIN_FELL_ON} ${result}`,
            channel:message.channel,
            game:module.exports.gameName,
            hostId:message.author.id,
            gameStart:gameStart,
            losers:inGamePlayers.filter(player=>player.choice!=result).map(p=>p.id),
            winners:inGamePlayers.filter(player=>player.choice==result).map(p=>p.id),
            rules:module.exports.description
          }).send();
        },1.2e3);
        botMessage.embeds=[embed];
        refreshMessage();
      });
    });
  },
  name:"headsortails",
  aliases:["ht","hot","flipcoin","flc"],
  description:"To flip a coin for such an effect, the player flips the coin and calls “heads” or “tails.” If the call matches the result, the player wins the flip. Otherwise, the player loses the flip. Only the player who flips the coin wins or loses the flip; no other players are involved.",
  category:"game",
  shortRules:"To flip a coin",
  exemples:`\`${process.env.BOT_PREFIX}headsortails\` <- no args required`,
  gameName:"Heads or tails",
  icon:"https://i.imgur.com/6DA776B.png",
  cooldown:5e3
};