const WebSocket = require("ws");

class listen_dot_moe_socket {
  heartbeatInterval;
  ws;
  wsLink;

  constructor(radioLink) {
    if (radioLink === "https://listen.moe/stream") {
      this.wsLink = "wss://listen.moe/gateway_v2";
    } else {
      this.wsLink = "wss://listen.moe/kpop/gateway_v2";
    }
  }

  heartbeat(interval) {
    this.heartbeatInterval = setInterval(() => {
      this.ws.send(JSON.stringify({ op: 9 }));
    }, interval);
  }

  init() {
    this.ws = new WebSocket(this.wsLink);
    this.ws.onopen = () => {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    };

    this.ws.onmessage = (ws_message) => {
      if (!ws_message.data.length) return;
      let response;
      try {
        response = JSON.parse(ws_message.data);
      } catch (error) {
        return;
      }
      switch (response.op) {
        case 0:
          this.ws.send(JSON.stringify({ op: 9 }));
          this.heartbeat(response.d.heartbeat);
          break;
        case 1:
          if (
            response.t !== "TRACK_UPDATE" &&
            response.t !== "TRACK_UPDATE_REQUEST" &&
            response.t !== "QUEUE_UPDATE" &&
            response.t !== "NOTIFICATION"
          )
            break;
          console.log(response.d); // Do something with the data

          // Update bot to display song name + artist

          break;
        default:
          break;
      }
    };

    this.ws.onclose = (error) => {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      setTimeout(() => init(), 5000);
    };
  }
}

module.exports = {
  name: "listen",
  description: "Plays radio from listen.moe",
  aliases: ["radio"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage: "<kpop(k)/jpop(j)>", // Include if args is true
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
    } else {
      return message.reply("Please ");
    }

    // Check if user is in a voiceChannel
    if (userChannel) {
      // Check if bot is not already in the user's voice channel
      if (botChannel !== userChannel) {
        // Join the voice channel
        userChannel
          .join()
          .then((connection) => {
            connection.on("disconnect", (error) => {
              if (error) {
                console.log(error);
              }
              message.channel.send("Leaving voice chat!");
            });
            message.reply("I'm ready");

            connection.play(radioLink, {
              volume: 0.3,
            });

            // Establish websocket to grab song metadata (title, artist, so on)
            song_metadata_socket = new listen_dot_moe_socket(radioLink);
            song_metadata_socket.init();
          })
          .catch((error) => {
            console.log(error);
            return message.reply("I had trouble joining the voice channel...");
          });
      }
    }
    // User is not in voice channel
    else {
      message.reply("You must be in a voice channel");
    }
  },
};
