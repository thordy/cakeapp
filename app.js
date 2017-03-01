var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'developer',
  password : 'password',
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
	res.render('index');
});

app.get('/match/:id', function (req, res) {
	var game = {};
	game.id = req.params.id;
	game.starting_score = 301;
	game.players = [{id: 1, name: 'Player 1'}, {id: 2, name: 'Player 2'}, {id: 3, name: 'Player 3'}];

	res.render('game', {game: game});
});

app.get('/players', function (req, res) {
	connection.query('SELECT id, name, games_won, games_played, (games_won/games_played) * 100 AS "win_percentage" FROM player', function (error, results, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  sendResponse(res, results, 200);
	});
});

app.listen(3000, function () {
  console.log('Cakeapp listening on port 3000')
});


