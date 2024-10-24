const fs = require("fs");
const users = require("../data/users.json");
const beers = require(`../data/beers.json`);
const breweries = require(`../data/breweries.json`);
const venues = require(`../data/venues.json`);

module.exports.run = (callback) => {
  users.forEach((user) => generateProfile(user));

  callback();
};

function generateProfile(user) {
  const checkins = require(`../data/checkins-${user.username}.json`);
  const uniqueBeers = [];
  const profile = {
    displayname: user.displayname,
    totalCheckins: checkins.length,
    uniqueBeers: 0,
    alcoholFreeCheckins: 0,
    alcoholFreePercentage: 0,
    alcoholDistribution: {},
    breweryCountries: {},
    breweryDistribution: {},
    breweryStyleDistribution: {},
    globalRatingDistribution: {},
    ibuDistribution: {},
    ratingDistribution: {},
    servingDistribution: {},
    styleCategoryDistribution: {},
    styleDistribution: {},
    venueCountries: {},
    venueDistribution: {},
    venueTypeDistribution: {}
  };

  checkins.forEach((checkin) => {
    const beer = beers.find((beer) => beer.link === checkin.beerLink);
    if (!beer) {
      console.log(`Beer not found: ${checkin.beerLink}`);
      return;
    }

    if (!uniqueBeers.includes(beer.name)) uniqueBeers.push(beer.name);
    if (isAlcoholFree(beer)) profile.alcoholFreeCheckins++;
    
    aggregate(profile.alcoholDistribution, getAbv(beer));
    aggregateBreweryData(checkin, profile);
    aggregate(profile.breweryDistribution, checkin.brewery);
    aggregate(profile.globalRatingDistribution, Math.round(beer.stats.rating * 10) / 10);
    aggregate(profile.ibuDistribution, beer.ibu);
    aggregate(profile.ratingDistribution, checkin.rating);
    aggregate(profile.servingDistribution, checkin.serving.trim());
    aggregate(profile.styleCategoryDistribution, beer.style.split(" - ")[0]);
    aggregate(profile.styleDistribution, beer.style);
    addToVenueData(checkin, profile);
    aggregate(profile.venueDistribution, checkin.venue);
  });

  profile.uniqueBeers = uniqueBeers.length;
  profile.alcoholFreePercentage = ((profile.alcoholFreeCheckins / profile.totalCheckins) * 100).toFixed(2);
  profile.alcoholDistribution = sort(profile.alcoholDistribution);
  profile.breweryCountries = sort(profile.breweryCountries);
  profile.breweryDistribution = sort(profile.breweryDistribution);
  profile.breweryStyleDistribution = sort(profile.breweryStyleDistribution);
  profile.globalRatingDistribution = sort(profile.globalRatingDistribution);
  profile.ibuDistribution = sort(profile.ibuDistribution);
  profile.ratingDistribution = sort(profile.ratingDistribution);
  profile.servingDistribution = sort(profile.servingDistribution);
  profile.styleCategoryDistribution = sort(profile.styleCategoryDistribution);
  profile.styleDistribution = sort(profile.styleDistribution);
  profile.venueCountries = sort(profile.venueCountries);
  profile.venueDistribution = sort(profile.venueDistribution);
  profile.venueTypeDistribution = sort(profile.venueTypeDistribution);

  fs.writeFileSync(`public/profile/data/${user.displayname}.json`, JSON.stringify(profile, null, 2));
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

function aggregateBreweryData(checkin, profile) {
  const brewery = breweries.find((brewery) => brewery.link === checkin.breweryLink);
  if (!brewery) {
    console.log(`Brewery not found: ${checkin.breweryLink}`);
    return;
  }
  aggregate(profile.breweryCountries, getCountry(brewery));
  aggregate(profile.breweryStyleDistribution, brewery.style);
}

function addToVenueData(checkin, profile) {
  if (!checkin.venueLink || checkin.venueLink === "/v/at-home/9917985") return;
  const venue = venues.find((venue) => venue.link === checkin.venueLink);
  if (!venue) {
    console.log(`Venue not found: ${checkin.venueLink}`);
    return;
  }
  venue.type.split(", ").forEach((type) => aggregate(profile.venueTypeDistribution, type));
  if (!venue.osm_country) {
    console.log(`Venue country not found: ${checkin.venueLink}`);
    return;
  }
  aggregate(profile.venueCountries, venue.osm_country);
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