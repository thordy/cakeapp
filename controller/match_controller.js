var debug = require('debug')('kcapp:match-controller');

const express = require('express');
const bodyParser = require('body-parser');
var Bookshelf = require.main.require('./bookshelf.js');
const router = express.Router();
const moment = require('moment');
var Player = require.main.require('./models/Player');
var Match = require.main.require('./models/Match');
var Game = require.main.require('./models/Game');
var Score = require.main.require('./models/Score');
var Player2match = require.main.require('./models/Player2match');
var StatisticsX01 = require.main.require('./models/StatisticsX01');
const helper = require('../helpers.js');
const _ = require('underscore');

const axios = require('axios');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

/* Render the match view */
router.get('/:id', function (req, res) {
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
									res.render('match/button_entry', { match: match, players: playersMap, game: game, match_players: matchPlayers });
								})
								.catch(error => {
							    	debug('Error when getting match players: ' + error);
									helper.renderError(res, error);
								});
						})
						.catch(error => {
					    	debug('Error when getting game: ' + error);
							helper.renderError(res, error);
						});
				})
				.catch(error => {
			    	debug('Error when getting match: ' + error);
					helper.renderError(res, error);
				});
		})
		.catch(function (error) {
	    	debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		});
});

router.get('/:id/keyboard', function (req, res) {
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
									res.render('match/keyboard_entry', { match: match, players: playersMap, game: game, match_players: matchPlayers });
								})
								.catch(error => {
							    	debug('Error when getting match players: ' + error);
									helper.renderError(res, error);
								});
						})
						.catch(error => {
					    	debug('Error when getting game: ' + error);
							helper.renderError(res, error);
						});
				})
				.catch(error => {
			    	debug('Error when getting match: ' + error);
					helper.renderError(res, error);
				});
		})
		.catch(function (error) {
	    	debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		});
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
								})
								.catch(error => {
							    	debug('Error when getting match players: ' + error);
									helper.renderError(res, error);
								});
						})
						.catch(error => {
					    	debug('Error when getting game: ' + error);
							helper.renderError(res, error);
						});
				})
				.catch(error => {
			    	debug('Error when getting match: ' + error);
					helper.renderError(res, error);
				});
		})
		.catch(function (error) {
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
							})
							.catch(error => {
						    	debug('Error when getting game: ' + error);
								helper.renderError(res, error);
							});							
						})
						.catch(error => {
					    	debug('Error when getting statistics: ' + error);
							helper.renderError(res, error);
						});
				})
				.catch(error => {
			    	debug('Error when getting match: ' + error);
					helper.renderError(res, error);
				});
		})
		.catch(function (error) {
	    	debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		});
});

/* Delete the given visit */
router.delete('/:id/leg/:visitid', function (req, res) {
	var visitId = req.params.visitid;
	var matchId = req.params.id;
	Score.forge({ id: visitId })
		.destroy()
		.then(function(score) {
			// TODO Only change current player if num_players > 2

			Bookshelf.knex.raw(`UPDATE \`match\` SET current_player_id = (SELECT player_id FROM score WHERE match_id = :match_id ORDER BY id LIMIT 1)`,
				{ match_id: matchId })
			.then(function(rows) {
				debug("Deleted visit id %s", visitId);
				res.status(200)
						.send()
						.end();
			})
			.catch(function (err) {
				debug('Unable to set current player: %s', err);
			});
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
	var matchId = req.body.match_id;
	var currentPlayerId = req.body.current_player_id;
	debug('Match %s finished', matchId);

	// Load the match object since we need certain values from the table
	Match.where('id', '=', matchId)
		.fetch()
		.then(function(row) {
			var match = row.serialize();

			// Insert new score and change current player in match,
			Score.forge().addVisit(req.body, match, function(err, rows) {
				if (err) {
					return helper.renderError(res, err);
				}
				debug('Set final score for player %s', currentPlayerId);

				// Update match with winner
				Match.forge({ id: matchId })
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

						Game.forge({ id: match.game_id})
							.fetch({ withRelated: [ 'game_type', 'game_stake', 'players' ] })
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
											Game.forge({ id: game.id })
												.save({ is_finished: true,  winner_id: currentPlayerId })
												.then(function (row) {
													// Automatically update owes
													var playersInGame = game.players;
													for (var gamePlayerIndex in playersInGame) {
														var gamePlayerId = playersInGame[gamePlayerIndex].id;
														if (gamePlayerId != currentPlayerId) {
															if (game.owe_type_id) {
																debug('Adding owes of "%s" from %s to %s', game.game_stake.item, gamePlayerId, currentPlayerId);
																knex = Bookshelf.knex;
																knex.raw(`
																	INSERT INTO owes (player_ower_id, player_owee_id, owe_type_id, amount)
																	VALUES (:game_player_id, :game_winner_id, :owe_type_id, 1)
																	ON DUPLICATE KEY UPDATE amount = amount + 1`,
																	{ game_player_id: gamePlayerId, game_winner_id: currentPlayerId, owe_type_id: game.owe_type_id }
																)
																.then(function (rows) {
																})
																.catch(function (err) {
																	helper.renderError(res, err);
																});
															}
														}
													}
													res.status(200).end();
												});
										}
										else if (requiredMatches !== null && playedMatches === requiredMatches) {
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
			});
			Match.forge().finalizeMatch(matchId, currentPlayerId, function(err, rows) {
				if (err) {
					debug('Unable to finalize match: %s', err);
					return;
				}
		});
	});
});

router.put('/:id/order', function(req, res) {
	var matchId = req.params.id;
	Player2match
		.where('match_id', '=', matchId)
		.fetchAll()
		.then(function(rows) {
			var players = rows.serialize();
			var playerOrder = req.body.players;
			var currentPlayerId = _.findKey(playerOrder, (order) => order === 1);
			debug('Chaning order of players to %s', JSON.stringify(playerOrder));
			Bookshelf.knex.raw(`UPDATE \`match\` SET current_player_id = :player_id WHERE id = :match_id`, { player_id: currentPlayerId, match_id: matchId })
			.then(function(rows) {
				for (var i = 0; i < players.length; i++) {
					var player = players[i];
					var order = playerOrder[player.player_id];
					Bookshelf.knex.raw(`UPDATE player2match SET \`order\` = :order WHERE player_id = :player_id AND match_id = :match_id`,
						{ order: order, player_id: player.player_id, match_id: matchId })
					.then(function(rows) {
						debug('Set order!');
					})
					.catch(function (err) {
						debug('Unable to change order: %s', err);
					});
				}
				res.status(200)
					.send()
					.end();
			})
			.catch(function (err) {
				debug('Unable to change order: %s', err);
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
						stats.save(null, { method: 'insert' }).then(function(row) {})
							.catch(function(err) {
								callback(err);
							});
					}
					// Not in the loop
					callback();
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