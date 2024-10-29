const fs = require("fs");
const sleepBetweenRequests = 1000;
const googlemapskey = fs.readFileSync("data/googlemaps.key", "utf8").trim();
const queryUrl = `https://maps.googleapis.com/maps/api/geocode/json?key=${googlemapskey}&address=`;

module.exports.run = (callback) => {
  console.log(googlemapskey);
  const breweries = require("../data/breweries.json");
  const breweriesToProcess = breweries.filter((brewery) => brewery.location === undefined && brewery.address !== undefined);
  
  processBreweries(breweriesToProcess)
    .then(() => {
      fs.writeFileSync("data/breweries.json", JSON.stringify(breweries, null, 2));
      console.log("✅ breweriesExtraGM");
      callback();
    })
    .catch((error) => {
      console.error("⚠️ breweriesExtraGM: error updating brewery osm data:", error);
      callback();
    });
};

const processBreweries = async (breweries) => {
  for (const brewery of breweries) {
    await processBrewery(brewery);
    await new Promise((resolve) => setTimeout(resolve, sleepBetweenRequests));
  }
};

const processBrewery = async (brewery) => {
  console.log(`breweriesExtraGM: processing ${brewery.name}`);
  const data = await fetchData(brewery);
  if (data.results.length > 1) {
    console.log(`multiple results for ${brewery.name}, ${brewery.address}`);
    const addressUrlEncoded = encodeURIComponent(brewery.name + ', ' + brewery.address);
    const url = `${queryUrl}${addressUrlEncoded}`;
    console.log(url);
    data.results.forEach(element => console.log(element.geometry.location, element.formatted_address));
    console.log();
  }
  brewery.location = data.results[0].geometry.location;
  console.log(brewery.location);
}

const fetchData = async (brewery) => {
  const addressUrlEncoded = encodeURIComponent(brewery.name + ', ' + brewery.address);
  const url = `${queryUrl}${addressUrlEncoded}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to get data for ${brewery.name}`);
  }
  const data = await response.json();
  if (data.length === 0) {
    throw new Error(`no data found for ${brewery.name}`);
  }
  if (data.status !== "OK") {
    throw new Error(`failed to get osm data for ${brewery.name}`);
  }
  return data;
}