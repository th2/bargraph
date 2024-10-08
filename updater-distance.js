const fs = require("fs");
const moment = require("moment");

module.exports.run = (users, callback) => {
  const checkins = users.map((user) => loadCheckins(user.username));
  const currentDate = moment(users[0].startDate);
  const endDate = moment().add(1, "day");
  let result = [];
  let prevCount = 0;

  while (currentDate <= endDate) {
    const distance = checkinCountAtDate(checkins[0], currentDate) - checkinCountAtDate(checkins[1], currentDate);
    if (distance !== prevCount) {
      result.push({ date: currentDate.format("YYYY-MM-DD"), distance: distance });
      prevCount = distance;
    }
    currentDate.add(1, "day");
  }

  fs.writeFileSync(`data/distance.json`, JSON.stringify(result));
  console.log("distance updated successfully");
  callback();
};
const loadCheckins = (username) => JSON.parse(fs.readFileSync(`data/unique-${username}.json`, "utf8"));
const checkinCountAtDate = (checkins, date) => checkins
  .filter((checkin) => new Date(checkin.created_at) <= date)
  .length;
