var debug = require('debug')('dartapp:match-controller');

var express = require('express');
var bodyParser = require('body-parser');
var Bookshelf = require.main.require('./bookshelf.js');
var router = express.Router();
var moment = require('moment');
var Player = require.main.require('./models/Player');
var Match = require.main.require('./models/Match');
var Game = require.main.require('./models/Game');
var Score = require.main.require('./models/Score');
var Player2match = require.main.require('./models/Player2match');
var StatisticsX01 = require.main.require('./models/StatisticsX01');
var helper = require('../helpers.js');
var _ = require('underscore');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

/* Get a list of all matches */
router.get('/list', function (req, res) {
	// Get collection of matches
	var Matches = Bookshelf.Collection.extend({ model: Match });

	// Fetch related players
	new Matches()
		.fetch({
			withRelated: [
				'players',
				'game',
				'game.game_type',
			]
		})
		.then(function (rows) {
			var matches = rows.serialize();
			var players = {};
			for (var i = 0; i < matches.length; i++) {
				var match = matches[i];
				for (var j = 0; j < match.players.length; j++){
					var player = match.players[j];
					players[player.id] = { name: player.name }
				}
			}
			res.render('matches', {
				matches: matches,
				players: players,
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Render the match view */
router.get('/:id', function (req, res) {
	new Match().getMatch(req.params.id, function(err, match) {
		if (err) {
			return helper.renderError(res, err);
		}

		var players = match.related('players').serialize();
		var scores = match.related('scores').serialize();
		var match = match.serialize();

		if (match.is_finished) {
			// Do not allow to see match board if it is finished, redirect to that match results
			res.redirect('/match/' + match.id + '/results');
		}
		else {
			// Calculate remaining score and some statistics for each player
			var playersMap = new Player().getPlayersMap(scores, match, players);

			knex = Bookshelf.knex;
			knex('match')
			.select(knex.raw(`
				match.winner_id,
				count(match.winner_id) as wins,
				game_type.matches_required`
			))
			.where(knex.raw('match.game_id = ?', [match.game_id]))
			.join(knex.raw('game on game.id = match.game_id'))
			.join(knex.raw('game_type on game_type.id = game.game_type_id'))
			.groupBy('match.winner_id')
			.orderByRaw('count(match.winner_id) DESC')
			.then(function(rows) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].winner_id) {
						var playerId = rows[i].winner_id;
						var wins = rows[i].wins;
						var player = playersMap['p' + playerId];
						player.wins = wins;
						for (var j = 0; j < wins; j++) {
							player.wins_string += '*';
						}
					}
				}

				// Set all scores and round number
				scores = _.filter(scores, (score) => !scores.is_bust);
				match.scores = scores;
				match.round_number = Math.floor(scores.length / players.length) + 1;
				res.render('match_socket', {
					match: match,
					players: playersMap,
					game: match.game,
					game_type: match.game.game_type,
				});
			})
			.catch(function (err) {
				helper.renderError(res, err);
			});
		}
	});
});

/* Render the match spectate view */
router.get('/:id/spectate', function (req, res) {
	new Match().getMatch(req.params.id, function(err, match) {
		if (err) {
			return helper.renderError(res, err);
		}

		var players = match.related('players').serialize();
		var scores = match.related('scores').serialize();
		var match = match.serialize();
		// Calculate remaining score and some statistics for each player
		var playersMap = new Player().getPlayersMap(scores, match, players);

		knex = Bookshelf.knex;
		knex('match')
		.select(knex.raw(`
			match.winner_id,
			count(match.winner_id) as wins,
			game_type.matches_required`
		))
		.where(knex.raw('match.game_id = ?', [match.game_id]))
		.join(knex.raw('game on game.id = match.game_id'))
		.join(knex.raw('game_type on game_type.id = game.game_type_id'))
		.groupBy('match.winner_id')
		.orderByRaw('count(match.winner_id) DESC')
		.then(function(rows) {
			for (var i = 0; i < rows.length; i++) {
				if (rows[i].winner_id) {
					var playerId = rows[i].winner_id;
					var wins = rows[i].wins;
					var player = playersMap['p' + playerId];
					player.wins = wins;
					for (var j = 0; j < wins; j++) {
						player.wins_string += '*';
					}
				}
			}

			// Set all scores and round number
			match.scores = scores;
			match.round_number = Math.floor(scores.length / players.length) + 1;
			res.render('match_spectate', {
				match: match,
				players: playersMap,
				game: match.game,
				visits: scores,
				game_type: match.game.game_type,
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
	});
});

/* Method for getting results for a given leg */
router.get('/:legid/leg', function (req, res) {
	new Match( { id: req.params.legid } )
		.fetch( { withRelated: ['players', 'statistics', 'scores', 'game', 'game.game_type'] } )
		.then(function (row) {
			if (row === null) {
				return helper.renderError(res, 'No match with id ' + req.params.legid + ' exists');
			}
			var players = row.related('players').serialize();
			var game = row.related('game').serialize();
			var statistics = row.related('statistics').serialize();
			var scores = row.related('scores').serialize();
			var playersMap = players.reduce(function ( map, player ) {
				map[player.id] = player;
				return map;
			}, {});
			var match = row.serialize();

			for (var i = 0; i < statistics.length; i++) {
				var stats = statistics[i];
				var player = playersMap[stats.player_id];
				player.remaining_score = match.starting_score;
				player.statistics = stats;
			}
			// Create a map of scores used to visualize throws in a heatmap
			var scoresMap = {
					'25': { '1': 0, '2': 0 },
					'20': { '1': 0, '2': 0, '3': 0 },
					'19': { '1': 0, '2': 0, '3': 0 },
					'18': { '1': 0, '2': 0, '3': 0 },
					'17': { '1': 0, '2': 0, '3': 0 },
					'16': { '1': 0, '2': 0, '3': 0 },
					'15': { '1': 0, '2': 0, '3': 0 },
					'14': { '1': 0, '2': 0, '3': 0 },
					'13': { '1': 0, '2': 0, '3': 0 },
					'12': { '1': 0, '2': 0, '3': 0 },
					'11': { '1': 0, '2': 0, '3': 0 },
					'10': { '1': 0, '2': 0, '3': 0 },
					'9': { '1': 0, '2': 0, '3': 0 },
					'8': { '1': 0, '2': 0, '3': 0 },
					'7': { '1': 0, '2': 0, '3': 0 },
					'6': { '1': 0, '2': 0, '3': 0 },
					'5': { '1': 0, '2': 0, '3': 0 },
					'4': { '1': 0, '2': 0, '3': 0 },
					'3': { '1': 0, '2': 0, '3': 0 },
					'2': { '1': 0, '2': 0, '3': 0 },
					'1': { '1': 0, '2': 0, '3': 0 },
					'0': { '1': 0 },
					totalThrows: 0
			}
			for (var i = 0; i < scores.length; i++) {
				var score = scores[i];
				if (score.first_dart !== null) {
					scoresMap[score.first_dart][score.first_dart_multiplier] += 1;
					scoresMap.totalThrows++;
				}
				if (score.second_dart !== null) {
					scoresMap[score.second_dart][score.second_dart_multiplier] += 1;
					scoresMap.totalThrows++;
				}
				if (score.third_dart !== null) {
					scoresMap[score.third_dart][score.third_dart_multiplier] += 1;
					scoresMap.totalThrows++;
				}
				if (score.is_bust !== 1) {
					var player = playersMap[score.player_id];
					player.remaining_score = player.remaining_score -
						((score.first_dart * score.first_dart_multiplier) + (score.second_dart * score.second_dart_multiplier) + (score.third_dart * score.third_dart_multiplier));
				}
			}
			knex = Bookshelf.knex;
			knex('match')
			.select(knex.raw(`
				match.winner_id,
				count(match.winner_id) as wins,
				game_type.matches_required`
			))
			.where(knex.raw('match.game_id = ?', [game.id]))
			.join(knex.raw('game on game.id = match.game_id'))
			.join(knex.raw('game_type on game_type.id = game.game_type_id'))
			.groupBy('match.winner_id')
			.orderByRaw('count(match.winner_id) DESC')
			.then(function(rows) {
				res.render('leg_result', {
					match: match,
					scores: scores,
					players: playersMap,
					scoresMap: scoresMap,
					game_data: rows,
					game: game,
				});
			})
			.catch(function (err) {
				helper.renderError(res, err);
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Method for starting a new match */
router.post('/new', function (req, res) {
	if (req.body.players === undefined) {
		debug('No players specified, unable to start match');
		return res.redirect('/');
	}

	// Get first player in the list, order should be handled in frontend
	var currentPlayerId = req.body.players[0];
	var gameType = req.body.gameType;

	debug('New game added', gameType);
	new Game({ game_type_id: gameType, created_at: moment().format("YYYY-MM-DD HH:mm:ss") })
		.save(null, { method: 'insert' })
		.then(function (game) {
			var players = req.body.players;
			new Match().createMatch(game.id, req.body.startingScore, currentPlayerId, players, (err, match) => {
				if (err) {
					return helper.renderError(res, err);
				}
				debug('Added players %s', players);
				socketHandler.setupNamespace(match.id);
				res.redirect('/match/' + match.id);
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

router.delete('/:legid/leg/:visitid', function (req, res) {
	var visitId = req.params.visitid;
	debug("Deleting visit id %s", visitId);
	Score.forge({ id: visitId })
	.destroy()
	.then(function(score) {
		res.status(200)
			.send()
			.end();
	});
});
/* Modify the score */
router.post('/:id/leg', function (req, res) {
	// TODO Only allow if match is not finished

	// Assign those values to vars since they will be used in other places
	var scoreId = req.body.scoreId;
	var firstDartScore = req.body.firstDart;
	var secondDartScore = req.body.secondDart;
	var thirdDartScore = req.body.thirdDart;
	var firstDartMultiplier = req.body.firstDartMultiplier;
	var secondDartMultiplier = req.body.secondDartMultiplier;
	var thirdDartMultiplier = req.body.thirdDartMultiplier;
	debug('Updating score %s to  (%s-%s, %s-%s, %s-%s)', scoreId, firstDartScore,
		firstDartMultiplier, secondDartScore, secondDartMultiplier, thirdDartScore, thirdDartMultiplier);

	new Score({id: scoreId})
		.save({
			first_dart: firstDartScore,
			second_dart: secondDartScore,
			third_dart: thirdDartScore,
			first_dart_multiplier: firstDartMultiplier,
			second_dart_multiplier: secondDartMultiplier,
			third_dart_multiplier: thirdDartMultiplier
		})
		.then(function (match) {
			res.status(200)
				.send({'statusCode': 200})
				.end();
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Method to cancel a match in progress */
router.delete('/:id/cancel', function (req, res) {
	var matchId = req.params.id;
	Match.forge({ id: matchId })
		.destroy()
		.then(function (match) {
			debug('Cancelled match %s', matchId);
			/*bookshelf.knex.raw(`UPDATE game SET current_match_id = NULL WHERE current_match_id = ?`, matchId)
			.then(function(rows) {
				res.status(204)
				.send()
				.end();
			})
			.catch(function (err) {
				helper.renderError(res, err);
			});*/
			res.status(204)
				.send()
				.end();
		});
});

/* Method to finalize a match */
router.post('/:id/finish', function (req, res) {
	// Assign those values to vars since they will be used in other places
	var matchId = req.body.matchId;
	var currentPlayerId = req.body.playerId;
	var firstDartScore = req.body.firstDart;
	var secondDartScore = req.body.secondDart;
	var thirdDartScore = req.body.thirdDart;
	var firstDartMultiplier = req.body.firstDartMultiplier;
	var secondDartMultiplier = req.body.secondDartMultiplier;
	var thirdDartMultiplier = req.body.thirdDartMultiplier;
	var isCheckoutFirst = req.body.isCheckoutFirst;
	var isCheckoutSecond = req.body.isCheckoutSecond;
	var isCheckoutThird = req.body.isCheckoutThird;
	debug('Match %s finished', matchId);

	// Load the match object since we need certain values from the table
	Match.where('id', '=', matchId)
		.fetch()
		.then(function(row) {
			var match = row.serialize();

			// Insert new score and change current player in match,
			new Score({
					match_id: matchId,
					player_id: currentPlayerId,
					first_dart: firstDartScore,
					second_dart: secondDartScore,
					third_dart: thirdDartScore,
					first_dart_multiplier: firstDartMultiplier,
					second_dart_multiplier: secondDartMultiplier,
					third_dart_multiplier: thirdDartMultiplier,
					is_checkout_first: isCheckoutFirst,
					is_checkout_second: isCheckoutSecond,
					is_checkout_third: isCheckoutThird,
				})
				.save(null, {method: 'insert'})
				.then(function(row) {
					debug('Set final score for player %s', currentPlayerId);

					// Update match with winner
					new Match({ id: matchId })
					.save({
						current_player_id: currentPlayerId,
						is_finished: true,
						winner_id: currentPlayerId,
						end_time: moment().format("YYYY-MM-DD HH:mm:ss"),
					})
					.then(function (row) {
						writeStatistics(match, currentPlayerId, function(err) {
							if(err) {
								debug('ERROR Unable to insert statistics match %s: %s', matchId, err);
								return helper.renderError(res, err);
							}

							new Game({ id: match.game_id})
								.fetch({ withRelated: [ 'game_type' ] })
								.then(function (rows) {
									var game = rows.serialize();
									var requiredMatches = game.game_type.matches_required;
									var requiredWins = game.game_type.wins_required;

									knex = Bookshelf.knex;
									knex('match')
										.select(knex.raw(`match.winner_id, count(match.winner_id) as wins`))
										.where(knex.raw('match.game_id = ?', [game.id]))
										.groupBy(knex.raw('match.winner_id'))
										.then(function(rows) {
											var playedMatches = 0;
											var currentPlayerWins = 0;
											for (var i = 0; i < rows.length; i++) {
												var row = rows[i];
												playedMatches += row.wins;
												if (row.winner_id === currentPlayerId) {
													currentPlayerWins = row.wins;
												}
											}

											if (currentPlayerWins === requiredWins) {
												// Game finished, current player won
												new Game({ id: game.id}).save({ is_finished: true, winner_id: currentPlayerId })
												.then(function (row) {
													res.status(200).end();
												});												
											}
											else if (playedMatches === requiredMatches) {
												// Game fnished, draw
												new Game({ id: game.id}).save({ is_finished: true })
												.then(function (row) {
													res.status(200).end();
												});												
											}
											else {
												// Game is not finished, continue to next leg
												res.status(200).end();
											}
										})
										.catch(function (err) {
											helper.renderError(res, err);
										});
								})
								.catch(function (err) {
									helper.renderError(res, err);
								});
						});
					})
					.catch(function (err) {
						helper.renderError(res, err);
					});
				})
				.catch(function(err) {
					helper.renderError(res, err);
				});
				Match.forge().finalizeMatch(matchId, currentPlayerId, function(err, rows) {
					if (err) {
						debug('Unable to finalize match: %s', err);
						return;
					}
				});
		});
});

function writeStatistics(match, winnerPlayerId, callback) {
	// Get all players in the match and set their statistics
	var matchId = match.id;
	Player2match
		.where('match_id', '=', matchId)
		.fetchAll()
		.then(function(rows) {
			var players = rows.serialize();
			var playerIds = [];
			for (var i = 0; i < players.length; i++) {
				playerIds.push(players[i].player_id);
			}
			Score
				.where('match_id', '=', matchId)
				.fetchAll()
				.then(function(scoreRows) {
					var playerMap = getPlayerStatistics(players, scoreRows.serialize(), match.starting_score);
					for (id in playerMap) {
						var player = playerMap[id];

						if (player.id == winnerPlayerId) {
							// Set checkout percentage fo winning player
							player.checkoutPercentage = 100 / player.checkoutAttempts;
						} else {
							player.checkoutPercentage = 0;
						}

						var stats = new StatisticsX01({
							match_id: matchId,
							player_id: player.id,
							ppd: player.ppd,
							first_nine_ppd: player.first9ppd,
							checkout_percentage: player.checkoutPercentage,
							darts_thrown: player.dartsThrown,
							accuracy_20: player.accuracyStats.accuracy20 === 0 ? null : player.accuracyStats.accuracy20,
							accuracy_19: player.accuracyStats.accuracy19 === 0 ? null : player.accuracyStats.accuracy19,
							overall_accuracy: player.accuracyStats.overallAccuracy
						});
						stats.attributes['60s_plus'] = player.highScores['60+'];
						stats.attributes['100s_plus'] = player.highScores['100+'];
						stats.attributes['140s_plus'] = player.highScores['140+'];
						stats.attributes['180s'] = player.highScores['180'];
						debug('Inserting match statistics for player %s', id);
						stats.save(null, { method: 'insert' }).then(function(row) {
								callback();
							})
							.catch(function(err) {
								callback(err);
							});
					}
				});
		});
}

function getPlayerStatistics(players, scores, startingScore) {
	var playerMap = {};
	for (var i = 0; i < players.length; i++) {
		var player = players[i];
		playerMap[player.player_id] = {
			id: player.player_id,
			remainingScore: startingScore,
			ppdScore: 0,
			ppdDarts: 0,
			ppd: 0,
			first9ppd: 0,
			first9Score: 0,
			totalScore: 0,
			visits: 0,
			scores: [],
			dartsThrown: 0,
			checkoutAttempts: 0,
			highScores: { '60+': 0, '100+': 0, '140+': 0, '180': 0 },
			accuracyStats: {
				accuracy20: 0, attempts20: 0, hits20: 0,
				accuracy19: 0, attempts19: 0, hits19: 0,
				misses: 0,
				overallAccuracy: 0
			}
		}
	}

	for (var i = 0; i < scores.length; i++) {
		var score = scores[i];
		var player = playerMap[score.player_id];

		var checkoutAttempts = 0;
		if (score.is_checkout_first) {
			checkoutAttempts++;
		}
		if (score.is_checkout_second) {
			checkoutAttempts++;
		}
		if (score.is_checkout_third) {
			checkoutAttempts++;
		}
		player.checkoutAttempts += checkoutAttempts;

		if (score.is_bust) {
			continue;
		}
		var totalVisitScore = (score.first_dart * score.first_dart_multiplier) +
				(score.second_dart * score.second_dart_multiplier) +
				(score.third_dart * score.third_dart_multiplier);

		player.visits += 1;
		if (player.visits <= 3) {
			player.first9Score += totalVisitScore;
		}
		player.ppdScore += totalVisitScore;

		if (totalVisitScore >= 60 && totalVisitScore <= 99) {
			player.highScores['60+'] += 1;
		}
		else if (totalVisitScore >= 100 && totalVisitScore <= 139) {
			player.highScores['100+'] += 1;
		}
		else if (totalVisitScore >= 140 && totalVisitScore <= 179) {
			player.highScores['140+'] += 1;
		}
		else if (totalVisitScore == 180) {
			player.highScores['180'] += 1;
		}
		player.remainingScore -= totalVisitScore;

		if (score.first_dart !== null) {
			getAccuracyStats(score.first_dart, score.first_dart_multiplier, player.accuracyStats, player.remainingScore);
			player.dartsThrown++;
		}
		if (score.second_dart !== null) {
			getAccuracyStats(score.second_dart, score.second_dart_multiplier, player.accuracyStats, player.remainingScore);
			player.dartsThrown++;
		}
		if (score.third_dart !== null) {
			getAccuracyStats(score.third_dart, score.third_dart_multiplier, player.accuracyStats, player.remainingScore);
			player.dartsThrown++;
		}
		player.remainingScore -= totalVisitScore;
	}
	for (id in playerMap) {
		var player = playerMap[id];
		player.ppd = player.ppdScore / player.dartsThrown;
		if (player.visits < 3) {
			// With 301 you could finish in 6 darts
			player.first9ppd = player.first9Score / 6;
		}
		else {
			player.first9ppd = player.first9Score / 9;
		}

		// Set accuracy stats for each players
		var accuracyStats = player.accuracyStats;
		if ((accuracyStats.attempts20 + accuracyStats.attempts19 + accuracyStats.misses) == 0) {
			accuracyStats.overallAccuracy = 0;
		} else {
			accuracyStats.overallAccuracy = (accuracyStats.accuracy20 + accuracyStats.accuracy19) /
			(accuracyStats.attempts20 + accuracyStats.attempts19 + accuracyStats.misses);
		}
		accuracyStats.accuracy20 = accuracyStats.accuracy20 == 0 ? 0 : accuracyStats.accuracy20 / accuracyStats.attempts20;
		accuracyStats.accuracy19 = accuracyStats.accuracy19 == 0 ? 0 : accuracyStats.accuracy19 / accuracyStats.attempts19;
	}
	return playerMap;
}

function getAccuracyStats(score, multiplier, stats, remainingScore) {
	if (remainingScore - (score * multiplier) < 171) {
		// We only want to calculate accuracy stats when player has a remaining score over 170
		return;
	}
	switch (score) {
		case 20:
			stats.hits20 += 1;
			stats.attempts20 += 1;
			stats.accuracy20 += 100;
			break;
		case 5:
		case 1:
			stats.attempts20 += 1;
			stats.accuracy20 += 70;
			break;
		case 12:
		case 18:
			stats.attempts20 += 1;
			stats.accuracy20 += 30;
			break;
		case 9:
		case 4:
			stats.attempts20 += 1;
			stats.accuracy20 += 5;
			break;
		case 19:
			stats.hits19 += 1;
			stats.attempts19 += 1;
			stats.accuracy19 += 100;
			break;
		case 7:
		case 3:
			stats.attempts19 += 1;
			stats.accuracy19 += 70;
			break;
		case 16:
		case 17:
			stats.attempts19 += 1;
			stats.accuracy19 += 30;
			break;
		case 8:
		case 2:
			stats.attempts19 += 1;
			stats.accuracy19 += 5;
			break;
		default:
			stats.misses += 1;
			break;
	}
}

module.exports = function (socketHandler) {
	this.socketHandler = socketHandler;

	// Create socket.io namespaces for all matches which are currently active
	Match.forge().where('is_finished', '<>', 1).fetchAll().then(function (rows) {
		var matches = rows.serialize();
		for (var i = 0; i < matches.length; i++) {
			socketHandler.setupNamespace(matches[i].id);
		}
	})
	.catch(function (err) {
		debug('Unable to get active matches from database: %s', err);
	});

	return router;
};