module.exports = {
  name: "ping",
  description: "Ping!",
  aliases: ["p"],
  args: false,
  guildOnly: true,
  cooldown: 5,
  execute(message, args) {
    message.channel.send("Pong.");
  },
};
