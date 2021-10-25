require("colors");
module.exports={
  infos:str=>console.log(`[Infos:${new Date().toString().split(" ",5).join(" ")}] ${str}`.blue),
  status:str=>console.log(`[Status:${new Date().toString().split(" ",5).join(" ")}] ${str}`.magenta),
  game:str=>console.log(`[Game:${new Date().toString().split(" ",5).join(" ")}] ${str}`.green),
  level:str=>console.log(`[Level:${new Date().toString().split(" ",5).join(" ")}] ${str}`.cyan),
  database:str=>console.log(`[Database:${new Date().toString().split(" ",5).join(" ")}] ${str}`.yellow),
  error:str=>console.log(`[Error:${new Date().toString().split(" ",5).join(" ")}] ${str}`.red),
  adminLog:str=>console.log(`[Admin Log:${new Date().toString().split(" ",5).join(" ")}] ${str}`.rainbow)
};