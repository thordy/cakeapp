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
	connection.query('SELECT id, name, games_won, games_played FROM player', function (error, rows, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  res.render('players', {players: rows});
	});
});

module.exports = router