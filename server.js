const express = require("express");
const app = express();
const fs = require('fs');
const updaters = fs.readdirSync('./updater').map(updater => require(`./updater/${updater}`));

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));
app.get("/update", (req, res) => updateCheck(() => res.redirect("/")));
app.use("/", express.static("public"));

const updateCheck = (callback) => {
  if (!fs.existsSync('public/data/lastupdate.json')) {
    console.log('No last update file found.');
    update(0, callback);
    return;
  }
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
