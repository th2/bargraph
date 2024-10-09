const fs = require("fs");

module.exports.run = (users, callback) => {
  const checkinCounts = users.map((user) => {
    let count = 0;
    const checkins = loadCheckins(user.username)
      .map((checkin) => ({ x: new Date(checkin.created_at).toISOString(), y: ++count }))
      .filter((data) => data.x > "2019-01-01T22:00:00.000Z");
    return {
      label: user.displayname,
      backgroundColor: user.color,
      borderColor: user.color,
      data: checkins,
      stepped: true,
    };
  });
  
  fs.writeFileSync("data/checkins.json", JSON.stringify(checkinCounts), "utf8");
  console.log("checkins count updated successfully");
  callback();
};

const loadCheckins = (username) => JSON
    .parse(fs.readFileSync(`data/unique-${username}.json`, "utf8"))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
