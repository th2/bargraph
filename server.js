const express = require("express");
const app = express();
const path = require("path");
const users = require("./data/users.json");
const updaters = ["./updater-users.js", "./updater-rss.js", "./updater-checkins.js", "./updater-distance.js"];

app.get("/", (req, res) => sendFile(res, "public/chart.html", "file not found"));
app.get("/badges", (req, res) => res.send(require("./badges.js").get(users)));
app.get("/update", (req, res) => update(0, () => res.redirect("/")));
app.use("/", express.static("public"));
app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));

const update = (i, callback) =>
  require(updaters[i]).run(users, 
    () => i >= updaters.length - 1 ? callback() : update(i + 1, callback));

const sendFile = (res, file, errReply) =>
  res.sendFile(file, { root: path.join(__dirname) }, (err) => { if (err) res.send(errReply); });
