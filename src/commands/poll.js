const { MessageEmbed } = require("discord.js");
const { prefix } = require("../config.json");
const Discord = require("discord.js");

timeoutTime = 30000; // Update every half minute
let emoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

// polls will be organized by question as their n
const polls = new Discord.Collection();

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
    timeRemainingString = "Ended";
    console.log(remHour, remMin, remSec);
  }

  return timeRemainingString;
}

function timeoutFunction(pollObject, pollAuthor) {
  let { msgToEdit, embeddedMessage, deadline } = pollObject;

  // Update message with new time
  let timeRemainingString = getTimeRemString(deadline - Date.now());

  if (Date.now() >= deadline) {
    // Base case, stop recursive timeouts when we finished
    console.log("base case");
    endPoll(pollAuthor, msgToEdit.id);

    // Add handler for poll is done
  } else {
    embeddedMessage.setFooter(`Ends in ${timeRemainingString}`);
    msgToEdit.edit(embeddedMessage);
    let timeoutRef = msgToEdit.client.setTimeout(
      timeoutFunction,
      timeoutTime,
      pollObject,
      pollAuthor
    );

    // Update the poll under the author's name with the new timeout
    pollObject.timeout = timeoutRef;
  }
}

function splitTimes(regexResult) {
  let splittedResult = { numSplits: 0 };

  regexResult.forEach((elem) => {
    let minIndex = elem.indexOf("min");
    let hrIndex = elem.indexOf("hr");

    if (minIndex !== -1) {
      let numString = elem.slice(0, minIndex);

      if (numString.length > 2) return null;

      splittedResult.min = parseInt(numString);
      splittedResult.numSplits = splittedResult.numSplits + 1;
    }
    if (hrIndex !== -1) {
      let numString = elem.slice(0, hrIndex);

      if (numString.length > 2) return null;

      splittedResult.hr = parseInt(numString);
      splittedResult.numSplits = splittedResult.numSplits + 1;
    }
  });
  return splittedResult;
}

function getFieldsFromOptions(options) {
  let result = "";
  let emojiIndex = 0;

  options.forEach((elem) => {
    result += `${emoji[emojiIndex++]} - ${elem}\n`;
  });

  return result;
}

function inOrderReact(message, emojis) {
  try {
    emojis.forEach(async (anEmoji) => {
      await message.react(anEmoji);
    });
  } catch (error) {
    console.error("One of the emojis failed to react.", error);
  }
}

function startNewPoll(message, newArgs) {
  // Make sure newArgs[0] is greater than 4 characters
  let question = newArgs[0];
  if (question.length < 4) {
    return message.reply(
      `Error: Make sure the question is more than 4 characters long!`
    );
  } else if (question.length > 1024) {
    return message.reply(
      `Error: Make sure the question is less than 1024 characters long!`
    );
  }

  // Only support ##min or ##hr, any amount of digits that doesnt exceed 24 hours for now
  let result = newArgs[1].match(/[0-9]+ *((min)|(hr))/g);

  let time = 0;

  // Check if there is matched expression in result
  if (result) {
    let { hr, min, numSplits } = splitTimes(result);

    if (!numSplits) {
      return message.reply(
        `Error: Please keep the time to 2 digits max. ex: "1hr 5min". Please consult the usage by typing \`${prefix}help ${module.exports.name}\` to get more info`
      );
    } else if (numSplits > 2) {
      return message.reply(
        `Error: Make sure you format the time right! Please consult the usage by typing \`${prefix}help ${module.exports.name}\` to get more info`
      );
    }

    if (hr !== undefined) {
      time += hr * 60 * 60 * 1000;
    }
    if (min !== undefined) {
      time += min * 60 * 1000;
    }
  } else {
    return message.reply();
  }

  // parse newArgs[2] to get options, comma delimited
  let optionSplit = newArgs[2].split(/ *, */);
  if (optionSplit.length === 1 || optionSplit.length === 0) {
    return message.reply(
      `Error: Make sure you supply at least two options for people to vote! Please consult the usage by typing\n \`${prefix}help ${module.exports.name}\` to get more info`
    );
  } else if (optionSplit.length > emoji.length) {
    // check if we don't have enough emojis for that many options!
    return message.reply(
      `Error: Please enter at **most** ${emoji.length} options!`
    );
  }

  // Get the poll options formatted as a field value
  let fields = getFieldsFromOptions(optionSplit);

  // Update time remaining
  let timeRemainingString = getTimeRemString(time);

  const embeddedMessage = new MessageEmbed()
    .setColor("#0099ff")
    .addFields(
      {
        name: "Poll Question",
        value: newArgs[0],
      },
      {
        name: "Deadline",
        value: new Date(time + Date.now()).toLocaleTimeString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B", inline: true },
      { name: "Author", value: `<@${message.author.id}>`, inline: true },
      { name: "\u200B", value: "\u200B" },
      { name: "Poll Options", value: fields }
    )
    .setTimestamp()
    .setFooter(`Ends in ${timeRemainingString}`);

  message.channel.send(embeddedMessage).then((msg) => {
    // React emojis for the options
    inOrderReact(msg, emoji.slice(0, optionSplit.length));

    // Register a poll under the user if first time
    if (!polls.has(message.author.id)) {
      polls.set(message.author.id, new Discord.Collection());
    }

    let pollList = polls.get(message.author.id);
    let poll = {
      msgToEdit: msg,
      embeddedMessage: embeddedMessage,
      question: newArgs[0],
      deadline: time + Date.now(),
      emojiList: emoji.slice(0, optionSplit.length),
      options: optionSplit,
    };
    pollList.set(msg.id, poll);

    let timeoutRef = message.client.setTimeout(
      timeoutFunction,
      timeoutTime,
      poll,
      message.author.id
    );

    // Initalize timeout in pollList so we can keep track in future timeouts
    poll.timeout = timeoutRef;
  });
}

function handlePollList() {}

function endPoll(pollAuthor, msgId) {
  let pollList = polls.get(pollAuthor);
  let {
    msgToEdit,
    embeddedMessage,
    emojiList,
    timeout,
    options,
  } = pollList.get(msgId);
  // Clear timeout
  msgToEdit.client.clearTimeout(timeout);

  let result = "";

  // Find the winning "emoji", first get rid of the unnecessary emojis that are not part of our options
  let votes = msgToEdit.reactions.cache.filter((reaction) => {
    return emojiList.includes(reaction._emoji.name);
  });

  // Then grab all the reaction counts
  votes = votes.map((reaction) => {
    return reaction.count - 1;
  });

  // Get indices of the votes and sort descending
  indices = Array.from(Array(votes.length).keys());
  indices.sort((a, b) => {
    if (votes[a] > votes[b]) return -1;
    else if (votes[a] < votes[b]) return 1;
    else return 0;
  });

  let winnerVoteAmount = Math.max(...votes);

  if (winnerVoteAmount === 0) {
    // This means no one voted
    result = "No one voted in the poll!";
  } else {
    indices.forEach((voteIndex) => {
      if (votes[voteIndex] === winnerVoteAmount) {
        result += `${emojiList[voteIndex]} **- ${options[voteIndex]} (${votes[voteIndex]} vote)**\n`;
      } else
        result += `${emojiList[voteIndex]} - ${options[voteIndex]} (${votes[voteIndex]} vote)\n`;
    });
  }

  msgToEdit.reactions // Clear reactions
    .removeAll()
    .catch((error) => console.error("Failed to clear reactions: ", error));

  // Update the poll message
  embeddedMessage.addField("Results", result);
  embeddedMessage.setFooter("Ended");
  msgToEdit.edit(embeddedMessage);
  // Delete from poll list
  pollList.delete(msgId);
}

module.exports = {
  name: "poll",
  description: "Generates a poll for you",
  aliases: ["p"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage:
    "<question>; <time; ex: 1min/30min/2hr>; <answers seperated by commas>\n" +
    "<stop> <message-id(id of poll message)>\n" +
    "<list>", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    // Change args since we are parsing differently
    let newArgs = args.join(" ").split(/ *;+ *;*/);
    console.log(newArgs);

    // we use args since we are doing spaces, no semicolons
    if (args.length === 2) {
      // Check if args[0] is 'stop'
      if (args[0] === "stop") {
        // Check if args[1] is valid poll
        let pollList = polls.get(message.author.id);
        if (pollList.has(args[1])) {
          // Found the poll! Remove poll
          endPoll(message.author.id, args[1]);
        } else {
          return message.reply(
            `Error: That poll does not exist or you weren't the creator of it...`
          );
        }
      } else if (args[0] === "list") {
        // list
      } else {
      }
    }
    // Make sure 3 arguments were given
    else if (newArgs.length !== 3) {
      return message.reply(
        `Error: I was expecting three arguments... Please consult the usage by typing\n \`${prefix}help ${this.name}\` to get more info`
      );
    } else {
      startNewPoll(message, newArgs);
    }
  },
};
