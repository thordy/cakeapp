const debug = require('debug')('kcapp:game-controller');

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const helper = require('../helpers.js');
const _ = require('underscore');

const axios = require('axios');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

/* Get a list of all games */
router.get('/list', function (req, res) {
	axios.get('http://localhost:8001/game')
		.then(response => {
			var games = response.data;
			axios.get('http://localhost:8001/player')
				.then(response => {
					var players = response.data;
					res.render('games', { games: games, players: players });
				})
				.catch(error => {
				    debug('Error when getting players: ' + error);
					helper.renderError(res, error);
	            });
		}).catch(error => {
			debug('Error when getting games: ' + error);
			helper.renderError(res, error);
		});
});

/** Continue the given game */
router.get('/:gameid', function (req, res) {
	axios.get('http://localhost:8001/game/' + req.params.gameid)
		.then(response => {
			var game = response.data
			axios.put('http://localhost:8001/game/' + req.params.gameid + '/continue')
				.then(response => {
					var match = response.data;
					socketHandler.setupNamespace(match.id);

					// Forward all spectating clients to next match
					socketHandler.emitMessage(game.current_match_id, 'match_finished', {
						old_match_id: game.current_match_id,
						new_match_id: match.id
					});
					res.redirect('/match/' + match.id);
				}).catch(error => {
				    debug('Unable to continue match: ' + error);
					res.redirect('/game/' + req.params.gameid + '/results');
	            });
		}).catch(error => {
		    debug('Error when getting game: ' + error);
			helper.renderError(res, error)
		});
});

/* Spectate the given game */
router.get('/:gameid/spectate', function (req, res) {
	axios.get('http://localhost:8001/game/' + req.params.gameid)
	.then(response => {
		var game = response.data;
		res.redirect('/match/' + game.current_match_id + '/spectate');
	  }).catch(error => {
	    debug('Error when getting game: ' + error);
		helper.renderError(res, error);
	  });
});

/* Render the results view */
router.get('/:id/results', function (req, res) {
	var id = req.params.id;
	axios.get('http://localhost:8001/game/' + id)
		.then(response => {
			var game = response.data;
			axios.get('http://localhost:8001/player')
				.then(response => {
					var players = response.data;
					axios.get('http://localhost:8001/game/' + id + '/statistics')
						.then(response => {
							var stats = response.data;
							res.render('game_result', { game: game, players: players, stats: stats });
						  }).catch(error => {
						    debug('Error when getting statistics: ' + error);
							helper.renderError(res, error);
						  });
				  }).catch(error => {
				    debug('Error when getting players: ' + error);
					helper.renderError(res, error);
				  });
		  }).catch(error => {
		    debug('Error when getting game: ' + error);
			helper.renderError(res, error);
		  });
});

/* Method for starting a new game */
router.post('/new', function (req, res) {
	var players = req.body.players;
	if (players === undefined) {
		debug('No players specified, unable to start match');
		return res.redirect('/');
	}
	if (players.constructor !== Array) {
		// If this is only a single player players is sent as a String, so make it an
		// array so that we select from the array instead of a substring below
		players = [ players ];
	}
	var body = {
		owe_type_id: req.body.gameStake == 0 ? null : parseInt(req.body.gameStake),
		game_type: { id: parseInt(req.body.gameType) },
		players: players.map(Number),
		matches: [ { starting_score: parseInt(req.body.startingScore) }]
	}
	axios.post('http://localhost:8001/game', body)
		.then(response => {
			var game = response.data;
			socketHandler.setupNamespace(game.current_match_id);
			res.redirect('/match/' + game.current_match_id);
		}).catch(error => {
			debug('Error when getting statistics: ' + error);
			helper.renderError(res, error);
		});
});

module.exports = function (socketHandler) {
	this.socketHandler = socketHandler;
	return router;
};