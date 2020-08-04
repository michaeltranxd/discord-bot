module.exports = {
  name: "name of command",
  description: "insert description",
  aliases: ["p"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage: "how do i use this command?", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    console.log("how'd they know");
  },
};
