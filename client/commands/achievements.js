const Discord=require("discord.js");
const Language=require("../../miscellaneous/languages/en.json");
const db=require("quick.db");
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
  func:async({message,language,args})=>{
    const member=message.mentions.members.first()||message.guild.members.cache.get(args[1])||message.guild.members.cache.get(args[0])||message.member;
    var achievements=require("../../public/json/achievements.json");
    if(!achievements.length)return message.reply({content:language.POSSIBLE_ACHIEVEMENTS});
    achievements=achievements.sort((a,b)=>a.reward-b.reward);
    var victories=0;
    var defeats=0;
    const highestGame={
      victories:{count:0},
      defeats:{count:0},
      played:{count:0}
    };
    function toProgressBar(num,max){
      const isFloat=n=>Number(n)==n&&n%1!=0;
      var str="";
      const[bar,sBar,blank]=["<:pixilframe094:893765434044739595>","<:pixilframe095:893765433600126977>","<:N_:718506491660992735>"];
      const tileNumber=Math.round((num*20)/max);
      var dbTileNumber=tileNumber/2;
      var plusSemi=false;
      var voidNumber=10;
      if(isFloat(dbTileNumber)){
        dbTileNumber=Math.floor(dbTileNumber);
        plusSemi=true;
        voidNumber--;
      };
      voidNumber-=dbTileNumber;
      for(let i=0;i<dbTileNumber;i++)str+=bar;
      if(plusSemi)str+=sBar;
      for(let i=0;i<voidNumber;i++)str+=blank;
      return str;
    };
    Object.entries(db.get(`${member.id}.games`)).forEach(result=>{
      const[gameName,results]=result;
      defeats+=results[0]||0;
      victories+=results[1]||0;
      if(!highestGame.victories.count)highestGame.victories={game:gameName,count:0};
      if(!highestGame.defeats.count)highestGame.defeats={game:gameName,count:0};
      if(!highestGame.played.count)highestGame.played={game:gameName,count:0};
      if(highestGame.victories.count<results[1])highestGame.victories={game:gameName,count:results[1]};
      if(highestGame.defeats.count<results[0])highestGame.defeats={game:gameName,count:results[0]};
      if(highestGame.played.count<results[0]+results[1])highestGame.played={game:gameName,count:results[0]+results[1]};
    });
    var neededSpace=[0,0];
    achievements=achievements.map(achievement=>{
      var progress_bar=0;
      if(achievement.parameters.victories){
        if(achievement.parameters.game){
          if(achievement.parameters.game=="[highest]")progress_bar={
            progress:db.get(`${member.id}.games.${highestGame.victories.game}[1]`)||0,
            needed:achievement.parameters.victories
          };
          else progress_bar={
            progress:db.get(`${member.id}.games.${achievement.parameters.game}[1]`)||0,
            needed:achievement.parameters.victories
          };
        }else progress_bar={
          progress:victories||0,
          needed:achievement.parameters.victories
        };
      }else if(achievement.parameters.defeats){
        if(achievement.parameters.game){
          if(achievement.parameters.game=="[highest]")progress_bar={
            progress:db.get(`${member.id}.games.${highestGame.defeats.game}[0]`)||0,
            needed:achievement.parameters.defeats
          };
          else progress_bar={
            progress:db.get(`${member.id}.games.${achievement.parameters.game}[0]`)||0,
            needed:achievement.parameters.defeats
          };
        }else progress_bar={
          progress:defeats||0,
          needed:achievement.parameters.defeats
        };
      }else if(achievement.parameters.tokens){
        progress_bar={
          progress:db.get(`${member.id}.tokens.sand`)||0,
          needed:achievement.parameters.tokens
        };
      };
      if(utils.numberWithCommas(progress_bar.progress).length>neededSpace[0])neededSpace[0]=utils.numberWithCommas(progress_bar.progress).length;
      if(utils.numberWithCommas(progress_bar.needed).length>neededSpace[1])neededSpace[1]=utils.numberWithCommas(progress_bar.needed).length;
      progress_bar.bar=toProgressBar(progress_bar.progress>progress_bar.needed?progress_bar.needed:progress_bar.progress,progress_bar.needed);
      return{progress_bar,...achievement};
    });
    function stack(n,char="ㅤ"){
      var stack="";
      for(let i=0;i<n;i++)stack+=char;
      return stack;
    };
    const embed=new Discord.MessageEmbed();
    const itemsPerPage=7;
    const maxPages=Math.ceil(achievements.length/itemsPerPage);
    const page=args[0]&&!isNaN(args[0])&&parseInt(args[0])<=maxPages&&parseInt(args[0])>0?parseInt(args[0]):1;
    achievements.slice((page-1)*itemsPerPage,(page-1)*itemsPerPage+itemsPerPage).forEach(achievement=>{
      embed.addField(`${(achievement.progress_bar.bar.match(/<:pixilframe094:893765434044739595>|<:pixilframe095:893765433600126977>/g)||[]).length?"<:point_green:893779645839863818>":"<:point_grey:893784055634595861>"} ${achievement.name}`,`<:Reply_Continued:893779129999192065> [+ ${achievement.progress_bar.progress>=achievement.progress_bar.needed?"~~":""}<:sand_dollar:893893210248728597> ${utils.numberWithCommas(achievement.reward)}${achievement.progress_bar.progress>=achievement.progress_bar.needed?"~~":""}] • ${achievement.description}\n<:Reply:893527626201841744> ${achievement.progress_bar.bar} — ${utils.numberWithCommas(achievement.progress_bar.progress)} ${language.OF} ${utils.numberWithCommas(achievement.progress_bar.needed)} (${isNaN(Math.round(((achievement.progress_bar.progress*100)/achievement.progress_bar.needed)*100)/100)?0:Math.round(((achievement.progress_bar.progress*100)/achievement.progress_bar.needed)*100)/100==Infinity?0:Math.round(((achievement.progress_bar.progress*100)/achievement.progress_bar.needed)*100)/100>100?100:Math.round(((achievement.progress_bar.progress*100)/achievement.progress_bar.needed)*100)/100}%)`)
    });
    embed.setAuthor(`${language.ACHIEVEMENTS_OF} ${member.user.tag}`,member.user.displayAvatarURL());
    embed.addField(stack(34),`${language.PAGE} ${page} ${language.OF} ${maxPages}`);
    embed.setColor("#ff5757");
    message.reply({
      embeds:[embed]
    });
  },
  name:"achievements",
  aliases:["achie"],
  description:"To view every of your achievements",
  category:"infos",
  shortRules:"To view every of your achievements",
  exemples:`\`${process.env.BOT_PREFIX}achievements\` <- no args required`,
  cooldown:1e3
};