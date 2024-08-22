# bargraph

# Getting Started
## Preparing the Data
- `cp -r example_data data` or provide your own
- Set correct values in `data/users.json` the rss key can be found in https://untappd.com/account/settings
- The checkins need to be manually scraped initaly, as the rss only contains the most recent 25 checkins. Do the following for every user you entered in `data/users.json`:
    1. Log in to Untapped on the web
    2. Load https://untappd.com/user/USERNAME/beers and open the JS-Console
    3. Paste the code below in the JS-Console and execute it. This will generate a file download. Put this file in the data directory. Depending on the amount of checkins this can take a while because the checkins have to be loaded first by simulating clicks on the "Show More" button.
    
```
    const download = (filename, text) => {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    const load = () => {
        if($('.more-list-items')[0].style.display !== "none") {  
            $('.more-list-items')[0].click(); 
            setTimeout(load, 1000);
        } else {
            var beers = [];
            $('.beer-item').each(function(i, beer) {
                beers[i] = {};
                var beerDetails = $(beer).find('.beer-details');
                var details = $(beer).find('.details');
                beers[i].beer_name = beerDetails.find('.name').text();
                beers[i].brewery_name = beerDetails.find('.brewery').text();
                beers[i].beer_type = beerDetails.find('.style').text();
                beers[i].rating_score = parseFloat(beerDetails.find('.ratings').find('.you p').html().replace("Their Rating (", "").replace(")", ""));
                beers[i].global_rating_score = parseFloat(beerDetails.find('.ratings').find('.you p').last().html().replace("Global Rating (", "").replace(")", ""));
                beers[i].beer_abv = parseFloat(details.find('.abv').html().trim().replace("% ABV", ""));
                beers[i].beer_ibu = parseFloat(details.find('.ibu').html().trim().replace(" IBU", ""));
                beers[i].beer_ibu = parseFloat(details.find('.ibu').html().trim().replace(" IBU", ""));
                beers[i].created_at = details.find('.date').find('abbr').html()
            });
            console.log(JSON.stringify(beers));
            download(`unique-${window.location.pathname.split('/')[2]}.json`, JSON.stringify(beers));
        }
    }
    load();
```

## Building and Starting
- `npm install`
- `node server`
