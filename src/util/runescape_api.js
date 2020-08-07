const fs = require("fs");
const fetch = require("node-fetch");
const Discord = require("discord.js");

const {
  osrs_ge_api_base,
  osrs_ge_api_price,
  osrs_hisore_api_base,
} = require("./api_links.json");

// Function helper for calling await on every callback
// and keeping track of the result returned from callback
// Callbacks should be async
// async function asyncForEachGetResult(array, callback) {
//   let result = "";

//   for (let index = 0; index < array.length; index++) {
//     // We call the callback for each entry
//     result += (await callback(array[index], index, array)) + "\n";
//   }

//   return result;
// }

/* hiscore is split into skills first then activites, hiscore[0] would refer to Overall
     STATS: Overall, Attack, Defence, Strength, Hitpoints, Ranged, Prayer, Magic, Cooking, Woodcutting, Fletching, Fishing, Firemaking, 
            Crafting, Smithing, Mining, Herblore, Agility, Thieving, Slayer, Farming, Runecrafting, Hunter, Construction. 
     ACTIVITES: League Points,Bounty Hunter - Hunter,Bounty Hunter - Rogue,Clue Scrolls (all),Clue Scrolls (beginner),Clue Scrolls (easy),
                Clue Scrolls (medium),Clue Scrolls (hard),Clue Scrolls (elite),Clue Scrolls (master),LMS - Rank,Abyssal Sire,Alchemical Hydra,
                Barrows Chests,Bryophyta,Callisto,Cerberus,Chambers of Xeric,Chambers of Xeric: Challenge Mode,Chaos Elemental,Chaos Fanatic,
                Commander Zilyana,Corporeal Beast,Crazy Archaeologist,Dagannoth Prime,Dagannoth Rex,Dagannoth Supreme,Deranged Archaeologist,
                General Graardor,Giant Mole,Grotesque Guardians,Hespori,Kalphite Queen,King Black Dragon,Kraken,Kree'Arra,K'ril Tsutsaroth,Mimic,
                Nightmare,Obor,Sarachnis,Scorpia,Skotizo,The Gauntlet,The Corrupted Gauntlet,Theatre of Blood,Thermonuclear Smoke Devil,
                TzKal-Zuk,TzTok-Jad,Venenatis,Vet'ion,Vorkath,Wintertodt,Zalcano,Zulrah
     Within each hiscore element, it is organized by {rank, level, experience}
  */
_STATS = [
  "Overall",
  "Attack",
  "Defence",
  "Strength",
  "Hitpoints",
  "Ranged",
  "Prayer",
  "Magic",
  "Cooking",
  "Woodcutting",
  "Fletching",
  "Fishing",
  "Firemaking",
  "Crafting",
  "Smithing",
  "Mining",
  "Herblore",
  "Agility",
  "Thieving",
  "Slayer",
  "Farming",
  "Runecrafting",
  "Hunter",
  "Construction",
];

_ACTIVITES = [
  "League Points",
  "Bounty Hunter - Hunter",
  "Bounty Hunter - Rogue",
  "Clue Scrolls (all)",
  "Clue Scrolls (beginner)",
  "Clue Scrolls (easy)",
  "Clue Scrolls (medium)",
  "Clue Scrolls (hard)",
  "Clue Scrolls (elite)",
  "Clue Scrolls (master)",
  "LMS - Rank",
  "Abyssal Sire",
  "Alchemical Hydra",
  "Barrows Chests",
  "Bryophyta",
  "Callisto",
  "Cerberus",
  "Chambers of Xeric",
  "Chambers of Xeric: Challenge Mode",
  "Chaos Elemental",
  "Chaos Fanatic",
  "Commander Zilyana",
  "Corporeal Beast",
  "Crazy Archaeologist",
  "Dagannoth Prime",
  "Dagannoth Rex",
  "Dagannoth Supreme",
  "Deranged Archaeologist",
  "General Graardor",
  "Giant Mole",
  "Grotesque Guardians",
  "Hespori",
  "Kalphite Queen",
  "King Black Dragon",
  "Kraken",
  "Kree'Arra",
  "K'ril Tsutsaroth",
  "Mimic",
  "Nightmare",
  "Obor",
  "Sarachnis",
  "Scorpia",
  "Skotizo",
  "The Gauntlet",
  "The Corrupted Gauntlet",
  "Theatre of Blood",
  "Thermonuclear Smoke Devil",
  "TzKal-Zuk",
  "TzTok-Jad",
  "Venenatis",
  "Vet'ion",
  "Vorkath",
  "Wintertodt",
  "Zalcano",
  "Zulrah",
];

class RunescapePlayer {
  _name;
  _hiscore;

  constructor(hiscore, name) {
    this._hiscore = hiscore;
    this._name = name;
  }

  getAllStatsString() {
    // Format "Attack" --  Rank: ## Level: ## Exp: ##
    let result = `${this._name} has the following stats:\n`;
    let populated_stats = this._hiscore.slice(0, _STATS.length);

    populated_stats.forEach((stat, index) => {
      // stat will be format 'rank,level,exp'
      let statRLE = stat.split(",");
      result += `${_STATS[index]}: -- Rank: ${statRLE[0]} Level: ${statRLE[1]} Experience: ${statRLE[2]}\n`;
    });

    return result;
  }

  getAllStatsLevelString() {
    // Format "Attack" -- Level: ##
    let result = `${this._name} has the following stats:\n`;
    let populated_stats = this._hiscore.slice(0, _STATS.length);

    populated_stats.forEach((stat, index) => {
      // stat will be format 'rank,level,exp'
      let statRLE = stat.split(",");
      result += `${_STATS[index]}: Level: ${statRLE[1]}\n`;
    });

    return result;
  }
}

class RunescapeAPI {
  _instance;
  _itemListByID;
  _itemListByName; // This will be only GE items
  _itemAbbrv;

  constructor() {
    if (!RunescapeAPI._instance) {
      this._itemListByID = new Discord.Collection();
      this._itemListByName = new Discord.Collection();
      this._instance = this;
      try {
        const jsonString = fs.readFileSync(
          __dirname + "/runescape_item_abbrv_db.json"
        );
        const item_data = JSON.parse(jsonString);
        this._itemAbbrv = item_data;
        console.log(item_data);
      } catch (error) {
        console.error(error);
      }
    }
    return this._instance;
  }

  init(jsonData) {
    console.log("hello");

    let keys = Object.keys(jsonData);

    keys.forEach((key) => {
      if (!jsonData[key].duplicate && jsonData[key].tradeable_on_ge) {
        this._itemListByID.set(key, jsonData[key]);
        this._itemListByName.set(
          jsonData[key].name.toLowerCase(),
          jsonData[key]
        );
      }
    });
  }

  getItemListByID() {
    return this._itemListByID;
  }

  getItemByID(id) {
    return this._itemListByID.get(id);
  }

  getItemByName(name) {
    return this._itemListByName.get(name);
  }

  searchItemByName(itemName) {
    let names = this._itemListByName.keyArray();

    console.log(names);
    let potentialItems = [];

    // Loop through each name and check if the search has matches
    names.forEach((name) => {
      if (name.indexOf(itemName) > -1) {
        // Found a potential match...
        potentialItems.push(name);
        console.log(itemName);
      }
    });

    return potentialItems;
  }

  async getPriceOfItem(item) {
    let api_link = osrs_ge_api_base + osrs_ge_api_price + item.id;
    // Fetch json for price
    try {
      const apiResponse = await fetch(api_link);

      const apiJson = await apiResponse.json();
      return apiJson.item.current.price;
    } catch (error) {
      console.log("Fetching API went wrong", error);
    }
  }

  // Future improvements:
  // Save prices + timestamp in a Discord.Collection() with keys of item.name or item.id as cache
  // Then save into a file when bot is closed. This way the bot can have a cache of the prices
  // and can open the file to check if it needs to fetch json (fetch json seems really slow so we need a cache)

  async printPriceOfItem(message, itemName) {
    let potItemNames = this.searchItemByName(itemName.toLowerCase());

    if (potItemNames.length == 0) {
      return message.reply(
        `Error: I could not find any item that matches ${itemName}`
      );
    }

    // Sort out items alphbetical
    potItemNames = potItemNames.sort();

    // Grab the first item
    let result = await this.getPriceString(potItemNames[0]);

    message.reply(result);
  }

  async getPriceString(itemName) {
    let item = this.getItemByName(itemName);
    let itemPrice = await this.getPriceOfItem(item);
    return `${item.name}: GE average \`${itemPrice}\` HA value \`${item.highalch}\``;
  }

  // Future feature:
  // Add abbreviations for items and be able to store that in file
  // addAbbrv(item, abbrv) {
  //   if (!this._itemAbbrv[0]) {
  //     this._itemAbbrv[0] = [];
  //   }
  //   if (!this._itemAbbrv[0].includes("hello")) {
  //     this._itemAbbrv[0].push("hello");
  //   }
  // }

  // Future improvement
  // Improve the UI of the stats being printed since it is a huge wall of text
  async getPlayer(playerName) {
    let api_link = osrs_hisore_api_base + playerName;
    // Fetch json for price
    try {
      const apiResponse = await fetch(api_link);
      const apiText = await apiResponse.text();

      let hiscore = apiText.trim().split("\n");

      // If we get what we expect, then we can create a player
      // if not we will return null
      return hiscore.length === _STATS.length + _ACTIVITES.length
        ? new RunescapePlayer(hiscore, playerName)
        : null;
    } catch (error) {
      console.log("Fetching API went wrong", error);
    }
  }

  async printStats(message, playerName) {
    if (playerName.length < 1 || playerName.length > 12)
      return message.reply(
        `Sorry, osrs usernames can only be between 1 and 12 characters`
      );
    let player = await this.getPlayer(playerName);
    if (player) message.reply(player.getAllStatsString());
    else message.reply(`Sorry, ${playerName} does not exist on the hiscores`);
  }

  async printStatsSimple(message, playerName) {
    if (playerName.length < 1 || playerName.length > 12)
      return message.reply(
        `Sorry, osrs usernames can only be between 1 and 12 characters`
      );
    let player = await this.getPlayer(playerName);
    if (player) message.reply(player.getAllStatsLevelString());
    else message.reply(`Sorry, ${playerName} does not exist on the hiscores`);
  }

  shutdown() {
    let item_abbrv_json = JSON.stringify(this._itemAbbrv);

    fs.writeFileSync(
      "./util/runescape_item_abbrv_db.json",
      item_abbrv_json,
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  }
}

const instance = new RunescapeAPI();
Object.freeze(instance);
module.exports = instance;
