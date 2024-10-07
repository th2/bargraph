const fs = require("fs");
const moment = require("moment");

module.exports.run = (users, callback) => {
  if (users.length < 2) return "less than 2 users";
  const checkins0 = JSON.parse(
    fs.readFileSync(`data/unique-${users[0].username}.json`, "utf8")
  );
  const checkins1 = JSON.parse(
    fs.readFileSync(`data/unique-${users[1].username}.json`, "utf8")
  );

  const currentDate = moment(users[0].startDate);
  const endDate = moment().add(1, "day");

  var result = [];
  var prevCount = 0;

  while (currentDate <= endDate) {
    const checkinsAtDate0 = checkinCountAtDate(checkins0, currentDate);
    const checkinsAtDate1 = checkinCountAtDate(checkins1, currentDate);
    const distance = checkinsAtDate0 - checkinsAtDate1;

    if (distance !== prevCount) {
      result.push({
        date: currentDate.format("YYYY-MM-DD"),
        distance: distance,
      });
      prevCount = distance;
    }
    currentDate.add(1, "day");
  }

  fs.writeFileSync(`data/distance.json`, JSON.stringify(result));
  console.log("distance updated successfully");
  callback();
};

function checkinCountAtDate(checkins, date) {
  return checkins
    .filter((checkin) => new Date(checkin.created_at) <= date)
    .length;
}
