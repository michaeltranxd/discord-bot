const RunescapeAPIInstance = require("../util/runescape_api.js");

module.exports = {
  name: "osrs",
  description: "Utilize runescape api",
  aliases: ["rs"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage: "<item> <item-name>" + "<stat> <player-name>", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    if (args != 2) {
      if (args[0] == "price") {
        // Combine the args into a string for item to search
        let itemName = args.slice(1).join(" ").trim();
        RunescapeAPIInstance.printPriceOfItem(message, itemName);
      } else {
        return message.reply(
          `Error: I do not understand that argument! Please consult the usage by typing\n \`${prefix}help ${this.name}\` to get more info`
        );
      }
    }
  },
};
