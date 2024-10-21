const Parser = require("rss-parser");
const parser = new Parser();
const fs = require("fs");
const users = require("../data/users.json");

const processUser = async (user) => {
  let allCheckins = JSON.parse(fs.readFileSync(`data/unique-${user.username}.json`, "utf8"))
  .map((item) => {
    item.beer_name = removeWhitespace(item.beer_name);
    item.brewery_name = removeWhitespace(item.brewery_name);
    return item;
  });
  let feed = await parser.parseURL(user.updateUrl);
  feed.items.reverse().forEach((item) => {
    const beer_name = removeWhitespace(item.title.substring(item.title.indexOf("is drinking a") + 14, item.title.indexOf(" by  ")));
    const brewery_name = removeWhitespace(item.title.substring(item.title.indexOf(" by  ") + 5).split(" at ")[0]);
    const foundInCheckins = allCheckins.some((previousCheckin) => beer_name === previousCheckin.beer_name && brewery_name === previousCheckin.brewery_name);
    if (!foundInCheckins) {
      console.log(`rss unique: new checkin found: ${item.isoDate} ${beer_name} from ${brewery_name}`);
      allCheckins.unshift({
        beer_name: beer_name,
        brewery_name: brewery_name,
        created_at: item.isoDate,
      });
    }
  });
  fs.writeFileSync(`data/unique-${user.username}.json`, JSON.stringify(allCheckins));
  console.log("✅ rss unique: updated " + user.displayname);
};

const removeWhitespace = (str) => str.replace(/\s+/g, " ").trim();

const processUsers = async (users) => {
  for (const user of users) {
    if (user.updateUrl) {
      await processUser(user);
    }
  }
};

module.exports.run = (callback) => {
  processUsers(users)
    .then(() => {
      console.log("✅ rss unique");
      callback();
    })
    .catch((error) => {
      console.error("⚠️ rss unique: error updating users:", error);
      callback();
    });
};
