var debug = require('debug')('dartapp:main');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var helper = require('./helpers.js');

// Register all the routes
//var socketHandler = require('./lib/socketHandler')(io);
//socketHandler.setupNamespace(123);
var matchController = require('./controller/match_controller')(io);
var gameController = require('./controller/game_controller')(io);
var cakeController = require('./controller/owes_controller');
var playerController = require('./controller/player_controller');
app.use('/match', matchController);
app.use('/game', gameController);
app.use('/cake', cakeController);
app.use('/player', playerController)

app.use(bodyParser.json()); // Accept incoming JSON entities
app.set('view engine', 'pug');
app.use(express.static('public'));

/** Entry point for application, main route */
app.get('/', function (req, res, next) {
  var Player = require('./models/Player');
  var GameType = require('./models/GameType');
	Player.fetchAll().then(function(players) {
      GameType.fetchAll().then(function(gameTypes) {
        res.render('index', {
          players: players.serialize(),
          gameTypes: gameTypes.serialize()
        });
      });
	})
  .catch(function(err) {
    helper.renderError(res, err);
	});
});

// Catch all route used to display custom 404 page
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

server.listen(3000, function () {
  debug('DartApp listening on port 3000');
});
