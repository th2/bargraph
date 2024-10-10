const fs = require("fs");
const users = require("../data/users.json");
const DEFAULT_IMAGE = "https://assets.untappd.com/badges/bdg_default_lg.jpg";

module.exports.run = (callback) => {
  let badges = {
    list: [],
    users: [],
  };

  users.forEach((user) => {
    const userBadges = JSON.parse(
      fs.readFileSync(`data/badges-${user.username}.json`, "utf8")
    );

    badges.users.push({
      name: user.username,
      displayname: user.displayname,
      uniquebadges: userBadges.length,
    });

    userBadges
      .filter((badge) => badge.image != DEFAULT_IMAGE)
      .forEach((badge) => {
        badge.level = badge.name.includes(" (Level ")
          ? badge.name.split(" (Level ")[1].replace(")", "")
          : undefined;
        badge.isLevel = badge.name.includes(" (Level ");
        badge.date = badge.date ? new Date(badge.date + " UTC") : undefined;
        badge.name = badge.name.split(" (Level ")[0];

        const badgeInList = badges.list.find((b) => b.name === badge.name);
        if (badgeInList) {
          badgeInList.isLevel = badgeInList.isLevel || badge.isLevel;
          if (badgeInList.firstDate > badge.date) {
            badgeInList.firstDate = badge.date;
          }
          badgeInList.users.push(makeBadgeUser(badge, user));
        } else {
          badge.firstDate = badge.date;
          badge.users = [makeBadgeUser(badge, user)];
          badges.list.push(badge);
        }
      });
  });

  badges.list.sort((a, b) => b.firstDate - a.firstDate);
  
  fs.writeFileSync("public/data/badges.json", JSON.stringify(badges), "utf8");
  console.log("badges updated successfully");
  callback();
};

const makeBadgeUser = (badge, user) => {
  return {
    name: user.username,
    date: badge.date,
    level: badge.level,
  };
};
