const Canvas=require("canvas");
module.exports=imgEl=>{
  var blockSize=5,defaultRGB={r:0,g:0,b:0},canvas=Canvas.createCanvas(800,800),context=canvas.getContext("2d"),data,width,height,i=-4,length,rgb={r:0,g:0,b:0},count=0;
  if(!context)return defaultRGB;
  height=canvas.height=imgEl.naturalHeight||imgEl.offsetHeight||imgEl.height;
  width=canvas.width=imgEl.naturalWidth||imgEl.offsetWidth||imgEl.width;
  context.drawImage(imgEl,0,0);
  try{
    data=context.getImageData(0,0,width,height);
  }catch(e){
    return defaultRGB;
  };
  length=data.data.length;
  while((i+=blockSize*4)<length){
    ++count;
    rgb.r+=data.data[i];
    rgb.g+=data.data[i+1];
    rgb.b+=data.data[i+2];
  };
  rgb.r=~~(rgb.r/count);
  rgb.g=~~(rgb.g/count);
  rgb.b=~~(rgb.b/count);
  function rgbToHex({r,g,b}){
    return"#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  };
  return{rgb,hex:rgbToHex(rgb)};
};