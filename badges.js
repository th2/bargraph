const { all } = require("axios");
const fs = require("fs");

const DEFAULT_IMAGE = "https://assets.untappd.com/badges/bdg_default_lg.jpg";

module.exports.get = (users) => {
  let userInfo = [];
  let allBadges = [];

  users.forEach((user) => {
    const userBadges = JSON.parse(
      fs.readFileSync(`data/badges-${user.username}.json`, "utf8")
    );

    userInfo.push({
      name: user.username,
      uniquebadges: userBadges.length,
    });

    userBadges
      .filter((badge) => badge.image != DEFAULT_IMAGE)
      .forEach((badge) => {
        const name = badge.name.split(" (Level ")[0];
        const level = badge.name.includes(" (Level ")
          ? badge.name.split(" (Level ")[1].replace(")", "")
          : undefined;
        const isLevel = badge.name.includes(" (Level ");
        const date = badge.date ? new Date(badge.date + " UTC") : undefined;

        const found = allBadges.find((b) => b.name === name);
        if (found) {
          found.isLevel = found.isLevel || isLevel;
          if (found.firstDate > date) {
            found.firstDate = date;
          }
          found.users.push({
            name: user.username,
            date: date,
            level: level,
          });
        } else {
          allBadges.push({
            name: name,
            image: badge.image,
            isVenuebadge: badge.isVenuebadge,
            isRetired: badge.isRetired,
            isLevel: isLevel,
            firstDate: date,
            users: [
              {
                name: user.username,
                date: date,
                level: level,
              },
            ],
          });
        }
      });
  });

  allBadges.sort((a, b) => b.firstDate - a.firstDate);
  return (
    '<html><head><title>Badges</title><link rel="stylesheet" href="style.css"></head><body>' +
    "<table><thead><tr><th>Badge</th>" +
    userInfo
      .map((user) => "<th>" + user.name + " (" + user.uniquebadges + ")</th>")
      .join("") +
    "</tr></thead><tbody>" +
    allBadges.map((badge) => createRow(badge, users)).join("") +
    "</tbody></table></body></html>"
  );
};

const createRow = (badge, users) => {
  return (
    '<tr><td><img src="' +
    badge.image +
    '" /> ' +
    badge.name +
    (badge.isRetired ? " (retired)" : "") +
    "</td>" +
    users
      .map((user) => {
        const userBadge = badge.users.find((b) => b.name === user.username);
        if (userBadge) {
          return (
            "<td>" +
            (userBadge.date
              ? userBadge.date.toISOString().split("T")[0]
              : "✓") +
            (badge.isLevel
              ? " (Level " + (userBadge.level ? userBadge.level : "1") + ")"
              : "") +
            "</td>"
          );
        } else {
          return "<td></td>";
        }
      })
      .join("") +
    "</tr>"
  );
};
