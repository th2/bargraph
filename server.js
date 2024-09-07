const express = require('express')
const cloudflare = require('cloudflare-express')
const app = express()
const path = require('path')
const fs = require('fs')
const users = require('./data/users.json')
const updaterRSS = require('./updater-rss.js')
const updaterDist = require('./updater-distance.js')
const logger = require('./logger')

app.use(cloudflare.restore({update_on_start:true}))
app.use(logger.visit())
app.get('/', (req, res) => res.sendFile('public/chart.html', {root: path.join(__dirname)}))
app.get('/users', (req, res) => res.send(users))
app.get('/checkins/*', (req, res) => res.send(getCheckins(req.params[0])))
app.get('/data', (req, res) => res.send(getData()))
app.get('/dataDistance', (req, res) => res.sendFile('data/distance.json', {root: path.join(__dirname)}, (err) => {if (err) res.send('[]') }))
app.get('/update', (req, res) => res.send(updaterRSS.run(users)))
app.get('/updated', (req, res) => res.send(updaterDist.run(users)))
app.get('/lastupdate', (req, res) => res.sendFile('data/lastupdate.json', {root: path.join(__dirname)}, (err) => {if (err) res.send('1970-01-01T00:00:00Z') }))
app.use('/', express.static('public'))
app.use(logger.error())
app.listen(process.env.PORT)

function getCheckins(username) {
    return 'todo'
}

function getData() {
    return users.map(user => {
        const uniqueCheckins = JSON.parse(fs.readFileSync(`data/unique-${user.username}.json`, 'utf8'))
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        var count = 0
        const dataCheckins = uniqueCheckins
            .map(checkin => {return { x:formatDate(checkin.created_at), y:++count }})
            .filter(data => data.x > "2019-01-01T22:00:00.000Z")
        return {
            "label": user.displayname,
            "backgroundColor": user.color,
            "borderColor": user.color,
            "data": dataCheckins,
            "stepped": true
        }
    })
}

function formatDate(date) {
    return new Date(date).toISOString()
}