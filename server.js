const express = require('express')
const engine = require('ejs-mate')
const app = express()
const port = 8080

const Category = require('./models/category.js')
const Game = require('./models/game.js')
const Player = require('./models/player.js')
const Results = require('./models/results.js')

const gameAndMarkingPageRoutes = require('./routes/game_marking-page routes.js')
const categoryRoutes = require('./routes/category_routes.js')
const resultsRoutes = require('./routes/result_routes.js')

const { Pool } = require('pg')
const db = new Pool({
    database: 'gamenight',
    password: 'test'
})

let session = require('express-session')


app.use(express.static('client'))
app.engine('ejs', engine)
app.set('view engine', 'ejs')


// assign it in req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: 'susan swan',
    resave: true,
    saveUninitialized: true
}))

app.get('/', (req, res) => {
    // console.log(req)
    res.render('index')
})

/*
TO DO
-------
In app.get('/host) (called from index.ejs HOSTSIDE)
Using SQL we have inserted host values
Now we need to insert a GAME 
UPDATE the players to add game_id value (or alternatively make GAME first)

.then Figure out
How to parse into the right lobby
eg. localhost:8080/lobby/7
eg. localhost:8080/lobby/gameName
*/

app.get('/host', (req, res) => {
    var gameName = req.query.gameName
    var displayName = req.query.displayName
    console.log(req.query)

    db.query(`INSERT INTO players (display_name, host) VALUES ($1, $2) RETURNING *;`, [req.query.displayName, true], (err, dbRes) => {
        console.log(dbRes.rows)
        //generate session.user_id
        req.session.user_id = dbRes.rows[0].player_id


        //res.redirect('/lobby') REDIRECT TO LOBBY:ID 
    })
    // db.query(`INSERT INTO games (name, rounds) VALUES ($1, $2) RETURNING *;`, [req.query.gameName], (err, dbRes) => {
    //     console.log(dbRes.rows)
    // })
    res.redirect(`/lobby/${gameName}`, {})
})

app.get('/join-game', (req, res) => {
    //insert into the players table the display name and generate a session.user id

    //not worrying about game id at this stage (one game mode)

    db.query(`INSERT INTO players (display_name) VALUES ($1) RETURNING *;`, [req.query.displayName], (err, dbRes) => {

        //generate session.user_id
        req.session.user_id = dbRes.rows[0].player_id


        res.redirect('/lobby')
    })
})

// app.get('/lobby/:id') or
app.get('/lobby/:id', (req, res) => {
    gameName = req.params.id
    req.session.user_id = 4 // Hard coded session user_id

    db.query(`SELECT * FROM players WHERE game_id = ${gameName}`, (err, dbRes) => {
        console.log(dbRes)
        res.render('lobby', { players: dbRes.rows, user_id: req.session.user_id, gameName: gameName })

    })
})


app.get('/lobby', (req, res) => {

    db.query(`SELECT * FROM players;`, (err, dbRes) => {

        res.render('lobby')
    })
})




app.get('/api/lobby', (req, res) => {

    db.query(`UPDATE players SET last_request = NOW() WHERE player_id = $1 RETURNING *;`, [req.session.user_id], (err, dbRes) => {

        db.query(`SELECT * FROM players WHERE last_request > NOW() - interval '4 seconds' ORDER BY player_id;`, (err, dbRes) => {

            res.json({ players: dbRes.rows })
        })
    })


})


app.use(gameAndMarkingPageRoutes)

app.use('/api', categoryRoutes)

app.use('/', resultsRoutes)

app.listen(port, () => {
    console.log('listening on port ' + port)
})
