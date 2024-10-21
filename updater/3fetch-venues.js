const fs = require("fs");
const jsdom = require("jsdom");
const users = require("../data/users.json");
const sleepBetweenRequests = 5000;
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

module.exports.run = (callback) => {
  let knownVenues = require("../data/venues.json");
  let newVenues = [];

  users.forEach((user) => {
    const checkins = JSON.parse(fs.readFileSync(`data/checkins-${user.username}.json`, "utf8"));
    const uniqueVenues = checkins
      .filter(checkin => typeof checkin.venueLink !== "undefined")
      .map(checkin => ({ name: checkin.venue, link: checkin.venueLink }))
      .filter((venue, index, self) => index === self.findIndex((t) => t.link === venue.link));

    uniqueVenues.forEach((venue) => {
      if (!knownVenues.some((knownVenue) => knownVenue.link === venue.link) && 
        !newVenues.some((venueToCheck) => venueToCheck.link === venue.link)) {
          newVenues.push(venue);
      }
    });
  });

  processVenues(newVenues, knownVenues)
    .then(() => {
      console.log("✅ venues");
      callback();
    })
    .catch((error) => {
      console.error("⚠️ venues: error updating venues:", error);
      callback();
    });
};

const processVenues = async (newVenues, knownVenues) => {
  for (const venue of newVenues) {
    console.log(`venues: processing ${venue.name}`);
    const venueInfo = await fetchVenueInfo(venue.link);
    console.log(venueInfo);
    knownVenues.push(venueInfo);
    fs.writeFileSync("data/venues.json", JSON.stringify(knownVenues, null, 2));
    await new Promise((resolve) => setTimeout(resolve, sleepBetweenRequests));
  }
}

const fetchVenueInfo = async (venueLink) => {
  const cookie = fs.readFileSync("data/cookie.txt", "utf8");
  return await fetch("https://untappd.com" + venueLink, { headers: { cookie: cookie, 'user-agent': userAgent }})
    .then((response) => response.text())
    .then((html) => {
      const dom = new jsdom.JSDOM(html);
      const mapLink = dom.window.document.querySelector(".header-details .address a").href;
      const venueInfo = {
        link: venueLink,
        name: dom.window.document.querySelector(".header-details .venue-name h1").textContent,
        type: dom.window.document.querySelector(".header-details .venue-name h2").textContent,
        logo: dom.window.document.querySelector(".header-details .logo img").src,
        address: dom.window.document.querySelector(".header-details .address").textContent.replace(/\n/g, "").replace(" ( Map ) ", "").trim(),
        map_ink: mapLink,
        map_coordinates: mapLink.includes("?near=") ? mapLink.substring(mapLink.indexOf("?near=") + 6, mapLink.indexOf("&")) : mapLink.substring(mapLink.indexOf("?q=") + 3),
      };
      return venueInfo; 
    });
}

function countVenues(checkins) {
  const venues = checkins
    .filter(checkin => typeof checkin.venueLink !== "undefined")
    .map(checkin => ({ name: checkin.venue, link: checkin.venueLink }));
  const venueCounts = venues.reduce((acc, venue) => {
    acc[venue.link] = acc[venue.link] ? acc[venue.link] + 1 : 1;
    return acc;
  }, {});
  const sortedVenueCounts = Object.entries(venueCounts).sort((a, b) => b[1] - a[1]);
  console.log(sortedVenueCounts);
}