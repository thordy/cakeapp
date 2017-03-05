var express = require('express')
var bodyParser = require('body-parser')
var router = express.Router()
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'developer',
  password : 'abcd1234',
  database : 'cakedarts'
});

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded( {extended: true} ));

/* Render the match view */
router.post('/', function (req, res) {
	console.log('Adding player')
	
	res.redirect('/player');
});

router.get('/list', function (req, res) {
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

module.exports = router