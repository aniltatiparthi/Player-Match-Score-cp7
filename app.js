const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Success')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertPlayersToPascalCase = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

// API 1 Returns a list of all the players in the player table
app.get('/players/', async (request, response) => {
  const getPlayersDetailsQuery = `
  SELECT 
    *
  FROM 
    player_details`
  const playersDetails = await db.all(getPlayersDetailsQuery)
  console.log(playersDetails)
  response.send(playersDetails.map(i => convertPlayersToPascalCase(i)))
})

// API 2 Returns a specific player based on the player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetailsQuery = `
  SELECT
    *
  FROM 
    player_details
  WHERE
    player_id= ${playerId}`
  const playerDetails = await db.get(getPlayerDetailsQuery)
  response.send(convertPlayersToPascalCase(playerDetails))
})

// API 3 Updates the details of a specific player based on the player ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const details = request.body
  const {playerName} = details
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name= '${playerName}'
  WHERE 
    player_id= ${playerId}`
  const updatePlayer = await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

const convertMatchDetailsToPascalCase = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

// API 4 Returns the match details of a specific match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
  SELECT
    *
  FROM
    match_details
  WHERE
    match_id= ${matchId}`
  const matchDetails = await db.get(getMatchDetailsQuery)
  response.send(convertMatchDetailsToPascalCase(matchDetails))
})

// API 5 Returns a list of all the matches of a player
app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getAllMatchesOfPlayerQuery = `
  SELECT
    *
  FROM player_match_score 
    NATURAL JOIN match_details
  WHERE 
    player_id= ${playerId}`
  const playerMatchesDetails = await db.all(getAllMatchesOfPlayerQuery)
  response.send(
    playerMatchesDetails.map(i => convertMatchDetailsToPascalCase(i)),
  )
})

// API 6 Returns a list of players of a specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getAllPlayersOfMatchQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN player_details
    WHERE
      match_id= ${matchId}`
  const matchPlayersDetails = await db.all(getAllPlayersOfMatchQuery)
  response.send(matchPlayersDetails.map(i => convertPlayersToPascalCase(i)))
})

// API 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getStatsQuery = `
  SELECT
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
  FROM player_details
    INNER JOIN player_match_score
    ON player_match_score.player_id = player_details.player_id
  WHERE
    player_details.player_id= ${playerId}`
  const stats = await db.get(getStatsQuery)
  console.log(stats)
  response.send(stats)
})

module.exports = app
