const app = require("express")();
const path = require("path");
const users = require("./data/users.json");
const updaters = ["./updater-rss.js", "./updater-checkins.js", "./updater-distance.js"];

app.get("/", (req, res) => sendFile(res, "public/chart.html", "file not found"));
app.get("/users", (req, res) => res.send(users));
app.get("/data", (req, res) => sendFile(res, "data/checkins.json", "[]"));
app.get("/dataDistance", (req, res) => sendFile(res, "data/distance.json", "[]"));
app.get("/lastupdate", (req, res) => sendFile(res, "data/lastupdate.json", "1970-01-01T00:00:00Z"));
app.get("/badges", (req, res) => res.send(require("./badges.js").get(users)));
app.get("/update", (req, res) => update(0, () => res.redirect("/")));
app.use("/", express.static("public"));
app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));

const update = (i, callback) =>
  require(updaters[i]).run(users, 
    () => i >= updaters.length - 1 ? callback() : update(i + 1, callback));

const sendFile = (res, file, errReply) =>
  res.sendFile(file, { root: path.join(__dirname) }, (err) => { if (err) res.send(errReply); });
