const Discord=require("discord.js");
const db=require("quick.db");
const createUser=require("../utils/createUser");
const utils=require("../utils/utils");
module.exports={
  event:"interactionCreate",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {Discord.Interaction} interaction 
   */
  func:async(client,interaction)=>{
    if(!interaction.isButton())return;
    if(interaction.customId.startsWith("res")){
      interaction.deferUpdate();
      createUser({client,userId:interaction.user.id});
      const gameName=interaction.customId.slice(3);
      interaction.message.author=interaction.user;
      if(client.commands.has(gameName)){
        utils.addCommand(gameName,true);
        client.commands.get(gameName).func({
          client,
          message:interaction.message,
          language:require(`../../miscellaneous/languages/${db.get(`${interaction.guild.id}-lang`)||"en"}.json`)
        });
      };
    };
  }
};