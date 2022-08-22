const Parser = require('rss-parser')
const parser = new Parser()
const fs = require('fs')

module.exports.run = (users) => {
    users.forEach(user => { if (user.updateUrl) {
        (async () => {
            const previousCheckins = JSON.parse(fs.readFileSync(`data/unique-${user.username}.json`, 'utf8'))
            let feed = await parser.parseURL(user.updateUrl)
            feed.items.reverse().forEach(item => {
                var beer_name = item.title.substring(item.title.indexOf('is drinking a') + 14, item.title.indexOf(' by  ')).trim()
                var brewery_name = item.title.substring(item.title.indexOf(' by  ') + 5, item.title.indexOf(' at ')).trim()
                var location = item.title.substring(item.title.indexOf(' at ') + 4).trim()
                var foundInCheckins = previousCheckins.some(previousCheckin => beer_name === previousCheckin.beer_name && brewery_name === previousCheckin.brewery_name)
                if (!foundInCheckins) {
                    console.log('new checkin found: ' + item.isoDate + '|' + beer_name + '|' + brewery_name  + '|' + location)
                    previousCheckins.unshift({
                        "beer_name": beer_name,
                        "brewery_name": brewery_name,
                        "location": location,
                        "created_at": item.isoDate
                    })
                }
            })
            fs.writeFileSync(`data/unique-${user.username}.json`, JSON.stringify(previousCheckins))
            console.log('updated ' + user.displayname)
          })()
    }})

    return 'ok'
}