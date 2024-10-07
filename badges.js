const { all } = require("axios");
const fs = require("fs");

module.exports.get = (users) => {
  var allBadges = [];

  users.forEach((user) => {
    var userBadges = JSON.parse(
      fs.readFileSync(`data/badges-${user.username}.json`, "utf8")
    );
    user.uniquebadges = userBadges.length;
    userBadges.forEach((badge) => {
      var name = badge.name;
      var level = undefined;
      var isLevel = false;
      var date = undefined;
      if (badge.date) {
        date = new Date(badge.date + " UTC");
      }
      if (badge.name.includes(" (Level ")) {
        name = badge.name.split(" (Level ")[0];
        level = badge.name.split(" (Level ")[1].replace(")", "");
        isLevel = true;
      }
      if (
        badge.image != "https://assets.untappd.com/badges/bdg_default_lg.jpg"
      ) {
        var found = allBadges.find((b) => b.name === name);
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
      }
    });
  });
  allBadges.sort((a, b) => b.firstDate - a.firstDate);
  /*
{
    name: '2022: International Year of Glass',
    image: 'https://assets.untappd.com/badges/bdg_2022YearofGlass_lg.jpg',
    isVenuebadge: false,
    isRetired: true,
    isLevel: true,
    firstDate: 2022-06-29T00:00:00.000Z,
    users: [ [Object], [Object], [Object] ]
  },
*/
  return (
    '<html><head><title>Badges</title><link rel="stylesheet" href="style.css"></head><body>' +
    "<table><thead><tr><th>Badge</th>" +
    users
      .map(
        (user) => "<th>" + user.username + " (" + user.uniquebadges + ")</th>"
      )
      .join("") +
    "</tr></thead><tbody>" +
    allBadges
      .map((badge) => {
        return (
          '<tr><td><img src="' +
          badge.image +
          '" /> ' +
          badge.name +
          (badge.isRetired ? " (retired)" : "") +
          "</td>" +
          users
            .map((user) => {
              var userBadge = badge.users.find((b) => b.name === user.username);
              if (userBadge) {
                return (
                  "<td>" +
                  (userBadge.date
                    ? userBadge.date.toISOString().split("T")[0]
                    : "✓") +
                  (badge.isLevel
                    ? " (Level " +
                      (userBadge.level ? userBadge.level : "1") +
                      ")"
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
      })
      .join("") +
    "</tbody></table></body></html>"
  );
};
