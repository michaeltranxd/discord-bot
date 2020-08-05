const { MessageEmbed } = require("discord.js");

timeoutTime = 60000; // Update every minute

function getTimeRemString(overallTime) {
  let remSec = Math.floor((overallTime / 1000) % 60);
  let remMin = Math.floor((overallTime / 1000 / 60) % 60);
  let remHour = Math.floor((overallTime / 1000 / 60 / 60) % 24);

  let timeRemainingString;

  if (remHour > 0) {
    // Display Hours: Minutes
    timeRemainingString = `${remHour} Hours ${remMin} Minutes`;
  } else if (remMin > 0) {
    // Display Minutes
    timeRemainingString = `${remMin} Minutes`;
  } else if (remSec > 0) {
    // Display 'less than 1 minute left'
    timeRemainingString = `less than 1 minute`;
  } else {
    timeRemainingString = "done";
    console.log(remHour, remMin, remSec);
  }

  return timeRemainingString;
}

function timeoutFunction(embeddedMessage, msg, time) {
  // Update message with new time
  let timeRemainingString = getTimeRemString(time - Date.now());

  if (Date.now() >= time) {
    // Base case, stop recursive timeouts when we finished
    console.log("base case");
    embeddedMessage.setFooter(`Finished!`);
    msg.edit(embeddedMessage);
  } else {
    embeddedMessage.setFooter(`Ends in ${timeRemainingString}`);
    msg.edit(embeddedMessage);
    msg.client.setTimeout(
      timeoutFunction,
      timeoutTime,
      embeddedMessage,
      msg,
      time
    );
  }
}

module.exports = {
  name: "poll",
  description: "Generates a poll for you",
  aliases: ["p"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage:
    "<question>; <time; ex: 1min/30min/2hr>; <answers seperated by commas>", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    // Ignore args since we are parsing differently
    let args = message.content.slice(prefix.length).trim();

    // Make sure args[0] is greater than 4 characters

    // parse args[1] time and put into "time" variable

    // parse args[2] to get options, comma delimited

    // Update everything when done

    let time = Date.now() + 300 * 1000;

    let overallTime = time - Date.now();
    let timeRemainingString = getTimeRemString(overallTime);

    const embeddedMessage = new MessageEmbed()
      .setColor("#0099ff")
      .addFields(
        {
          name: "Poll Question",
          value: args[0],
        },
        { name: "Anonymous", value: "False", inline: true },
        { name: "Deadline", value: "xd", inline: true },
        { name: "Author", value: `<@${message.author.id}>`, inline: true },
        { name: "\u200B", value: "\u200B" }
      )
      .setTimestamp()
      .setFooter(`Ends in ${timeRemainingString}`);

    message.channel.send(embeddedMessage).then((msg) => {
      message.client.setTimeout(
        timeoutFunction,
        timeoutTime,
        embeddedMessage,
        msg,
        time
      );
    });
  },
};
