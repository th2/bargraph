const fs = require("fs");
const https = require('https');
const users = require("../data/users.json");
const DEFAULT_IMAGE = "https://assets.untappd.com/badges/bdg_default_lg.jpg";
const IMAGE_DIR = "public/images/badges/";

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
  
  badges.list.forEach((badge) => {
    if (badge.image.startsWith("https")) {
      badge.image = downloadImage(badge.image);
    }
  });

  fs.writeFileSync("public/data/badges.json", JSON.stringify(badges), "utf8");
  console.log("✅ badges");
  callback();
};

const makeBadgeUser = (badge, user) => {
  return {
    name: user.username,
    date: badge.date,
    level: badge.level,
  };
};

const downloadImage = (url) => {
  const fileName = url.split("/").pop();
  const path = IMAGE_DIR + fileName;
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(path)) {
    const file = fs.createWriteStream(path);
    const request = https.get(url, (response) => {
       response.pipe(file);
       file.on("finish", () => {
           file.close();
           console.log(`Downloaded ${url} to ${path}`);
       });
    });
  }
  return path.replace("public", "");
}
