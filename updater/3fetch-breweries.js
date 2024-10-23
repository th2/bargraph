const fs = require("fs");
const jsdom = require("jsdom");
const users = require("../data/users.json");
const sleepBetweenRequests = 5000;
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

module.exports.run = (callback) => {
  let knownBreweries = require("../data/breweries.json");
  let newBreweries = [];

  users.forEach((user) => {
    const checkins = JSON.parse(fs.readFileSync(`data/checkins-${user.username}.json`, "utf8"));
    const uniqueBreweries = checkins
      .filter(checkin => typeof checkin.breweryLink !== "undefined")
      .map(checkin => ({ name: checkin.brewery, link: checkin.breweryLink }))
      .filter((brewery, index, self) => index === self.findIndex((t) => t.link === brewery.link));

    uniqueBreweries.forEach((brewery) => {
      if (!knownBreweries.some((knownBrewery) => knownBrewery.link === brewery.link) && 
        !newBreweries.some((breweryToCheck) => breweryToCheck.link === brewery.link)) {
          newBreweries.push(brewery);
      }
    });
  });

  processBreweries(newBreweries, knownBreweries)
    .then(() => {
      console.log("✅ breweries");
      callback();
    })
    .catch((error) => {
      console.error("⚠️ breweries: error updating breweries:", error);
      callback();
    });
};

const processBreweries = async (newBreweries, knownBreweries) => {
  for (const brewery of newBreweries) {
    console.log(`breweries: processing ${brewery.name}`);
    const breweryInfo = await fetchBreweryInfo(brewery.link);
    console.log(breweryInfo);
    knownBreweries.push(breweryInfo);
    fs.writeFileSync("data/breweries.json", JSON.stringify(knownBreweries, null, 2));
    await new Promise((resolve) => setTimeout(resolve, sleepBetweenRequests));
  }
}

const fetchBreweryInfo = async (breweryLink) => {
  return await fetch("https://untappd.com" + breweryLink, { headers: { 'user-agent': userAgent }})
    .then((response) => response.text())
    .then((html) => {
      const dom = new jsdom.JSDOM(html);
      const breweryLocations = [];
      dom.window.document.querySelectorAll(".brewery-page .sidebar .box").forEach((box) => {
        if (box.querySelector(".content h3") && box.querySelector(".content h3").textContent.trim() === "Brewery Locations") {
          box.querySelectorAll(".content .item").forEach((item) => breweryLocations.push(item.querySelector("a").href));
        }
      })
      const breweryInfo = {
        link: breweryLink,
        name: dom.window.document.querySelector(".b_info .top .name h1").textContent.trim(),
        address: dom.window.document.querySelector(".b_info .top .name .brewery").textContent.trim(),
        style: dom.window.document.querySelector(".b_info .top .name .style").textContent.trim(),
        logo: dom.window.document.querySelector(".b_info .top .image-big").getAttribute("data-image"),
        stats: {
          "date-fetched": new Date().toISOString(),
          "checkins-total": dom.window.document.querySelectorAll(".b_info .stats .count")[0].textContent.replace(",", "").trim(),
          "checkins-unique": dom.window.document.querySelectorAll(".b_info .stats .count")[1].textContent.replace(",", "").trim(),
          "checkins-monthly": dom.window.document.querySelectorAll(".b_info .stats .count")[2].textContent.replace(",", "").trim(),
          rating: parseFloat(dom.window.document.querySelector(".b_info .details.brewery .caps").getAttribute("data-rating")),
          raters: dom.window.document.querySelector(".b_info .details.brewery .raters").textContent.replace(",", "").replace(" Ratings", "").trim(),
          beers: dom.window.document.querySelector(".b_info .details.brewery .count a").textContent.replace(" Beers", "").trim(),
        },
        "brewery-locations": breweryLocations
      };
      return breweryInfo; 
    });
}
