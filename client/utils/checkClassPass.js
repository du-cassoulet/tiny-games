const db=require("quick.db");
const translateElo=require("./eloTranslator");
function checkClassPass(newElo,userId){
  if(!db.get(`${userId}.dm`))return;
  const oldElo=db.get(`${userId}.elo`);
  if(oldElo==newElo)return;
  if(translateElo(oldElo).class!=translateElo(newElo).class)return{newElo,oldElo};
};
module.exports=checkClassPass;