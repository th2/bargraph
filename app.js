const express = require('express')()
const path = require('path')
const fs = require('fs')
const users = require('./data/users.json')

express.get('/', (req, res) => res.sendFile('chart.html', {root: path.join(__dirname)}))
express.get('/users', (req, res) => res.send(users))
express.get('/checkins/*', (req, res) => res.send(getCheckins(req.params[0])))
express.get('/data', (req, res) => res.send(getData()))
express.listen(8888)

function getCheckins(username) {
    return 'todo'
}

function getData() {
    return users.map(user => {
        const uniqueCheckins = JSON.parse(fs.readFileSync(`data/unique-${user.username}.json`, 'utf8')).reverse()
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