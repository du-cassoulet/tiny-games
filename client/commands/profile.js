const Discord=require("discord.js");
const Canvas=require("canvas");
const db=require("quick.db");
const utils=require("../utils/utils");
const translateElo=require("../utils/eloTranslator");
const getAverageColor=require("../utils/getAverageColor");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[],
   *  language:Language
   * }} param0 
   */
  func:async({message,args})=>{
    const member=message.mentions.members.first()||message.guild.members.cache.get(args[0])||message.member;
    Canvas.registerFont("./public/fonts/MuseoModerno.ttf",{family:"MuseoModerno"});
    const xp=db.get(`${member.user.id}.leveling.xp`)||0;
    const level=db.get(`${member.user.id}.leveling.level`)||1;
    const elo=db.get(`${member.user.id}.tp`)||1e3;
    const tokens=db.get(`${member.user.id}.tokens`)||0;
    const userBackground=db.get(`${member.id}.selected_background`)||0;
    const everyUsers=db.fetchAll().filter(e=>e.data.tokens).sort((a,b)=>(b.data.tp||1000)-(a.data.tp||1000));
    const petNumber=db.get(`${member.id}.pets`).length;
    const neededXp=500*level;
    var defeats=0;
    var victories=0;
    Object.values(db.get(`${member.id}.games`)).forEach(results=>{
      defeats+=results[0]||0;
      victories+=results[1]||0;
    });
    function createImageByURL(imageURL){
      return new Promise(resolve=>{
        const imageBuffer=new Canvas.Image();
        imageBuffer.src=imageURL;
        imageBuffer.onload=function(){
          resolve(imageBuffer);
        };
      });
    };
    const canvas=Canvas.createCanvas(800,800);
    const ctx=canvas.getContext("2d");
    const backgrounds=require("../../public/json/backgrounds.json");
    const background=await createImageByURL(backgrounds[userBackground].image);
    const avatar=await createImageByURL(member.user.displayAvatarURL({format:"png"}));
    const sand=await createImageByURL("https://i.imgur.com/Hw3CmFb.png");
    const heart=await createImageByURL("https://i.imgur.com/rmk8fGn.png");
    const star=await createImageByURL("https://i.imgur.com/tQKIVHY.png");
    const controller=await createImageByURL("https://i.imgur.com/ViHkYzY.png");
    const WLR=await createImageByURL("https://i.imgur.com/1fpEu5u.png");
    const pets=await createImageByURL("https://i.imgur.com/SP5sCWh.png");
    const classImg=await createImageByURL(translateElo(elo).icon);
    const placement=await createImageByURL("https://i.imgur.com/WnHtS7u.png");
    roundImage(ctx,background,0,0,800,800,50);
    ctx.fillStyle="#0007";
    ctx.fillRect(0,0,800,800);
    ctx.strokeStyle="#fff";
    ctx.lineWidth=8;
    ctx.fillStyle="#fff";
    ctx.font="60px MuseoModerno";
    ctx.fillText(`Lv.${utils.numberWithCommas(level)}`,60,canvas.height-168);
    ctx.textAlign="right";
    const minSpacing=ctx.measureText(`${utils.numberWithCommas(elo)}`).width;
    ctx.font="60px sans-serif";
    ctx.fillText("\u058E",canvas.width-60-minSpacing-15,canvas.height-173);
    ctx.font="60px MuseoModerno";
    ctx.fillText(`${utils.numberWithCommas(elo)}`,canvas.width-60,canvas.height-168);
    ctx.fillStyle=`${getAverageColor(background).hex}aa`;
    const xpProgWidth=Math.round(xp*(canvas.width-100-8)/neededXp);
    ctx.fillRect(50+4,canvas.height-150,xpProgWidth,100);
    roundRect(ctx,50,canvas.height-150,canvas.width-100,100,20,false,true);
    ctx.fillStyle="#fff";
    ctx.textAlign="center";
    ctx.font="60px MuseoModerno";
    ctx.fillText(`${utils.numberWithCommas(xp)}/${utils.numberWithCommas(neededXp)}`,canvas.width/2,canvas.height-75);
    ctx.drawImage(sand,300,50,50,50);
    ctx.drawImage(heart,300,125,50,50);
    ctx.drawImage(star,300,200,50,50);
    ctx.drawImage(controller,575,50,50,50);
    ctx.drawImage(WLR,575,125,50,50);
    ctx.drawImage(pets,575,200,50,50);
    ctx.textAlign="left";
    ctx.font="40px MuseoModerno";
    ctx.fillText(utils.numberWithCommas(tokens.sand),366,90);
    ctx.fillText(utils.numberWithCommas(tokens.heart),366,165);
    ctx.fillText(utils.numberWithCommas(tokens.star),366,240);
    var ratio=victories/defeats;
    if(isNaN(ratio)||ratio==Infinity)ratio="- -";
    if(ratio!="- -")ratio=Math.round(ratio*100)/100;
    ctx.fillText(utils.numberWithCommas(victories+defeats),641,90);
    ctx.fillText(ratio,641,165);
    ctx.fillText(petNumber.toString(),641,240);
    const gradient=ctx.createLinearGradient(0,0,700,0);
    gradient.addColorStop(0,"#fff0");
    gradient.addColorStop(1,"#fff8");
    ctx.fillStyle=gradient;
    roundRect(ctx,50,325,700,200,20,true,false);
    ctx.drawImage(classImg,550,325,200,200);
    ctx.fillStyle="#ffff";
    ctx.font="50px MuseoModerno";
    ctx.fillText(translateElo(elo).class,75,375);
    ctx.drawImage(placement,75,450,50,50);
    ctx.font="40px MuseoModerno";
    ctx.fillText(`#${utils.numberWithCommas(everyUsers.findIndex(u=>u.ID==member.id)+1)} / ${utils.numberWithCommas(everyUsers.length)}`,140,495);
    roundImage(ctx,avatar,50,50,200,200,50);
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
    message.channel.send({
      files:[
        new Discord.MessageAttachment(canvasBuffer,"tokens.jpg")
      ]
    });
  },
  name:"profile",
  aliases:["tokens","money","pro"],
  description:"To see your profile card",
  category:"infos",
  shortRules:"To see your profile card",
  exemples:`\`${process.env.BOT_PREFIX}profile\` <- no mentions
\`${process.env.BOT_PREFIX}profile @DU CASSOULET\` <- member mention
\`${process.env.BOT_PREFIX}profile 532631412717649941\` <- member id`,
  cooldown:1.5e4
};