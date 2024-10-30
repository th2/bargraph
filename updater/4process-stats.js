const fs = require("fs");
const users = require("../data/users.json");
const beers = require(`../data/beers.json`);
const breweries = require(`../data/breweries.json`);
const venues = require(`../data/venues.json`);

module.exports.run = (callback) => {
  users.forEach((user) => generateStats(user));

  callback();
};

function generateStats(user) {
  const checkins = require(`../data/checkins-${user.username}.json`);
  const uniqueBeers = [];
  const breweryRatingList = {};
  const stats = {
    displayname: user.displayname,
    totalCheckins: checkins.length,
    uniqueBeers: 0,
    alcoholFreeCheckins: 0,
    alcoholFreePercentage: 0,
    alcoholDistribution: {},
    alcoholPercentageDistribution: {},
    breweryCountries: {},
    breweryCounts: {},
    breweryList: {},
    breweryStyleCounts: {},
    globalRatingDistribution: {},
    ibuDistribution: {},
    ratingDistribution: {},
    servingCounts: {},
    styleCategoryCounts: {
      "Shandy / Radler": 0,
      "Pilsner": 0,
      "Lager": 0,
      "Blonde / Golden Ale": 0,
      "Märzen": 0,
      "Wheat Beer": 0,
      "Pale Ale": 0,
      "IPA": 0,
      "Kellerbier / Zwickelbier": 0,
      "Hard Ginger Beer": 0,
      "Sour": 0,
      "Red Ale": 0,
      "Malt Beer": 0,
      "Bock": 0,
      "Stout": 0,
      "Other": 0
    },
    styleCategoryPercentages: {},
    styleCounts: {},
    venueCountries: {},
    venueCounts: {},
    venueTypeCounts: {},
    hourCounts: {
      " 6": 0,
      " 7": 0,
      " 8": 0,
      " 9": 0,
      " 9": 0,
      " 10": 0,
      " 11": 0,
      " 12": 0,
      " 13": 0,
      " 14": 0,
      " 15": 0,
      " 16": 0,
      " 17": 0,
      " 18": 0,
      " 19": 0,
      " 20": 0,
      " 21": 0,
      " 22": 0,
      " 23": 0,
      " 0": 0,
      " 1": 0,
      " 2": 0,
      " 3": 0,
      " 4": 0,
      " 5": 0
    },
    weekdayCounts: {
      "Monday": 0,
      "Tuesday": 0,
      "Wednesday": 0,
      "Thursday": 0,
      "Friday": 0,
      "Saturday": 0,
      "Sunday": 0
    },
    venueLocations: {}
  };

  checkins.forEach((checkin) => {
    const beer = beers.find((beer) => beer.link === checkin.beerLink);
    if (!beer) {
      console.log(`Beer not found: ${checkin.beerLink}`);
      return;
    }

    if (!uniqueBeers.includes(beer.name)) uniqueBeers.push(beer.name);
    if (isAlcoholFree(beer)) stats.alcoholFreeCheckins++;
    
    aggregate(stats.alcoholDistribution, getAbv(beer));
    aggregate(stats.alcoholDistribution, getAbv(beer));
    aggregateBreweryData(checkin, stats);
    aggregateBreweryList(breweryRatingList, checkin);
    aggregate(stats.breweryCounts, checkin.brewery);
    aggregate(stats.globalRatingDistribution, (Math.round(beer.stats.rating * 10) / 10).toFixed(1));
    aggregate(stats.ibuDistribution, beer.ibu);
    aggregate(stats.ratingDistribution, parseFloat(checkin.rating).toFixed(2));
    aggregate(stats.servingCounts, checkin.serving.trim());
    aggregate(stats.styleCategoryCounts, getBeerStyle(beer));
    aggregate(stats.styleCounts, beer.style);
    addToVenueData(checkin, stats);
    aggregate(stats.venueCounts, checkin.venue);
    aggregate(stats.hourCounts, ' ' + new Date(checkin.time).getHours());
    aggregate(stats.weekdayCounts, new Date(checkin.time).toLocaleDateString("en-US", { weekday: "long" }));
  });
  
  stats.uniqueBeers = uniqueBeers.length;
  stats.averageRating = (checkins.reduce((a, b) => a + parseFloat(b.rating), 0) / checkins.length).toFixed(2);
  stats.medianRating = checkins.sort((a, b) => a.rating - b.rating)[Math.floor(checkins.length / 2)].rating;
  stats.lowestRating = Math.min(...checkins.map((checkin) => checkin.rating));
  stats.highestRating = Math.max(...checkins.map((checkin) => checkin.rating));
  stats.breweryList = mapBreweryList(breweryRatingList);
  stats.alcoholFreePercentage = ((stats.alcoholFreeCheckins / stats.totalCheckins) * 100).toFixed(2);
  stats.alcoholDistribution = sort(stats.alcoholDistribution);
  stats.alcoholPercentageDistribution = Object.fromEntries(Object.entries(stats.alcoholDistribution).map(([key, value]) => [ key, ((value / stats.totalCheckins) * 100).toFixed(2)]));
  stats.breweryCountries = sort(stats.breweryCountries);
  stats.breweryCounts = sort(stats.breweryCounts);
  stats.breweryStyleCounts = sort(stats.breweryStyleCounts);
  stats.globalRatingDistribution = sortByKey(stats.globalRatingDistribution);
  stats.ibuDistribution = sort(stats.ibuDistribution);
  stats.ratingDistribution = sortByKey(stats.ratingDistribution);
  stats.servingCounts = sort(stats.servingCounts);
  stats.styleCategoryPercentages = Object.fromEntries(Object.entries(stats.styleCategoryCounts).map(([key, value]) => [ key, ((value / stats.totalCheckins) * 100).toFixed(2)]));
  stats.styleCounts = sort(stats.styleCounts);
  stats.venueCountries = sort(stats.venueCountries);
  stats.venueCounts = sort(stats.venueCounts);
  stats.venueTypeCounts = sort(stats.venueTypeCounts);
  stats.mapsKey = fs.readFileSync("data/googlemaps.key", "utf8").trim();

  fs.writeFileSync(`public/stats/data/${user.displayname}.json`, JSON.stringify(stats, null, 2));
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
  aggregate(stats.breweryStyleCounts, brewery.style);
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
    const numberOfRatings = brewery.rating.length;
    brewery['average-rating'] = (brewery.rating.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / numberOfRatings).toFixed(2);
    brewery['number-of-ratings'] = numberOfRatings;
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
  if (accumulator[currentValue]) {
    accumulator[currentValue]++;
  } else {
    accumulator[currentValue] = 1;
  }
}

function sort(accumulator) {
  return Object.fromEntries(Object.entries(accumulator).sort(([, a], [, b]) => b - a));
}

function sortByKey(accumulator) {
  return Object.fromEntries(Object.entries(accumulator).sort((a, b) => a[0] - b[0]));
}