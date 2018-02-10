var debug = require('debug')('dartapp:main');

var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var helper = require('./helpers.js');

// Register all the routes
const socketHandler = require('./lib/socketHandler')(io);

const matchController = require('./controller/match_controller')(socketHandler);
const gameController = require('./controller/game_controller')(socketHandler);
const cakeController = require('./controller/owes_controller');
const playerController = require('./controller/player_controller');
const statisticsController = require('./controller/statistics_controller');
app.use('/match', matchController);
app.use('/game', gameController);
app.use('/cake', cakeController);
app.use('/player', playerController);
app.use('/statistics', statisticsController);

const axios = require('axios');

app.use(bodyParser.json()); // Accept incoming JSON entities
app.use(compression());  // Enable gzip Compression
app.set('view engine', 'pug');
app.use(express.static('public'));

app.locals.moment = require('moment');

/** Entry point for application, main route */
app.get('/', function (req, res, next) {
  axios.get('http://localhost:8001/player')
    .then(response => {
      var players = response.data
      axios.get('http://localhost:8001/gametype')
        .then(response => {
          var gameTypes = response.data;
          axios.get('http://localhost:8001/owetype')
            .then(response => {
              var oweTypes = response.data;
              res.render('index', { players: players, game_types: gameTypes, owe_types: oweTypes });
            }).catch(error => {
              debug('Error when getting owe types: ' + error);
              helper.renderError(res, error);
            });          
        }).catch(error => {
         	debug('Error when getting game types: ' + error);
          helper.renderError(res, error);
        });      
    }).catch(error => {
      debug('Error when getting match players: ' + error);
      helper.renderError(res, error);
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
  debug('kcapp listening on port 3000');
});
