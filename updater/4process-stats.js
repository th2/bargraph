const fs = require("fs");
const users = require("../data/users.json");
const beers = require(`../data/beers.json`);
const breweries = require(`../data/breweries.json`);
const venues = require(`../data/venues.json`);
const styleDarkness = [
  "Shandy / Radler",
  "Pilsner",
  "Lager",
  "Blonde / Golden Ale",
  "Märzen",
  "Wheat Beer",
  "Pale Ale",
  "IPA",
  "Kellerbier / Zwickelbier",
  "Hard Ginger Beer",
  "Sour",
  "Red Ale",
  "Malt Beer",
  "Bock",
  "Stout",
  "Other"
]
const weekdays = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ];

module.exports.run = (callback) => {
  users.forEach((user) => generateStats(user));

  callback();
};

function generateStats(user) {
  const checkins = require(`../data/checkins-${user.username}.json`);
  const abvAccumulator = { count: [], rating: [], total: 0 };
  const beerAccumulator = { count: [], rating: [], total: 0 };
  const hourAccumulator = { count: [], rating: [], total: 0 };
  const servingAccumulator = { count: [], rating: [], total: 0 };
  const styleAccumulator = { count: [], rating: [], total: 0 };
  const venueAccumulator = { count: [], rating: [], total: 0 };
  const weekDayAccumulator = { count: [], rating: [], total: 0 };
  const ratingList = [];

  const breweryRatingList = {};
  const stats = {
    breweryCountries: {},
    breweryCounts: {},
    breweryList: {},
    globalRatingDistribution: {},
    styleCounts: {},
    venueCountries: {},
    venueTypeCounts: {},
    venueLocations: {}
  };

  checkins.forEach((checkin) => {
    const beer = beers.find((beer) => beer.link === checkin.beerLink);
    if (!beer) {
      console.log(`Beer not found: ${checkin.beerLink}`);
      return;
    }

    aggregate(ratingList, checkin.rating * 4);
    aggregateRatings(abvAccumulator, getAbv(beer), checkin.rating);
    aggregateRatings(beerAccumulator, checkin.beerLink, checkin.rating);
    aggregateRatings(hourAccumulator, new Date(checkin.time).getHours(), checkin.rating);
    aggregateRatings(styleAccumulator, getBeerStyle(beer), checkin.rating);
    aggregateRatings(servingAccumulator, checkin.serving.trim(), checkin.rating);
    aggregateRatings(venueAccumulator, checkin.venue, checkin.rating);
    aggregateRatings(weekDayAccumulator, new Date(checkin.time).toLocaleDateString("en-US", { weekday: "long" }), checkin.rating);
    
    aggregateBreweryData(checkin, stats);
    aggregateBreweryList(breweryRatingList, checkin);

    aggregate(stats.breweryCounts, checkin.brewery);
    aggregate(stats.globalRatingDistribution, (Math.round(beer.stats.rating * 10) / 10).toFixed(1));
    aggregate(stats.styleCounts, beer.style);
    addToVenueData(checkin, stats);
  });
  
  stats.breweryList = mapBreweryList(breweryRatingList);
  stats.breweryCountries = sort(stats.breweryCountries);
  stats.breweryCounts = sort(stats.breweryCounts);
  stats.globalRatingDistribution = sortByKey(stats.globalRatingDistribution);
  stats.styleCounts = sort(stats.styleCounts);
  stats.venueCountries = sort(stats.venueCountries);
  stats.venueTypeCounts = sort(stats.venueTypeCounts);

  // new structure
  stats.displayname = user.displayname,
  stats.totalCheckins = checkins.length,
  stats.averageRating = (checkins.reduce((a, b) => a + parseFloat(b.rating), 0) / checkins.length).toFixed(2);
  stats.lowestRating = Math.min(...checkins.map((checkin) => checkin.rating));
  stats.highestRating = Math.max(...checkins.map((checkin) => checkin.rating));
  stats.uniqueBeers = Object.keys(beerAccumulator.count).length;
  stats.mapsKey = fs.readFileSync("data/googlemaps.key", "utf8").trim();

  stats.abv = makeCountsWithRating(abvAccumulator);
  const hours = makeCountsWithRating(hourAccumulator);
  stats.hours = [];
  for (let i = 0; i < 24; i++) {
    const hour = hours.find((hour) => hour.name == ((i + 6) % 24));
    stats.hours[i] = hour ? hour : { name: ((i + 6) % 24), count: 0, percentage: 0, average: 0, ratingCount: 0, ratingPercentage: 0, ratingAverage: 0 };
  }
  stats.beerStyles = makeCountsWithRating(styleAccumulator);
  stats.beerStyles.forEach((style) => { style.darkness = styleDarkness.indexOf(style.name); });
  stats.serving = makeCountsWithRating(servingAccumulator);
  stats.venues = makeCountsWithRating(venueAccumulator);
  stats.weekdays = makeCountsWithRating(weekDayAccumulator).sort((a, b) => weekdays.indexOf(a.name) - weekdays.indexOf(b.name));

  stats.beerList = Object.entries(beerAccumulator.rating).map(([key, value]) => {
    const beer = beers.find((beer) => beer.link === key);
    const brewery = breweries.find((brewery) => brewery.link === beer.brewery);
    return {
      name: brewery.name + " - " + beer.name,
      link: key,
      average: (value.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / value.length).toFixed(2),
      count: value.length,
      percentage: ((value.length / stats.totalCheckins) * 100).toFixed(2),
      style: beer.style
    }
  });

  stats.ratings = [];
  for (let i = 0; i <= 5; i += 0.25) {
    stats.ratings[i * 4] = ({
      name: i.toFixed(2),
      count: ratingList[i * 4] || 0,
      percentage: (((ratingList[i * 4] || 0) / ratingList.reduce((a, b) => a + b, 0)) * 100).toFixed(2)
    });
  }

  writeToFile(user, stats);
}

function makeCountsWithRating(accumulator) {
  return Object.entries(accumulator.count).map(([key, value]) => ({
    name: key,
    count: value,
    percentage: ((value / accumulator.total) * 100).toFixed(2),
    average: (accumulator.rating[key].reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / accumulator.rating[key].length).toFixed(2),
    ratingCount: accumulator.rating[key].length,
    ratingPercentage: ((accumulator.rating[key].length / accumulator.total) * 100).toFixed(2),
    ratingAverage: (accumulator.rating[key].reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / accumulator.rating[key].length).toFixed(2)
  }));
}

function getAbv(beer) {
  if (isAlcoholFree(beer)) return 0;
  if (beer.abv === "N/A") return "N/A";
  return Math.round(parseFloat(beer.abv.replace("%", "")));
}

function isAlcoholFree(beer) {
  return beer.style.startsWith("Non-Alcoholic") || 
    (beer.abv != "N/A" && beer.abv.replace("%", "") < 0.5) ||
    beer.name.toLowerCase().includes("alkoholfr");
}

function getBeerStyle(beer) {
  const mainStyle = beer.style.split(" - ")[0];
  if (mainStyle !== "Non-Alcoholic") {
    return mainStyle;
  }
  const subStyle = beer.style.split(" - ")[1];
  if (subStyle === "Wheat") {
    return "Wheat Beer";
  }
  return subStyle;
}

function aggregateBreweryData(checkin, stats) {
  const brewery = breweries.find((brewery) => brewery.link === checkin.breweryLink);
  if (!brewery) {
    console.log(`Brewery not found: ${checkin.breweryLink}`);
    return;
  }

  aggregate(stats.breweryCountries, getCountry(brewery));
}

function addToVenueData(checkin, stats) {
  if (!checkin.venueLink || checkin.venueLink === "/v/at-home/9917985") return;
  const venue = venues.find((venue) => venue.link === checkin.venueLink);
  if (!venue) {
    console.log(`Venue not found: ${checkin.venueLink}`);
    return;
  }
  venue.type.split(", ").forEach((type) => aggregate(stats.venueTypeCounts, type));
  if (!venue.osm_country) {
    console.log(`Venue country not found: ${checkin.venueLink}`);
    return;
  }
  aggregate(stats.venueCountries, venue.osm_country);
  aggregate(stats.venueLocations, venue.map_coordinates);
}

function aggregateBreweryList(breweryRatingList, checkin) {
  const brewery = breweries.find((brewery) => brewery.link === checkin.breweryLink);
  if (checkin.breweryLink) {
    if (breweryRatingList[checkin.breweryLink]) {
      breweryRatingList[checkin.breweryLink].rating.push(checkin.rating);
    } else {
      breweryRatingList[checkin.breweryLink] = {
        name: checkin.brewery,
        link: checkin.breweryLink,
        address: brewery.address,
        style: brewery.style,
        "global-checkins-total": brewery.stats["checkins-total"],
        "global-checkins-unique": brewery.stats["checkins-unique"],
        "global-rating": brewery.stats["rating"],
        beers: brewery.stats.beers,
        location: brewery.location,
        rating: [checkin.rating]
      };
    }
  }
}

function mapBreweryList(breweryRatingList) {
  return Object.values(breweryRatingList).map((brewery) => {
    brewery.average = (brewery.rating.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / brewery.rating.length).toFixed(2);
    brewery.count = brewery.rating.length;
    brewery.rating = undefined;
    return brewery;
  });
}

function getCountry(brewery) {
  if (brewery.address.endsWith("Islands") || brewery.address.endsWith("Republic") || brewery.address.endsWith("States")) {
    const indexSecondToLastSpace = brewery.address.lastIndexOf(" ", brewery.address.lastIndexOf(" ") - 1);
    return brewery.address.substring(indexSecondToLastSpace + 1);
  }
  return brewery.address.split(" ").pop();
}

function aggregate(accumulator, currentValue) {
  if (currentValue === "")
    return;
  if (accumulator[currentValue]) {
    accumulator[currentValue]++;
  } else {
    accumulator[currentValue] = 1;
  }
}

function aggregateRatings(accumulator, selector, value) {
  aggregate(accumulator.count, selector);
  accumulator.rating[selector] ? accumulator.rating[selector].push(value) : accumulator.rating[selector] = [value];
  accumulator.total++;
}

function sort(accumulator) {
  return Object.fromEntries(Object.entries(accumulator).sort(([, a], [, b]) => b - a));
}

function sortByKey(accumulator) {
  return Object.fromEntries(Object.entries(accumulator).sort((a, b) => a[0] - b[0]));
}

function writeToFile(user, stats) {
  const dataDir = "public/stats/data/";
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(`${dataDir}${user.displayname}.json`, JSON.stringify(stats, null, 2));
}