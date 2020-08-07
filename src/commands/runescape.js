module.exports = {
  name: "osrs",
  description: "Utilize runescape api",
  aliases: ["rs"], // Include if aliases are desired
  args: true, // Include if command requires args
  usage: "<item> <item-name>" + "<stat> <player-name>", // Include if args is true
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    let potItems = RunescapeAPIInstance.searchItemByName("abyssal whip");

    console.log(potItems);
    console.log(item);
  },
};
