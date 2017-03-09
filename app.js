var express = require('express');
var bodyParser = require('body-parser');
var app = express();

// Setup mongoose and database connection
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/darts');

// Register all the routes
var matchController = require('./controller/match_controller');
var cakeController = require('./controller/cake_controller');
var playerController = require('./controller/player_controller');
app.use('/match', matchController);
app.use('/cake', cakeController);
app.use('/player', playerController)

app.use(bodyParser.json()); // Accept incoming JSON entities
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(errorHandler);

function errorHandler (err, req, res, next) {
  res.status(500)
  res.send({ error: err })
}

/* Default route serving index.pug page */
app.get('/', function (req, res) {
  var Player = require('./models/Player');
  Player.find({}, function(err, players) {
    if (err) throw err;
    res.render('index', {players: players});
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


