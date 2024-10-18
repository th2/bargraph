const express = require("express");
const app = express();
const fs = require('fs');
const updaters = fs.readdirSync('./updater').map(updater => require(`./updater/${updater}`));
const updaters2 = fs.readdirSync('./updater2').map(updater => require(`./updater2/${updater}`));

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));
app.get("/update", (req, res) => update(0, () => res.redirect("/")));
app.get("/update2", (req, res) => update2(0, () => res.redirect("/")));
app.use("/", express.static("public"));

const update = (i, callback) => updaters[i].run(() => i >= updaters.length - 1 ? callback() : update(i + 1, callback));
const update2 = (i, callback) => updaters2[i].run(() => i >= updaters2.length - 1 ? callback() : update2(i + 1, callback));
