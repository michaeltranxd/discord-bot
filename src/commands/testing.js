const { prefix } = require("../config.json");

module.exports = {
  name: "testing",
  description:
    "Utilize runescape api to look up GE prices or look up stats on players",
  aliases: ["rs"], // Include if aliases are desired
  cooldown: 5,
  execute(message, args) {
    console.log(message.guild.me.voice.channel.members);
  },
};
