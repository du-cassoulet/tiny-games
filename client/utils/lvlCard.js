const Canvas=require("canvas");
const db=require("quick.db");
const getAverageColor=require("./getAverageColor");
const utils=require("./utils");
module.exports=member=>{
  return new Promise(async(resolve,reject)=>{
    try{
      Canvas.registerFont("./public/fonts/MuseoModerno.ttf",{family:"MuseoModerno"});
      const xp=db.get(`${member.id}.leveling.xp`)||0;
      const level=db.get(`${member.id}.leveling.level`)||1;
      const userBackground=db.get(`${member.id}.selected_background`)||0;
      const neededXp=500*level;
      function createImageByURL(imageURL){
        return new Promise(resolve=>{
          const imageBuffer=new Canvas.Image();
          imageBuffer.src=imageURL;
          imageBuffer.onload=function(){
            resolve(imageBuffer);
          };
        });
      };
      const canvas=Canvas.createCanvas(800,100);
      const ctx=canvas.getContext("2d");
      const backgrounds=require("../../public/json/backgrounds.json");
      const background=await createImageByURL(backgrounds[userBackground].image);
      roundImage(ctx,background,0,0,800,100,50);
      ctx.fillStyle="#0007";
      ctx.fillRect(0,0,800,100);
      ctx.strokeStyle="#fff";
      ctx.lineWidth=8;
      ctx.fillStyle=`${getAverageColor(background).hex}aa`;
      const xpProgWidth=Math.round(xp*(canvas.width-30-8)/neededXp);
      ctx.fillRect(15+4,15+4,xpProgWidth,70-8);
      roundRect(ctx,15,15,canvas.width-30,70,35,false,true);
      ctx.fillStyle="#fff";
      ctx.textAlign="center";
      ctx.font="40px MuseoModerno";
      ctx.fillText(`${utils.numberWithCommas(xp)}/${utils.numberWithCommas(neededXp)}`,canvas.width/2,65);
      function roundImage(ctx,image,x,y,width,height,radius){
        ctx.beginPath();
        ctx.moveTo(x+radius,y);
        ctx.lineTo(x+width-radius,y);
        ctx.quadraticCurveTo(x+width,y,x+width,y+radius);
        ctx.lineTo(x+width,y+height-radius);
        ctx.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);
        ctx.lineTo(x+radius,y+height);
        ctx.quadraticCurveTo(x,y+height,x,y+height-radius);
        ctx.lineTo(x,y+radius);
        ctx.quadraticCurveTo(x,y,x+radius,y);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(image,x,y,width,height);
      };
      function roundRect(ctx,x,y,width,height,radius,fill,stroke) {
        if(typeof stroke=="undefined")stroke=true;
        if(typeof radius=="undefined")radius=5;
        if(typeof radius=="number"){
          radius={tl:radius,tr:radius,br:radius,bl:radius};
        }else{
          var defaultRadius={tl:0,tr:0,br:0,bl:0};
          for(var side in defaultRadius) {
            radius[side]=radius[side]||defaultRadius[side];
          };
        };
        ctx.beginPath();
        ctx.moveTo(x+radius.tl,y);
        ctx.lineTo(x+width-radius.tr,y);
        ctx.quadraticCurveTo(x+width,y,x+width,y+radius.tr);
        ctx.lineTo(x+width,y+height-radius.br);
        ctx.quadraticCurveTo(x+width,y+height,x+width-radius.br,y+height);
        ctx.lineTo(x+radius.bl,y+height);
        ctx.quadraticCurveTo(x,y+height,x,y+height-radius.bl);
        ctx.lineTo(x,y+radius.tl);
        ctx.quadraticCurveTo(x,y,x+radius.tl,y);
        ctx.closePath();
        if(fill)ctx.fill();
        if(stroke)ctx.stroke();
      };
      const canvasBuffer=canvas.toBuffer();
      if(!db.has("images"))db.set("images",{});
      if(!db.has("images.weight"))db.set("images.weight",canvasBuffer.byteLength);
      db.add("images.weight",canvasBuffer.byteLength);
      if(!db.has("images.number"))db.set("images.number",1);
      db.add("images.number",1);
      resolve(canvasBuffer);
    }catch(error){
      reject(error);
    };
  });
};