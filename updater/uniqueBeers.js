const fs = require("fs");
const https = require('https');
const users = require("../data/users.json");

module.exports.run = (callback) => {
  let beers = {
    list: [],
    users: [],
  };

  users.forEach((user) => {
    const userBeers = JSON.parse(
      fs.readFileSync(`data/unique-${user.username}.json`, "utf8")
    );

    beers.users.push({
      name: user.username,
      displayname: user.displayname,
    });

    userBeers
      .map((beer) => ({
          name: beer.brewery_name + ": "+ beer.beer_name,
          date: new Date(beer.created_at + " UTC"),
          firstDate: new Date(beer.created_at + " UTC"),
          detail: {
            beer_name: beer.beer_name,
            brewery_name: beer.brewery_name,
            beer_type: beer.beer_type,
            rating_score: beer.rating_score,
            global_rating_score: beer.global_rating_score,
            //beer_abv: beer.beer_abv,
            //beer_ibu: beer.beer_ibu,
          },
          users: [],
        }))
      .forEach((beer) => {
        const beerInList = beers.list.find((b) => b.name === beer.name);
        if (beerInList) {
          if (beerInList.firstDate > beer.date) {
            beerInList.firstDate = beer.date;
          }
          beerInList.users.push(makeBeerUser(beer, user));
        } else {
          beer.users = [makeBeerUser(beer, user)];
          beers.list.push(beer);
        }
      });
  });

  beers.list.sort((a, b) => {
    if (a.brewery_name < b.brewery_name) return -1;
    if (a.brewery_name > b.brewery_name) return 1;
    if (a.beer_name < b.beer_name) return -1;
    if (a.beer_name > b.beer_name) return 1;
    return 0;
  });

  fs.writeFileSync("public/data/uniqueBeers.json", JSON.stringify(beers), "utf8");
  console.log("uniqueBeers updated successfully");
  callback();
};

const makeBeerUser = (beer, user) => {
  return {
    name: user.username,
    date: beer.date,
    rating: beer.detail.rating_score,
  };
};
