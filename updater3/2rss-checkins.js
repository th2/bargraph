const Parser = require("rss-parser");
const parser = new Parser();
const jsdom = require("jsdom");
const fs = require("fs");
const users = require("../data/users.json");
const cookie = fs.readFileSync("data/cookie.txt", "utf8");

const processUser = async (user) => {
  let allCheckins = JSON.parse(fs.readFileSync(`data/checkins-${user.username}.json`, "utf8"));
  let oldCheckinIds = allCheckins.map((checkin) => checkin.checkinId);
  const feed = await parser.parseURL(user.updateUrl);
  const feedItems = feed.items.reverse();
  let changes = false;
  for (const item of feedItems) {
    const checkinId = item.link.split("/").pop();
    if (!oldCheckinIds.includes(checkinId)) {
      changes = true;
      console.log(`new checkin found: ${checkinId} (${item.title}): ${item.link}`);
      await fetch(item.link, {headers: {
        cookie: cookie,
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
      }})
      .then((response) => response.text())
      .then((html) => {
        const dom = new jsdom.JSDOM(html);
        const timeElement = dom.window.document.querySelector(".checkin-bottom .time");
        const checkin = {
          checkinId: checkinId,
          time: timeElement.getAttribute("data-gregtime") ? timeElement.getAttribute("data-gregtime") : timeElement.textContent,
          imageSmall: dom.window.document.querySelector(".checkin-info .label img").src,
          beer: dom.window.document.querySelector(".checkin-info .beer p a").textContent,
          beerLink: dom.window.document.querySelector(".checkin-info .beer p a").href,
          brewery: dom.window.document.querySelector(".checkin-info .beer span a").textContent,
          breweryLink: dom.window.document.querySelector(".checkin-info .beer span a").href,
          venue: dom.window.document.querySelector(".user-info .name .location a").textContent,
          venueLink: dom.window.document.querySelector(".user-info .name .location a").href,
          rating: dom.window.document.querySelector(".checkin-info .caps").getAttribute("data-rating"),
          serving: dom.window.document.querySelector(".checkin-info .rating-serving .serving span").textContent,
          badges: Array.from(dom.window.document.querySelectorAll(".checkin-info .badges-unlocked .badge span")).map((badge) => badge.textContent),
          tagged: Array.from(dom.window.document.querySelectorAll(".checkin-extra .tagged-friends a")).map((tag) => tag.href.split("/").pop()),
        }
        allCheckins.unshift(checkin);
      });
    }
  }
  if (changes) {
    fs.writeFileSync(`data/checkins-${user.username}.json`, JSON.stringify(allCheckins, null, 2));
    console.log(`updated ${user.displayname} with changes`);
  } else {
    console.log(`updated ${user.displayname}`);
  }
};

const processUsers = async (users) => {
  for (const user of users) {
    if (user.updateUrl) {
      await processUser(user);
    }
  }
};

module.exports.run = (callback) => {
  processUsers(users)
    .then(() => {
      fs.writeFileSync(`public/data/lastupdate.json`, new Date().toISOString());
      console.log("all users updated successfully");
      callback();
    })
    .catch((error) => {
      console.error("error updating users:", error);
      callback();
    });
};
