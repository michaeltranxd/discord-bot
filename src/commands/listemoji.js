module.exports = {
  name: "listemoji",
  description: "List all custom emojis on guild",
  guildOnly: true, // Include if exclusive to server
  cooldown: 5,
  execute(message, args) {
    let content = "\n";
    message.guild.emojis.cache.each((emoji) => {
      content += `\\${emoji},\n`;
    });

    if (content === "\n") return message.reply("No custom emojis!");

    message.reply(content);
  },
};
