const db=require("quick.db");
function translate(userId){
  const elo=db.get(`${userId}.elo`)||1e3;
  if(elo<=5e2)return{icon:"https://i.imgur.com/230UoLJ.png",class:"Iron I"};
  else if(elo<=1e3)return{icon:"https://i.imgur.com/GP8Ttjq.png",class:"Iron II"};
  else if(elo<=1.5e3)return{icon:"https://i.imgur.com/ijJb4iA.png",class:"Bronze I"};
  else if(elo<=2e3)return{icon:"https://i.imgur.com/MpORBDS.png",class:"Bronze II"};
  else if(elo<=3.5e3)return{icon:"https://i.imgur.com/N5wXSCa.png",class:"Gold"};
  else if(elo<=5e3)return{icon:"https://i.imgur.com/qrjQPne.png",class:"Master"};
};
module.exports=translate;