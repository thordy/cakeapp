var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'developer',
  password : 'abcd1234',
  database : 'cakedarts'
});

// Register all the routes
var match = require('./match');
var cake = require('./cake');
var player = require('./players');
app.use('/match', match);
app.use('/cake', cake);
app.use('/player', player)

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

/* Default route serving index.pug page */
app.get('/', function (req, res) {
	connection.query('SELECT id, name, games_won, games_played FROM player', function (error, rows, fields) {
		if (error) {
  			return sendError(error, res);
  		}
		res.render('index', { players: rows});
	});
});

/* Catch all route used to display custom 404 page */
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


