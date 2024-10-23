const fs = require("fs");
const jsdom = require("jsdom");
const users = require("../data/users.json");
const sleepBetweenRequests = 5000;
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

module.exports.run = (callback) => {
  let knownBeers = require("../data/beers.json");
  let newBeers = [];

  users.forEach((user) => {
    const checkins = JSON.parse(fs.readFileSync(`data/checkins-${user.username}.json`, "utf8"));
    const uniqueBeers = checkins
      .filter(checkin => typeof checkin.beerLink !== "undefined")
      .map(checkin => ({ name: checkin.beer, link: checkin.beerLink }))
      .filter((beer, index, self) => index === self.findIndex((t) => t.link === beer.link));

    uniqueBeers.forEach((beer) => {
      if (!knownBeers.some((knownBeer) => knownBeer.link === beer.link) && 
        !newBeers.some((beerToCheck) => beerToCheck.link === beer.link)) {
          newBeers.push(beer);
      }
    });
  });

  processBeers(newBeers, knownBeers)
    .then(() => {
      console.log("✅ beers");
      callback();
    })
    .catch((error) => {
      console.error("⚠️ beers: error updating beers:", error);
      callback();
    });
};

const processBeers = async (newBeers, knownBeers) => {
  for (const beer of newBeers) {
    console.log(`beers: processing ${beer.name}`);
    const beerInfo = await fetchBeerInfo(beer.link);
    console.log(beerInfo);
    knownBeers.push(beerInfo);
    fs.writeFileSync("data/beers.json", JSON.stringify(knownBeers, null, 2));
    await new Promise((resolve) => setTimeout(resolve, sleepBetweenRequests));
  }
}

const fetchBeerInfo = async (beerLink) => {
  return await fetch("https://untappd.com" + beerLink, { headers: { 'user-agent': userAgent }})
    .then((response) => response.text())
    .then((html) => {
      const dom = new jsdom.JSDOM(html);
      const beerInfo = {
        link: beerLink,
        name: dom.window.document.querySelector(".b_info .top .name h1").textContent.trim(),
        brewery: dom.window.document.querySelector(".b_info .top .name .brewery a").href,
        style: dom.window.document.querySelector(".b_info .top .name .style").textContent.trim(),
        abv: dom.window.document.querySelector(".b_info .details .abv").textContent.replace("ABV","").trim(),
        ibu: dom.window.document.querySelector(".b_info .details .ibu").textContent.replace("IBU","").trim(),
        image: dom.window.document.querySelector(".b_info .top .image-big").getAttribute("data-image"),
        stats: {
          "date-fetched": new Date().toISOString(),
          "checkins-total": dom.window.document.querySelectorAll(".b_info .stats .count")[0].textContent.replace(",", "").trim(),
          "checkins-unique": dom.window.document.querySelectorAll(".b_info .stats .count")[1].textContent.replace(",", "").trim(),
          "checkins-monthly": dom.window.document.querySelectorAll(".b_info .stats .count")[2].textContent.replace(",", "").trim(),
          rating: parseFloat(dom.window.document.querySelector(".b_info .details .caps").getAttribute("data-rating")),
          raters: dom.window.document.querySelector(".b_info .details .raters").textContent.replace(",", "").replace(" Ratings", "").trim(),
        }
      };
      return beerInfo; 
    });
}
