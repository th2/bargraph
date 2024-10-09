const express = require("express");
const app = express();
const updaters = ["./updater-users.js", "./updater-rss.js", "./updater-checkins.js", "./updater-distance.js"];

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));
app.get("/badges", (req, res) => res.send(require("./badges.js").get(users)));
app.get("/update", (req, res) => update(0, () => res.redirect("/")));
app.use("/", express.static("public"));

const update = (i, callback) => require(updaters[i])
  .run(() => i >= updaters.length - 1 ? callback() : update(i + 1, callback));
