const fs = require("fs");

const DEFAULT_IMAGE = "https://assets.untappd.com/badges/bdg_default_lg.jpg";

module.exports.get = (users) => {
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

  return createTable(badges);
};

const makeBadgeUser = (badge, user) => {
  return {
    name: user.username,
    date: badge.date,
    level: badge.level,
  };
};

const createTable = (badges) => {
    return '<html><head><title>Badges</title><link rel="stylesheet" href="style.css"></head><body>' +
    "<table><thead><tr><th>Badge</th>" +
    badges.users
      .map((user) => "<th>" + user.name + " (" + user.uniquebadges + ")</th>")
      .join("") +
    "</tr></thead><tbody>" +
    badges.list.map((badge) => createRow(badge, badges.users)).join("") +
    "</tbody></table></body></html>";
}

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
        const userBadge = badge.users.find((b) => b.name === user.name);
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
