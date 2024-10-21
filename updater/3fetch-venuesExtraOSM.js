const fs = require("fs");
const sleepBetweenRequests = 1000;
const userAgent = "Bargraph Updater (https://github.com/th2/bargraph)";
const queryUrl = "https://nominatim.openstreetmap.org/search?format=jsonv2&q=";

module.exports.run = (callback) => {
  const venues = require("../data/venues.json");
  const venuesToProcess = venues.filter((venue) => venue.osm_display_name === undefined && venue.map_coordinates !== undefined);
  processVenues(venuesToProcess)
    .then(() => {
      fs.writeFileSync("data/venues.json", JSON.stringify(venues, null, 2));
      console.log("✅ venuesExtraOSM");
      callback();
    })
    .catch((error) => {
      console.error("⚠️ venuesExtraOSM: error updating venue osm data:", error);
      callback();
    });
};

const processVenues = async (venues) => {
  for (const venue of venues) {
    await processVenue(venue);
    await new Promise((resolve) => setTimeout(resolve, sleepBetweenRequests));
  }
};

const processVenue = async (venue) => {
  console.log(`venuesExtraOSM: processing ${venue.name}`);
  const osmData = await getOsmData(venue.map_coordinates);
  venue.osm_display_name = osmData.display_name;
  venue.osm_country = osmData.display_name.split(", ").pop();
  venue.osm_category = osmData.category;
  venue.osm_type = osmData.type;
  venue.osm_addresstype = osmData.addresstype;
};

const getOsmData = async (coordinates) => {
  const url = `${queryUrl}${coordinates}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
    },
  });
  if (!response.ok) {
    throw new Error(`failed to get osm data for ${coordinates}`);
  }
  const data = await response.json();
  if (data.length === 0) {
    throw new Error(`no osm data found for ${coordinates}`);
  }
  return data[0];
}