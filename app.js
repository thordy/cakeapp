var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var mysql = require('mysql');
var moment = require('moment');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'developer',
  password : 'abcd1234',
  database : 'cakedarts'
});

// Register all the routes
var match = require('./match');
var cake = require('./cake');
app.use('/match', match);
app.use('/cake', cake);

app.use(bodyParser.json()); // Accept incoming JSON entities
app.set('view engine', 'pug');
app.use(express.static('public'));

app.use(errorHandler);

function errorHandler (err, req, res, next) {
  res.status(500)
  res.send({ error: err })
}

function sendError(error, res) {
	console.log(error);
	error.error_message = error.message;
  	res.status(500)
  		.send(error)
		.end();
}

function sendResponse(res, json, statusCode) {
	res.status(statusCode)
		.send(json)
		.end();
}
app.get('/', function (req, res) {
	var rows = [
		{id: 1, name: 'Test Player', games_won: 3, games_played: 12, win_percentage: 30},
		{id: 2, name: 'Test Player 2', games_won: 4, games_played: 11, win_percentage: 30}
	];
	res.render('index', {players: rows});

/*
	connection.query('SELECT id, name, games_won, games_played FROM player', function (error, rows, fields) {
		if (error) {
  			return sendError(error, res);
  		}
		res.render('index', { players: rows});
	});
*/
});

app.get('/players', function (req, res) {
	var rows = [
		{id: 1, name: 'Test Player', games_won: 3, games_played: 12, win_percentage: 30},
		{id: 2, name: 'Test Player 2', games_won: 4, games_played: 11, win_percentage: 30}
	];
	res.render('players', {players: rows});

	/*connection.query('SELECT id, name, games_won, games_played, (games_won/games_played) * 100 AS "win_percentage" FROM player', function (error, rows, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  res.render('players', {players: rows});
	});*/
});

app.get('/matches', function (req, res) {
	var rows = [];
	var match = {id: 1, start_time: '2017-03-04 17:51', end_time: '2017-03-04 18:23', starting_score: 301,
			winner: 'Player 1', players: ['Player 1', 'Player 2'], is_finished: true};
	rows.push(match);
	var match = {id: 2, start_time: '2017-03-04 17:51', starting_score: 301, players: ['Player 1', 'Player 2'], is_finished: false};
	rows.push(match);

	res.render('matches', {matches: rows});

	/*
	var query = 'SELECT m.id, m.start_time, m.end_time, m.starting_score, p.name AS "winner", GROUP_CONCAT(p2.name SEPARATOR ", ") AS "players" FROM matches m \
			JOIN match_players mp ON mp.match_id = m.id \
			JOIN player p ON p.id = m.winner_player_id \
			JOIN player p2 ON p2.id = mp.player_id \
			GROUP BY m.id ORDER BY m.id';
	connection.query(query, function (error, rows, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  for (var i = 0; i < rows.length; i++) {
	  	var row = rows[i];
		row.start_time = moment(row.start_time).format('YYYY-MM-DD HH:mm:ss z');
		row.end_time = moment(row.end_time).format('YYYY-MM-DD HH:mm:ss z');
	  }
	  res.render('matches', {matches: rows});
	});
	*/
});


app.get('/game', function (req, res) {
	var game = {};
	game.isOver = true;
	game.winner = 'Player 1';
	res.render('game', {
		locals: { game: game }
	});
});

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

app.listen(3000, function () {
  console.log('Cakeapp listening on port 3000')
});


