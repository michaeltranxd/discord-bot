const { vcTimeout } = require("../config.json");
let interval;

function joinAndPlay(message, voiceChannel, radioLink) {
  // Join the voice channel
  voiceChannel
    .join()
    .then((connection) => {
      connection.on("disconnect", (error) => {
        if (error) {
          console.log(error);
        }
        message.channel.send("Leaving voice chat!");
      });

      connection.play(radioLink, {
        volume: 0.7,
      });

      message.client.clearInterval(interval);
      interval = message.client.setInterval(() => {
        if (voiceChannel.members.array().length === 1) {
          // We are the only one in the channel... so lets disconnect
          message.client.listen_dot_moe_socket.closeSocket();
          connection.disconnect();
          voiceChannel.disconnect;
          message.client.clearInterval(interval);
        }
      }, vcTimeout * 60000);

      // Close old websocket before initializing a new one
      message.client.listen_dot_moe_socket.closeSocket();

      // set radiolink and start websocket previously created in index.js,
      //  to grab song metadata (title, artist, so on)
      message.client.listen_dot_moe_socket.setRadioLink(radioLink);
      message.client.listen_dot_moe_socket.init();
    })
    .catch((error) => {
      console.log(error);
      return message.reply("I had trouble joining the voice channel...");
    });
}

module.exports = {
  name: "listen",
  description: "Plays radio from listen.moe",
  aliases: ["radio"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage: "<kpop(k)/jpop(j)/stop(s)>", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    const userChannel = message.member.voice.channel;
    const botChannel = message.guild.me.voice.channel;
    let radioLink = "";

    // Check if command is valid
    if (args[0] === "jpop" || args[0] === "j") {
      radioLink = "https://listen.moe/stream";
    } else if (args[0] === "kpop" || args[0] === "k") {
      radioLink = "https://listen.moe/kpop/stream";
    } else if (args[0] === "stop" || args[0] === "s") {
      // Check if bot is in a voiceChannel
      if (botChannel) {
        // Check if bot has connection in voicechannel
        if (message.guild.me.voice.connetion) {
          // Bot is in channel with valid connection
          message.client.listen_dot_moe_socket.closeSocket();
          message.guild.me.voice.connection.disconnect();
        }
      }
      // Bot is not in voice channel
      else {
        message.reply("I am not playing anything...");
      }
      return;
    } else {
      return message.reply(`Please enter refer to the usage: ${this.usage}`);
    }

    // Check if user is in a voiceChannel, command is valid
    if (userChannel) {
      // Check if bot is not already in the user's voice channel
      if (botChannel !== userChannel) {
        joinAndPlay(message, userChannel, radioLink);
      } else if (message.guild.me.voice.connetion) {
        // Bot is in channel with valid connection
        joinAndPlay(message, userChannel, radioLink);
        return message.reply("I am already playing music!").then((msg) => {
          msg.delete({ timeout: 5 * 1000 });
        });
      } else {
        // Bot is in channel with invalid connection, we should reconnect
        //console.log("connection does not exists, try reconnecting");
        joinAndPlay(message, userChannel, radioLink);
      }
    }
    // User is not in voice channel
    else {
      message.reply("You must be in a voice channel");
    }
  },
};
