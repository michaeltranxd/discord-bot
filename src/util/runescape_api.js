const fs = require("fs");
const fetch = require("node-fetch");
const Discord = require("discord.js");

const { osrs_ge_api_base, osrs_ge_api_price } = require("./api_links.json");

class RunescapeAPI {
  _instance;
  _itemListByID;
  _itemListByName;
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
      if (!jsonData[key].duplicate) {
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

    let potentialItems = [];

    // Loop through each name and check if the search has matches
    names.forEach((name) => {
      if (name.indexOf(itemName) > -1) {
        // Found a potential match...
        potentialItems.push(name);
      }
    });

    return potentialItems;
  }

  async getPriceOfItem(item) {
    /* TODO */
    console.log(item);
    console.log("hehe");
    let api_link = osrs_ge_api_base + osrs_ge_api_price + item.id;
    // Fetch json for price

    const getPriceFromAPI = async () => {
      try {
        const apiResponse = await fetch(api_link);

        const apiJson = await apiResponse.json();
        return apiJson.item.current.price;
      } catch (error) {
        console.log("Fetching API went wrong", error);
      }
    };

    let itemPrice = await getPriceFromAPI();
    return itemPrice;
  }

  async printPriceOfItem(message, itemName) {
    let item = this.getItemByName(itemName);

    let itemPrice = await this.getPriceOfItem(item);

    console.log(
      `${item.name}: GE average \`${itemPrice}\` HA value \`${item.highalch}\``
    );
  }

  getItemGEString(item) {
    let itemPrice = this.getPriceOfItem(item);
    return `${item.name}: GE average \`${itemPrice}\` HA value \`${item.highalch}\``;
  }

  addAbbrv(item, abbrv) {
    if (!this._itemAbbrv[0]) {
      this._itemAbbrv[0] = [];
    }
    if (!this._itemAbbrv[0].includes("hello")) {
      this._itemAbbrv[0].push("hello");
    }
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
