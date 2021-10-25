const Discord=require("discord.js");
const utils=require("../utils/utils");
const db=require("quick.db");
const ms=require("ms");
const createUser=require("../utils/createUser");
const cooldown=new Set();
module.exports={
  event:"messageCreate",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {Discord.Message} message 
   */
  func:async(client,message)=>{
    if(message.author.bot||!message.guild)return;
    const prefix=db.get(`${message.guild.id}-prefix`)||process.env.BOT_PREFIX;
    // console.log(message.guild.emojis.cache.map(emoji=>`<${emoji.animated?"a":""}:${emoji.name}:${emoji.id}>`));
    const language=require(`../../miscellaneous/languages/${db.get(`${message.guild.id}-lang`)||"en"}.json`);
    if(!message.content.startsWith(prefix)&&!message.content.startsWith(`${prefix} `))return;
    const args=message.content.slice(prefix.length).trim().split(/ +/g);
    const command=args.shift().toLowerCase();
    if(client.commands.has(command)){
      playCommand(client.commands.get(command));
    }else if(client.aliases.has(command)){
      playCommand(client.commands.get(client.aliases.get(command)));
    }else{
      const allCommands=client.commands.toJSON().map(cmd=>cmd.name);
      const allAliases=[];
      client.commands.toJSON().forEach(cmd=>{
        if(cmd.aliases)cmd.aliases.forEach(alias=>allAliases.push(alias));
      });
      const cmdVerif=similarCommand(command,allCommands);
      const aliasVerif=similarCommand(command,allAliases);
      if(cmdVerif)askCorrect(cmdVerif,client.commands.get(cmdVerif));
      else if(aliasVerif)askCorrect(aliasVerif,client.commands.get(client.aliases.get(aliasVerif)));
    };
    async function askCorrect(correctCommand,command){
      const botMessage=await message.reply({
        content:`${language.DID_YOU_MEANT} \`${correctCommand}\` ?`
      });
      botMessage.react("870024897315880991");
      botMessage.react("869978532489617458");
      const collector=botMessage.createReactionCollector({
        time:1.5e4,
        filter:(reaction,user)=>(reaction.emoji.id=="869978532489617458"||reaction.emoji.id=="870024897315880991")&&user.id==message.author.id
      });
      collector.on("collect",reaction=>{
        collector.stop();
        if(reaction.emoji.id=="870024897315880991")playCommand(command);
      });
      collector.on("end",()=>{
        if(botMessage.deletable)botMessage.delete().catch(()=>{});
      });
    };
    function playCommand(command){
      createUser({client,userId:message.author.id});
      if(cooldown.has(`${message.author.id}${command.name}`))return message.reply({content:`:stopwatch: ${language.COOLDOWN_WAIT} **${ms(command.cooldown,{long:true})}** ${language.PLAY_COMMAND_BACK}`});
      cooldown.add(`${message.author.id}${command.name}`);
      setTimeout(()=>cooldown.delete(`${message.author.id}${command.name}`),command.cooldown);
      utils.addCommand(command.name,command.category=="game");
      global.logger.status(`Command "${command.file}" is now running. Executed by [${message.author.tag}] in [${message.guild.name}]`);
      if(!db.has("commandnumber"))db.set("commandnumber",1);
      else db.add("commandnumber",1);
      return command.func({client,message,args,language});
    };
    function similarCommand(command,neededArray){
      const letterArray=word=>word.split("").sort();
      function similarities(arrayA,arrayB){
        var mostLength=arrayA.length;
        if(arrayB.length>arrayA.length)mostLength=arrayB.length;
        var matches=0;
        for(i=0;i<arrayA.length;i++){
          if(arrayB.indexOf(arrayA[i])!=-1)matches++;
        };
        return matches*100/mostLength;
      };
      var result;
      const wLetters=letterArray(command);
      neededArray.forEach(command=>{
        if(result)return;
        const cmdLetters=letterArray(command);
        if(similarities(wLetters,cmdLetters)>=80)return result=command;
      });
      return result;
    };
  }
};
// console.log(message.guild.emojis.cache.map(emoji=>`<${emoji.animated?"a":""}:${emoji.name}:${emoji.id}>`));