const express = require("express");
const app = express();
const fs = require('fs');
const updaters = fs.readdirSync('./updater').map(updater => require(`./updater/${updater}`));
const updaters2 = fs.readdirSync('./updater2').map(updater => require(`./updater2/${updater}`));

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));
app.get("/update", (req, res) => updateCheck(() => res.redirect("/")));
app.get("/update2", (req, res) => update2(0, () => res.redirect("/")));
app.use("/", express.static("public"));

const updateCheck = (callback) => {
  const lastUpdate = new Date(fs.readFileSync('public/data/lastupdate.json', 'utf8'));
  const minutesSinceLastUpdate = (new Date() - lastUpdate) / 1000 / 60;
  console.log(`Minutes since last update: ${minutesSinceLastUpdate}`);
  if (minutesSinceLastUpdate > 5) {
    update(0, callback);
  } else {
    console.log('Last update was less than 5 minutes ago.');
    callback();
  }
};

const update = (i, callback) => updaters[i].run(() => i >= updaters.length - 1 ? callback() : update(i + 1, callback));
const update2 = (i, callback) => updaters2[i].run(() => i >= updaters2.length - 1 ? callback() : update2(i + 1, callback));
