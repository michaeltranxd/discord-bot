# discord-bot

Discord bot built from scratch using discord.js and the official [tutorial](https://discordjs.guide/)

# Features

- Radio playing streams on [listen.moe](https://listen.moe/), both korean and japanese
- Basic polling functionality, creating + stopping polls
- Runescape GE item price search
- Runescape player hiscore search

# Requirements

- Node.js 12.0 or higher
- Discord account

# Setup

1. Fill out config_template.json in /templates and rename to config.json with setup information (token, prefix, etc)
2. Run npm install to install dependencies
3. Follow setup for bot application on discord.js [guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
4. Rename templates/config_template.json to config.json and place inside src folder (same level as index.js)
5. Fill out config.json with your bot token and important configurations
6. Run npm . in you preferred terminal that currently has the /src/ folder as it's path and the requirements

# Contributions

Thank you to the open-source repos and APIs that have helped me work on this project:

- [Discord.js](https://discord.js.org/) Node.js module that helped with interacting with the Discord API
- [osrsbox](https://www.osrsbox.com/) JSON API for OSRS items
- [Redditor](https://www.reddit.com/r/2007scape/comments/3g06rq/guide_using_the_old_school_ge_page_api/) Useful guide on using the osrs GE api
- [OSRS](https://oldschool.runescape.com/) Developed the OSRS game and GE api
