const Parser = require('rss-parser')
const parser = new Parser()
const fs = require('fs')

module.exports.run = (users) => {
    users.forEach(user => { if (user.updateUrl) {
        (async () => {
            const allCheckins = JSON.parse(fs.readFileSync(`data/unique-${user.username}.json`, 'utf8'))
            let feed = await parser.parseURL(user.updateUrl)
            feed.items.reverse().forEach(item => {
                var beer_name = item.title.substring(item.title.indexOf('is drinking a') + 14, item.title.indexOf(' by  ')).trim()
                var brewery_name = item.title.substring(item.title.indexOf(' by  ') + 5).split(' at ')[0].trim()
                var foundInCheckins = allCheckins.some(previousCheckin => beer_name === previousCheckin.beer_name && brewery_name === previousCheckin.brewery_name)
                if (!foundInCheckins) {
                    console.log('new checkin found: ' + item.isoDate + '|' + beer_name + '|' + brewery_name)
                    allCheckins.unshift({
                        "beer_name": beer_name,
                        "brewery_name": brewery_name,
                        "created_at": item.isoDate
                    })
                }
            })
            fs.writeFileSync(`data/unique-${user.username}.json`, JSON.stringify(allCheckins))
            console.log('updated ' + user.displayname)
          })()
    }})
    fs.writeFileSync(`data/lastupdate.json`, new Date().toISOString())

    return 'ok. <a href="/">back</a>'
}