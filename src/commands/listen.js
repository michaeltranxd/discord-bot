const { vcTimeout } = require("../config.json");
const { radioKorean, radioJapanese } = require("../util/api_links.json");
const ytdl = require("ytdl-core");
const Discord = require("discord.js");

let intervals = new Discord.Collection();

function onDisconnect(message, voiceConnection) {
  message.client.clearInterval(intervals.get(voiceConnection.voice.id));
  intervals.delete(voiceConnection.voice.id);
  message.client.listen_dot_moe_socket.closeSocket();

  message.client.user
    .setPresence({
      activity: { name: "", type: "LISTENING" },
      status: "online",
    })
    .catch(console.error);
}

function joinAndPlay(message, radioLink) {
  // Join the voice channel
  let voiceChannel = message.member.voice.channel;

  voiceChannel
    .join()
    .then((connection) => {
      play(message, connection, radioLink);
      connection.on("debug", console.log);
      connection.on("disconnect", (error) => {
        if (error) {
          console.log(error);
        } else {
          message.channel.send("Leaving voice chat!");
          onDisconnect(message, connection);
        }
      });
    })
    .catch((error) => {
      console.log(error);
      return message.reply("I had trouble joining the voice channel...");
    });
}

function play(message, voiceConnection, radioLink) {
  let broadcastJpop = message.client.voice.broadcasts[0];
  let broadcastKpop = message.client.voice.broadcasts[1];

  if (intervals.get(voiceConnection.voice.id)) {
    // Close old websocket + interval
    onDisconnect(message, voiceConnection);
  }

  // Check if JPOP/KPOP streams
  if (radioLink === broadcastJpop || radioLink === broadcastKpop) {
    let link =
      radioLink === message.client.voice.broadcasts[0]
        ? radioJapanese
        : radioKorean;

    // set radiolink and start websocket previously created in index.js,
    //  to grab song metadata (title, artist, so on)
    message.client.listen_dot_moe_socket.setRadioLink(link);
    message.client.listen_dot_moe_socket.init();

    if (radioLink.player.dispatcher === null) {
      // For some reason the dispatcher is null
      console.log("Broadcast dispatcher 0 was null! Replay the stream...");
      radioLink.play(link);
    }
  }

  voiceConnection.play(radioLink, {
    volume: 0.7,
    highWaterMark: 50,
  });

  let interval = message.client.setInterval(() => {
    console.log("checking if users are in the chat");

    let voiceChannel = message.guild.me.voice.channel;
    if (voiceChannel.members.array().length === 1) {
      // We are the only one in the channel... so lets disconnect
      voiceConnection.disconnect();
    }
  }, vcTimeout * 60000);

  intervals.set(voiceConnection.voice.id, interval);
}

async function validYTLink(client, link) {
  try {
    let ytInfo = await ytdl.getBasicInfo(link);
    let videoDetails = ytInfo.videoDetails;

    let videoInfo = `${videoDetails.title}`;
    client.user
      .setPresence({
        activity: { name: videoInfo, type: "LISTENING" },
        status: "online",
      })
      .catch(console.error);
    // No errors!
    return true;
  } catch (error) {
    // YT Link has an issue
    return false;
  }
}

async function getYTLink(link) {
  try {
    let ytLink = await ytdl(link, { type: "opus" });
    return ytLink;
  } catch (error) {
    console.log(error);
    return "";
  }
}

module.exports = {
  name: "listen",
  description: "Plays radio from listen.moe or youtube link",
  aliases: ["radio"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage: "<kpop(k)/jpop(j)/stop(s)/YOUTUBE LINK>", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 3,
  async execute(message, args) {
    const userChannel = message.member.voice.channel;
    const botChannel = message.guild.me.voice.channel;
    let radioLink;

    // Check if command is valid
    if (args[0] === "jpop" || args[0] === "j") {
      radioLink = message.client.voice.broadcasts[0];
    } else if (args[0] === "kpop" || args[0] === "k") {
      radioLink = message.client.voice.broadcasts[1];
    } else if (args[0] === "stop" || args[0] === "s") {
      // Check if bot is in a voiceChannel
      if (botChannel) {
        // Check if bot has connection in voicechannel
        if (message.guild.me.voice.connection) {
          // Bot is in channel with valid connection
          message.guild.me.voice.connection.disconnect();
          return;
        }
      }
      // Bot is not in voice channel
      else {
        message.reply("I am not playing anything...");
      }
      return;
    } else if (args[0].includes("youtu")) {
      // Let's assume it is a YT link
      if (await validYTLink(message.client, args[0])) {
        radioLink = await getYTLink(args[0]);
        if (radioLink === "") {
          return message.reply(
            "Something went wrong with the ytdl... Please contact the dev"
          );
        }
      } else {
        // YT Link has an issue
        return message.reply(
          "That Youtube link could not be loaded by me... Please double check that link"
        );
      }
    } else {
      return message.reply(
        "That is not a YT link or one of the options. Please double check that link"
      );
    }

    // Check if user is in a voiceChannel, command is valid
    if (userChannel) {
      // Check if bot is not already in the user's voice channel
      if (botChannel !== userChannel) {
        joinAndPlay(message, radioLink);
      } else if (message.guild.me.voice.connection) {
        console.log("valid");
        // Bot is in same channel with valid connection
        play(message, message.guild.me.voice.connection, radioLink);
        // return message.reply("I am already playing music!").then((msg) => {
        //   msg.delete({ timeout: 5 * 1000 });
        // });
      } else {
        // Bot is in channel with invalid connection, we should reconnect
        //console.log("connection does not exists, try reconnecting");
        joinAndPlay(message, radioLink);
      }
    }
    // User is not in voice channel
    else {
      return message.reply("You must be in a voice channel");
    }
  },
};
