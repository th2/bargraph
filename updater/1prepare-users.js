const fs = require("fs");
const users = require("../data/users.json");
const dir = "public/data";

module.exports.run = (callback) => {
  const usersWithoutUrl = users.map((user) => {
    return {
      ...user,
      username: undefined,
      updateUrl: undefined
    };
  });
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dir + "/users.json", JSON.stringify(usersWithoutUrl), "utf8");
  fs.writeFileSync(`public/data/lastupdate.json`, new Date().toISOString());
  console.log("✅ users");
  callback();
};
