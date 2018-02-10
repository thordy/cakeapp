var debug = require('debug')('kcapp:match-controller');

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const moment = require('moment');
const helper = require('../helpers.js');
const _ = require('underscore');

const axios = require('axios');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Render the match view (button entry) */
router.get('/:id', function (req, res) {
	renderMatchView('match/button_entry', req, res);
});

/** Render the match view (keyboard entry) */
router.get('/:id/keyboard', function (req, res) {
	renderMatchView('match/keyboard_entry', req, res);
});

/** Render the match view (player view) */
router.get('/:id/player', function (req, res) {
	renderMatchView('match/player_view', req, res);
});

/* Render the match spectate view */
router.get('/:id/spectate', function (req, res) {
	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var playersMap = response.data;
			axios.get('http://localhost:8001/match/' + req.params.id)
				.then(response => {
					var match = response.data;
					axios.get('http://localhost:8001/game/' + match.game_id)
						.then(response => {
							var game = response.data;
							axios.get('http://localhost:8001/match/' + req.params.id + '/players')
								.then(response => {
									var matchPlayers = response.data;
									res.render('match/spectate', { match: match, players: playersMap, game: game, match_players: matchPlayers });
								}).catch(error => {
							    	debug('Error when getting match players: ' + error);
									helper.renderError(res, error);
								});
						}).catch(error => {
					    	debug('Error when getting game: ' + error);
							helper.renderError(res, error);
						});
				}).catch(error => {
			    	debug('Error when getting match: ' + error);
					helper.renderError(res, error);
				});
		}).catch(function (error) {
	    	debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		});
});

/* Method for getting results for a given leg */
router.get('/:id/leg', function (req, res) {
	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var playersMap = response.data;
			axios.get('http://localhost:8001/match/' + req.params.id)
				.then(response => {
					var match = response.data;
					axios.get('http://localhost:8001/match/' + req.params.id + '/statistics')
						.then(response => {
							var stats = response.data;
							axios.get('http://localhost:8001/game/' + match.game_id)
								.then(response => {
									var game = response.data;
									res.render('leg_result', { match: match, players: playersMap, stats: stats, game: game });
								}).catch(error => {
							    	debug('Error when getting game: ' + error);
									helper.renderError(res, error);
								});
						}).catch(error => {
					    	debug('Error when getting statistics: ' + error);
							helper.renderError(res, error);
						});
				}).catch(error => {
			    	debug('Error when getting match: ' + error);
					helper.renderError(res, error);
				});
		}).catch(function (error) {
	    	debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		});
});

/* Delete the given visit */
router.delete('/:id/leg/:visitid', function (req, res) {
	axios.delete('http://localhost:8001/visit/' + req.params.visitid)
		.then(response => {
			res.status(200).send().end();
		}).catch(error => {
			debug('Unable to set current player: %s', err);
			helper.renderError(res, error);
		});
});

/* Modify the score */
router.post('/:id/leg', function (req, res) {
	axios.put('http://localhost:8001/visit/' + req.body.id + '/modify', req.body)
		.then(response => {
			res.status(200).end();
		}).catch(error => {
	    	debug('Error when modifying scores: ' + error);
			helper.renderError(res, error);
		});
});

/* Method to cancel a match in progress */
router.delete('/:id/cancel', function (req, res) {
	var matchId = req.params.id;
	new Game({ current_match_id: matchId })
		.fetch()
		.then(function (row) {
			const game = row.serialize();
			const gameId = game.id;
			Match.forge({ id: matchId })
				.destroy()
				.then(function (match) {
					debug('Cancelled match %s', matchId);

					new Match()
						.where('game_id', '=', gameId)
						.fetchAll()
						.then(function (rows) {
							const matches = rows.serialize()
							if (matches.length === 0) {
								// No matches left, delete game
								Game.forge({ id: gameId })
									.destroy()
									.then(function (row) {
										debug('Cancelled game %s', gameId);
										res.status(204)
											.send()
											.end();
									})
									.catch(function (err) {
										helper.renderError(res, err);
								});
							}
							else {
								Bookshelf.knex.raw(`
									UPDATE game SET current_match_id = (SELECT MAX(id) FROM \`match\` WHERE game_id = :game_id AND is_finished = 1) WHERE id = :game_id`, { game_id: gameId })
								.then(function(rows) {
									res.status(204)
										.send()
										.end();
								})
								.catch(function (err) {
									helper.renderError(res, err);
								});
							}
						})
						.catch(function (err) {
							helper.renderError(res, err);
					});
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
	});
});

/* Method to finalize a match */
router.post('/:id/finish', function (req, res) {
	axios.put('http://localhost:8001/match/' + req.params.id + '/finish', req.body)
		.then(response => {
			res.status(200).end();
		}).catch(error => {
	    	debug('Unable to finish game: ' + error);
			helper.renderError(res, error);
		});
});

/** Method to change player order */
router.put('/:id/order', function(req, res) {
	axios.put('http://localhost:8001/match/' + req.params.id + '/order', req.body)
		.then(response => {
			res.status(200).end();
		}).catch(error => {
			debug('Unable to change order: %s', error);
			helper.renderError(res, error);
		});
});

/** TODO Comments */
function renderMatchView(pugFile, req, res) {
	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var playersMap = response.data;
			axios.get('http://localhost:8001/match/' + req.params.id)
				.then(response => {
					var match = response.data;
					axios.get('http://localhost:8001/game/' + match.game_id)
						.then(response => {
							var game = response.data;
							axios.get('http://localhost:8001/match/' + req.params.id + '/players')
								.then(response => {
									var matchPlayers = response.data;
									// Sort players based on order
									matchPlayers = _.sortBy(matchPlayers, (player) => player.order )
									res.render(pugFile, { match: match, players: playersMap, game: game, match_players: matchPlayers });
								}).catch(error => {
							    	debug('Error when getting match players: ' + error);
									helper.renderError(res, error);
								});
						}).catch(error => {
					    	debug('Error when getting game: ' + error);
							helper.renderError(res, error);
						});
				}).catch(error => {
			    	debug('Error when getting match: ' + error);
					helper.renderError(res, error);
				});
		}).catch(function (error) {
	    	debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		});
}

module.exports = function (socketHandler) {
	this.socketHandler = socketHandler;

	// Create socket.io namespaces for all matches which are currently active
	axios.get('http://localhost:8001/match/active')
		.then(response => {
			var matches = response.data;
			for (var i = 0; i < matches.length; i++) {
				socketHandler.setupNamespace(matches[i].id);
			}
		}).catch(error => {
	    	debug('Unable to get active matches: %s', error);
		});
	return router;
};