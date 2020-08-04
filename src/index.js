const config = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

client.once("ready", () => {
  console.log("Ready!");
});

client.login(config.token);

client.on("message", (message) => {
  // Ignore the message if it was sent by the bot
  if (message.author.bot) {
    return;
  }

  console.log(message.content);
  if (message.content === "!ping") {
    // send back "Pong." to the channel the message was sent in
    message.channel.send("Pong.");
  }
});
