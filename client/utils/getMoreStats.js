const AsciiTable=require("ascii-table");
const db=require("quick.db");
const utils=require("./utils");
module.exports=(member,language)=>{
  const table=new AsciiTable();
  const memberStats=db.get(`${member.id}.games`);
  if(!memberStats)return message.reply({content:language.NO_STATS});
  var defeats=0;
  var victories=0;
  table.removeBorder();
  table.setHeading(
    language.GAME,
    language.GAMES_PLAYED,
    language.VICTORIES,
    language.DEFEATS,
    language.RATIO
  );
  Object.entries(memberStats).forEach(result=>{
    const[gameName,results]=result;
    defeats+=(results[0]||0);
    victories+=(results[1]||0);
    var ratio=results[1]/results[0];
    if(ratio==Infinity||isNaN(ratio))ratio="- -";
    if(ratio!="- -")ratio=utils.numberWithCommas(Math.round(ratio*100)/100);
    if(results[0]!=0||results[1]!=0)table.addRow(gameName,utils.numberWithCommas(results[1]+results[0]),utils.numberWithCommas(results[1]),utils.numberWithCommas(results[0]),ratio);
  });
  table.addRow("","","","","");
  var ratio=victories/defeats;
  if(ratio==Infinity||isNaN(ratio))ratio="- -";
  if(ratio!="- -")ratio=utils.numberWithCommas(Math.round(ratio*100)/100);
  table.addRow(language.TOTAL,utils.numberWithCommas(defeats+victories),utils.numberWithCommas(victories),utils.numberWithCommas(defeats),ratio);
  return table;
};