const express = require("express");
const app = express();
const fs = require('fs');
const updaters = fs.readdirSync('./updater').map(updater => require(`./updater/${updater}`));

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));
app.get("/update", (req, res) => update(0, () => res.redirect("/")));
app.use("/", express.static("public"));

const update = (i, callback) => updaters[i].run(() => i >= updaters.length - 1 ? callback() : update(i + 1, callback));
