const RunescapeAPIInstance = require("../util/runescape_api.js");

module.exports = {
  name: "osrs",
  description:
    "Utilize runescape api to look up GE prices or look up stats on players",
  aliases: ["rs"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage:
    "<item> <item-name>\n" +
    "<lookup> <player-name>\n" +
    "<lookup-simple> <player-name>",
  cooldown: 5,
  execute(message, args) {
    if (args != 2) {
      // Combine the args into a string for searching
      let arg = args.slice(1).join(" ").trim();
      if (args[0] == "price") {
        RunescapeAPIInstance.printPriceOfItem(message, arg);
      } else if (args[0] == "lookup") {
        RunescapeAPIInstance.printStats(message, arg);
      } else if (args[0] == "lookup-simple") {
        RunescapeAPIInstance.printStatsSimple(message, arg);
      } else {
        return message.reply(
          `Error: I do not understand that argument! Please consult the usage by typing\n \`${prefix}help ${this.name}\` to get more info`
        );
      }
    }
  },
};
