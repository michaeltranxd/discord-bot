const WebSocket = require("ws");

const { wsKorean, wsJapanese, radioJapanese } = require("./api_links.json");

class Listen_Dot_Moe_Socket {
  client;
  heartbeatInterval;
  ws;
  wsLink;

  constructor(client) {
    this.client = client;
  }

  heartbeat(interval) {
    this.heartbeatInterval = this.client.setInterval(() => {
      this.ws.send(JSON.stringify({ op: 9 }));
    }, interval);
  }

  setRadioLink(radioLink) {
    if (radioLink === radioJapanese) {
      this.wsLink = wsJapanese;
    } else {
      this.wsLink = wsKorean;
    }
  }

  init() {
    this.ws = new WebSocket(this.wsLink);
    this.ws.onopen = () => {
      this.client.clearInterval(this.heartbeatInterval);
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

          //console.log(response.d); // Do something with the data
          const data = response.d;

          // Update bot to display song name + artist
          let songObject = data.song;
          let title = songObject.title;
          let artistObject = songObject.artists[0]; // Since its an object within an array
          let status = `${title} by `;

          if (artistObject.nameRomaji)
            status += `${artistObject.nameRomaji}(${artistObject.name})`;
          else status += `${artistObject.name}`;

          this.client.user
            .setPresence({
              activity: { name: status, type: "LISTENING" },
              status: "online",
            })
            .catch(console.error);

          break;
        default:
          break;
      }
    };

    this.ws.onclose = (error) => {
      this.client.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      //setTimeout(() => this.init(), 5000);
    };
  }

  closeSocket() {
    if (this.heartbeatInterval) {
      this.client.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      this.ws.onclose = function () {}; // disable onclose handler first
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = Listen_Dot_Moe_Socket;
