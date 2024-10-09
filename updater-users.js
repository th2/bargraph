const fs = require("fs");
const dir = "public/data";

module.exports.run = (users, callback) => {
  const usersWithoutUrl = users.map((user) => {
    return {
      ...user,
      updateUrl: undefined
    };
  });
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dir + "/users.json", JSON.stringify(usersWithoutUrl), "utf8");
  console.log("users updated successfully");
  callback();
};
