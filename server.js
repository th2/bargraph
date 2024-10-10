const express = require("express");
const app = express();
const fs = require('fs');
const updaters = fs.readdirSync('./updater');

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));
app.get("/update", (req, res) => update(0, () => res.redirect("/")));
app.use("/", express.static("public"));

const update = (i, callback) => require(`./updater/${updaters[i]}`)
  .run(() => i >= updaters.length - 1 ? callback() : update(i + 1, callback));
