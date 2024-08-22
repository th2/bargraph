const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const users = require('./data/users.json')
const updater = require('./updater-rss.js')

app.get('/', (req, res) => res.sendFile('public/chart.html', {root: path.join(__dirname)}))
app.get('/users', (req, res) => res.send(users))
app.get('/checkins/*', (req, res) => res.send(getCheckins(req.params[0])))
app.get('/data', (req, res) => res.send(getData()))
app.get('/update', (req, res) => res.send(updater.run(users)))
app.use('/', express.static('public'))
app.listen(8888)

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