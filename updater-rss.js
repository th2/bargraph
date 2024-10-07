const Parser = require('rss-parser');
const parser = new Parser();
const fs = require('fs');

const processUser = async (user) => {
    let allCheckins = cleanCheckins(JSON.parse(fs.readFileSync(`data/unique-${user.username}.json`, 'utf8')));
    let feed = await parser.parseURL(user.updateUrl);
    feed.items.reverse().forEach(item => {
        var beer_name = removeWhitespace(item.title.substring(item.title.indexOf('is drinking a') + 14, item.title.indexOf(' by  ')));
        var brewery_name = removeWhitespace(item.title.substring(item.title.indexOf(' by  ') + 5).split(' at ')[0]);
        var foundInCheckins = allCheckins.some(previousCheckin => beer_name === previousCheckin.beer_name && brewery_name === previousCheckin.brewery_name);
        if (!foundInCheckins) {
            console.log('new checkin found: ' + item.isoDate + '|' + beer_name + '|' + brewery_name);
            allCheckins.unshift({
                "beer_name": beer_name,
                "brewery_name": brewery_name,
                "created_at": item.isoDate
            });
        }
    })
    fs.writeFileSync(`data/unique-${user.username}.json`, JSON.stringify(allCheckins));
    console.log('updated ' + user.displayname);
}

const cleanCheckins = (checkins) => {
    return checkins.map(item => {
        item.beer_name = removeWhitespace(item.beer_name);
        item.brewery_name = removeWhitespace(item.brewery_name);
        return item;
    });
}

const removeWhitespace = (str) => str.replace(/\s+/g, ' ').trim();

const processUsers = async (users) => {
    for (const user of users) {
        if (user.updateUrl) {
            await processUser(user);
        }
    }
}

module.exports.run = (users, callback) => {
    processUsers(users)
        .then(() => {
            fs.writeFileSync(`data/lastupdate.json`, new Date().toISOString())
            console.log('all users updated successfully');
            callback();
        })
        .catch((error) => {
            console.error('error updating users:', error);
            callback();
        });
}