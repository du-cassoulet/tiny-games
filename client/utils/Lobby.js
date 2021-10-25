const Discord=require("discord.js");
const textToImage=require("./textToImage");
const Game=require("./Game");
const utils=require("./utils");
const db=require("quick.db");
const translate=require("@vitalets/google-translate-api");
const createUser=require("./createUser");
class Lobby{
  constructor({hostId,message,game,rules,minPlayers,maxPlayers,gamemodes,icon,acceptablePlayers}){
    this.hostId=hostId;
    this.game=game;
    this.rules=rules;
    this.message=message;
    this.minPlayers=minPlayers;
    this.maxPlayers=maxPlayers;
    this.gamemodes=gamemodes;
    this.icon=icon;
  };
  start(callback){
    (async()=>{
      const language=require(`../../miscellaneous/languages/${db.get(`${this.message.guild.id}-lang`)||"en"}.json`);
      if(this.message.client.games.has(this.hostId)||this.message.client.inGame.has(this.hostId))return this.message.channel.send({content:language.CANT_START});
      new Game.Create({
        client:this.message.client,
        gameId:this.hostId,
        minPlayers:this.minPlayers,
        channelId:this.message.channel.id,
        gameName:this.game,
        gameStart:Date.now(),
        starting:true,
        guildId:this.message.guild.id
      });
      global.logger.game(`Game [${this.hostId}] created (${this.game}) with ${client.games.get(this.hostId).players.length} player${client.games.get(this.hostId).players.length>1?"s":""} in ${this.message.guild.name}`);
      const joinButton=new Discord.MessageButton().setCustomId("join").setStyle("PRIMARY").setLabel(language.JOIN);
      const leaveButton=new Discord.MessageButton().setCustomId("leave").setStyle("SECONDARY").setLabel(language.LEAVE);
      const startGame=new Discord.MessageButton().setLabel(language.START).setCustomId("start").setStyle("SECONDARY").setDisabled(this.minPlayers==1?false:true);
      const cancelGame=new Discord.MessageButton().setLabel(language.CANCEL).setCustomId("cancel").setStyle("SECONDARY");
      const settings=new Discord.MessageButton().setLabel(language.SETTINGS).setEmoji("🛠️").setCustomId("settings").setStyle("SECONDARY").setDisabled(this.gamemodes?false:true);
      const players=[this.hostId];
      var commandRules=await translate(this.rules,{from:"en",to:language.languageRegion});
      commandRules=commandRules.text;
      const lobbyMessage=await this.message.channel.send({
        content:`<:discord_joined_new:891064564060401694> **${this.message.guild.members.cache.get(this.hostId).user.username}** ${language.IS_HOSTING} **${this.game}**\n<:script:891197007035772938> **${language.RULES}:** ${commandRules}\n\n${players.map((userId,index)=>`<:N_:718506491660992735>${global.pIcons[index]} ${this.message.guild.members.cache.get(userId).user}`).join("\n")}\n\n**${players.length>=this.minPlayers?language.NO:(this.minPlayers-players.length).toString()}** ${this.minPlayers-players.length>1?language.MORE_PLAYERS:language.MORE_PLAYER} ${language.NEEDED}`,
        components:[
          new Discord.MessageActionRow()
          .addComponents(joinButton,startGame,leaveButton,cancelGame,settings)
        ]
      });
      function refreshMessage(message){
        message.edit({
          content:message.content,
          embeds:message.embeds,
          components:message.components
        });
      };
      const collector=lobbyMessage.createMessageComponentCollector({time:3e5});
      var selectedGamemode;
      var inChoice;
      collector.on("collect",async button=>{
        if(button.customId=="join"){
          await button.deferUpdate().catch(()=>{});
          createUser({client:this.message.client,userId:button.user.id});
          if(players.includes(button.user.id))return;
          if(players.length>=this.maxPlayers)return this.message.channel.send({
            embeds:[
              new Discord.MessageEmbed()
              .setAuthor(`${language.MATCH_HAVE_UP} ${this.maxPlayers} ${language.PLAYERS}`)
              .setDescription(`${language.DO_COMMAND} ${db.get(`${this.message.guild}-prefix`)||process.env.BOT_PREFIX}help ${language.SEE_COMMAND_STATS}`)
              .setColor(utils.userStyle(button.user.id).error_color)
            ]
          });
          if(this.message.client.games.has(button.user.id)||this.message.client.inGame.has(button.user.id))return this.message.channel.send({content:language.CANT_JOIN});
          players.push(button.user.id);
          new Game.AddPlayer({client:this.message.client,gameId:this.hostId,userId:button.user.id});
          lobbyMessage.content=`<:discord_joined_new:891064564060401694> **${this.message.guild.members.cache.get(this.hostId).user.username}** ${language.IS_HOSTING} **${this.game}**\n<:script:891197007035772938> **${language.RULES}:** ${commandRules}\n\n${players.map((userId,index)=>`<:N_:718506491660992735>${global.pIcons[index]} ${this.message.guild.members.cache.get(userId).user}`).join("\n")}\n\n**${players.length>=this.minPlayers?language.NO:(this.minPlayers-players.length).toString()}** ${this.minPlayers-players.length>1?language.MORE_PLAYERS:language.MORE_PLAYER} ${language.NEEDED}`;
          if(players.length>=this.minPlayers)lobbyMessage.components[0].components[1].setDisabled(false);
          refreshMessage(lobbyMessage);
        }else if(button.customId=="leave"){
          await button.deferUpdate().catch(()=>{});
          if(button.user.id==this.hostId)return;
          if(!players.includes(button.user.id))return;
          players.splice(players.indexOf(button.user.id),1);
          new Game.RemovePlayer({client:this.message.client,userId:button.user.id});
          lobbyMessage.content=`<:discord_joined_new:891064564060401694> **${this.message.guild.members.cache.get(this.hostId).user.username}** ${language.IS_HOSTING} **${this.game}**\n<:script:891197007035772938> **${language.RULES}:** ${commandRules}\n\n${players.map((userId,index)=>`<:N_:718506491660992735>${global.pIcons[index]} ${this.message.guild.members.cache.get(userId).user}`).join("\n")}\n\n**${players.length>=this.minPlayers?language.NO:(this.minPlayers-players.length).toString()}** ${this.minPlayers-players.length>1?language.MORE_PLAYERS:language.MORE_PLAYER} ${language.NEEDED}`;
          refreshMessage(lobbyMessage);
        }else if(button.customId=="start"){
          await button.deferUpdate().catch(()=>{});
          if(button.user.id!=this.hostId)return;
          collector.stop();
          client.games.get(this.hostId).starting=false;
          client.games.get(this.hostId).minPlayers=client.games.get(this.hostId).players.length;
          callback.bind(this)(client.games.get(this.hostId).players,lobbyMessage,selectedGamemode);
        }else if(button.customId=="cancel"){
          await button.deferUpdate().catch(()=>{});
          if(button.user.id!=this.hostId)return;
          collector.stop();
          new Game.Delete({client:this.message.client,gameId:this.hostId});
          if(lobbyMessage.deletable)lobbyMessage.delete().catch(()=>{});
        }else if(button.customId=="settings"){
          await button.deferUpdate().catch(()=>{});
          this.gamemodes=this.gamemodes.map(gamemode=>{
            gamemode.value=gamemode.label.toLowerCase().replace(/[ \-_]/g,"_");
            gamemode.custom_id=gamemode.label.toLowerCase().replace(/[ \-_]/g,"_");
            return gamemode;
          });
          lobbyMessage.edit({
            content:`${language.SELECT_MODE} [${this.gamemodes.map(gm=>gm.label).join(", ")}]`,
            embeds:[],
            components:[
              new Discord.MessageActionRow()
              .addComponents(
                new Discord.MessageSelectMenu()
                .setCustomId("gamemode")
                .setPlaceholder(language.NOTHING_SELECTED)
                .addOptions(this.gamemodes)
              ),
              new Discord.MessageActionRow()
              .addComponents(
                new Discord.MessageButton()
                .setLabel(language.SELECT)
                .setStyle("SUCCESS")
                .setCustomId("select-selector"),
                new Discord.MessageButton()
                .setLabel(language.CANCEL)
                .setStyle("SECONDARY")
                .setCustomId("cancel-selector")
              )
            ]
          });
        }else if(button.customId=="gamemode"){
          await button.deferUpdate().catch(()=>{});
          if(button.user.id!=this.hostId)return;
          inChoice=button.values[0];
        }else if(button.customId=="select-selector"){
          await button.deferUpdate().catch(()=>{});
          if(button.user.id!=this.hostId)return;
          selectedGamemode=inChoice;
          lobbyMessage.content=`<:discord_joined_new:891064564060401694> **${this.message.guild.members.cache.get(this.hostId).user.username}** ${language.IS_HOSTING} **${this.game}**\n<:script:891197007035772938> **${language.RULES}:** ${commandRules}\n\n${players.map((userId,index)=>`<:N_:718506491660992735>${global.pIcons[index]} ${this.message.guild.members.cache.get(userId).user}`).join("\n")}\n\n**${players.length>=this.minPlayers?language.NO:(this.minPlayers-players.length).toString()}** ${this.minPlayers-players.length>1?language.MORE_PLAYERS:language.MORE_PLAYER} ${language.NEEDED}`;
          refreshMessage(lobbyMessage);
        }else if(button.customId=="cancel-selector"){
          await button.deferUpdate().catch(()=>{});
          if(button.user.id!=this.hostId)return;
          lobbyMessage.content=`<:discord_joined_new:891064564060401694> **${this.message.guild.members.cache.get(this.hostId).user.username}** ${language.IS_HOSTING} **${this.game}**\n<:script:891197007035772938> **${language.RULES}:** ${commandRules}\n\n${players.map((userId,index)=>`<:N_:718506491660992735>${global.pIcons[index]} ${this.message.guild.members.cache.get(userId).user}`).join("\n")}\n\n**${players.length>=this.minPlayers?language.NO:(this.minPlayers-players.length).toString()}** ${this.minPlayers-players.length>1?language.MORE_PLAYERS:language.MORE_PLAYER} ${language.NEEDED}`;
          refreshMessage(lobbyMessage);
        };
      });
      collector.on("end",async collected=>{
        if(!collected.filter(component=>component.customId=="start"||component.customId=="cancel").size){
          const textBuffer=await textToImage(language.END_INACTIVITY);
          const attachment=new Discord.MessageAttachment(textBuffer,"reason.jpg");
          this.message.reply({
            content:`${language.THE_GAME} ${this.game} ${language.HAS_STOPPED}`,
            files:[attachment]
          });
          new Game.Delete({client:this.message.client,gameId:this.hostId});
        };
      });
    })();
  };
};
module.exports=Lobby;