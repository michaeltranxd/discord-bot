module.exports = {
  name: "osrs",
  description: "Utilize runescape api",
  aliases: ["rs"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage: "<item> <item-name>" + "<stat> <player-name>", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    let BASE_URL = "http://services.runescape.com/m=itemdb_oldschool";
    console.log("how'd they know");
  },
};
