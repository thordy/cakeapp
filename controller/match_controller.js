var debug = require('debug')('dartapp:match-controller');

var express = require('express');
var bodyParser = require('body-parser');
var Bookshelf = require.main.require('./bookshelf.js');
var router = express.Router();
var moment = require('moment');
var Player = require.main.require('./models/Player');
var Match = require.main.require('./models/Match');
var Score = require.main.require('./models/Score');
var Player2match = require.main.require('./models/Player2match');
var StatisticsX01 = require.main.require('./models/StatisticsX01');
var helper = require('../helpers.js');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

/* Get a list of all matches */
router.get('/list', function (req, res) {
	// Get collection of matches
	var Matches = Bookshelf.Collection.extend({ model: Match });

	// Fetch related players
	new Matches()
		.fetch( {withRelated: 'players'} )
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
				players: players
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Render the match view */
router.get('/:id', function (req, res) {
	new Match({ id: req.params.id })
		.fetch({
			withRelated: [
				'players',
				{ 'scores': function (qb) { qb.where('is_bust', '0'); qb.orderBy('id', 'asc') } },
				{ 'player2match': function (qb) { qb.orderBy('order', 'asc') } }
			]
		})
		.then(function (match) {
			var players = match.related('players').serialize();
			var scores = match.related('scores').serialize();
			var match = match.serialize();

			var playersMap = players.reduce(function ( map, player ) {
				map['p' + player.id] = {
					name: player.name,
					ppd: 0,
					first9ppd: 0,
					first9Score: 0,
					totalScore: 0,
					visits: 0,
					current_score: match.starting_score,
					current: player.id === match.current_player_id ? true : false
				}
				return map;
			}, {});

			for (var i = 0; i < scores.length; i++) {
				var score = scores[i];
				var player = playersMap['p' + score.player_id];

				var visitScore = ((score.first_dart * score.first_dart_multiplier) +
					(score.second_dart * score.second_dart_multiplier) +
					(score.third_dart * score.third_dart_multiplier));
				player.current_score = player.current_score - visitScore;
				player.totalScore += visitScore;
				player.visits += 1;
				if (player.visits <= 3) {
					player.first9Score += visitScore;
				}
			}
			var lastVisit = scores[scores.length - 1];
			if (lastVisit !== undefined) {
				var lastPlayer = playersMap['p' + lastVisit.player_id];
				lastPlayer.isViliusVisit = isViliusVisit(lastVisit);
			}

			var lowestScore = undefined;
			for (var id in playersMap) {
				if (lowestScore === undefined || lowestScore > playersMap[id].current_score) {
					lowestScore = playersMap[id].current_score;
				}
			}

			// Set player ppd and first9ppd
			for (var id in playersMap) {
				var player = playersMap[id];
				var dartsThrown = player.visits === 0 ? 1 : (player.visits * 3);

				if (player.visits <= 3) {
					player.first9ppd = player.first9Score / dartsThrown;
				}
				else {
					player.first9ppd = player.first9Score / 9;
				}
				player.ppd = player.totalScore / dartsThrown;

				if (lowestScore < 171 && player.current_score > 200) {
					player.isBeerCheckoutSafe = false;
				}
				else {
					player.isBeerCheckoutSafe = true;
				}
			}
			// Set all scores and round number
			match.scores = scores;
			match.roundNumber = Math.floor(scores.length / players.length) + 1;
			res.render('match', {
				match: match,
				players: playersMap
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Render the results view */
router.get('/:id/results', function (req, res) {
new Match({id: req.params.id})
		.fetch( { withRelated: ['players', 'statistics', 'scores'] } )
		.then(function (match) {
			var players = match.related('players').serialize();
			var statistics = match.related('statistics').serialize();
			var scores = match.related('scores').serialize();
			var playersMap = players.reduce(function ( map, player ) {
				map[player.id] = player;
				return map;
			}, {});

			for (var i = 0; i < statistics.length; i++) {
				var stats = statistics[i];
				var player = playersMap[stats.player_id];
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
			}
			res.render('results', {
				match: match.serialize(),
				scores: scores,
				players: playersMap,
				scoresMap: scoresMap
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

	new Match({
		starting_score: req.body.matchType,
		current_player_id: currentPlayerId,
		created_at: moment().format("YYYY-MM-DD HH:mm:ss")
	})
	.save(null, {method: 'insert'})
	.then(function (match) {
		debug('Created match %s', match.id);

		var playersArray = req.body.players;
		var playerOrder = 1;
		var playersInMatch = [];
		for (var i in playersArray) {
			playersInMatch.push({
				player_id: playersArray[i],
				match_id: match.id,
				order: playerOrder
			});
			playerOrder++;
		}

		Bookshelf
			.knex('player2match')
			.insert(playersInMatch)
			.then(function (rows) {
				debug('Added players %s', playersArray);
				res.redirect('/match/' + match.id);
			})
			.catch(function (err) {
				helper.renderError(res, err);
			});
	})
	.catch(function (err) {
		helper.renderError(res, err);
	});
});

/* Method to register three thrown darts */
router.post('/:id/throw', function (req, res) {
	// Assign those values to vars since they will be used in other places
	var matchId = req.body.matchId;
	var currentPlayerId = req.body.playerId;
	var firstDartScore = req.body.firstDart;
	firstDartScore = firstDartScore === undefined ? 0 : firstDartScore;
	var secondDartScore = req.body.secondDart;
	secondDartScore = secondDartScore === undefined ? 0 : secondDartScore;
	var thirdDartScore = req.body.thirdDart;
	thirdDartScore = thirdDartScore === undefined ? 0 : thirdDartScore;
	var firstDartMultiplier = req.body.firstDartMultiplier;
	var secondDartMultiplier = req.body.secondDartMultiplier;
	var thirdDartMultiplier = req.body.thirdDartMultiplier;
	var isBust = req.body.isBust;
	var isCheckoutFirst = req.body.isCheckoutFirst;
	var isCheckoutSecond = req.body.isCheckoutSecond;
	var isCheckoutThird = req.body.isCheckoutThird;

	var playersInMatch = req.body.playersInMatch;

	// We might as well load the player2match model in here for given match id
	var numPlayers = playersInMatch.length;
	var currentPlayerOrder = 1;
	var playersArray = {};

	for (var i = 0; i < playersInMatch.length; i++){
		var player = playersInMatch[i];
		if (player.player_id === currentPlayerId) {
			currentPlayerOrder = player.order;
		}
		playersArray[parseInt(player.order)] = {
			playerId: player.player_id
		}
	}

	var nextPlayerOrder = ((parseInt(currentPlayerOrder) % numPlayers)) + 1;
	var nextPlayerId = playersArray[nextPlayerOrder].playerId;

	// TODO should we double check if the match is ended here ?

	// Insert new score and change current player in match
	new Score({
			match_id: matchId,
			player_id: currentPlayerId,
			first_dart: firstDartScore,
			second_dart: secondDartScore,
			third_dart: thirdDartScore,
			first_dart_multiplier: firstDartMultiplier,
			second_dart_multiplier: secondDartMultiplier,
			third_dart_multiplier: thirdDartMultiplier,
			is_bust: isBust,
			is_checkout_first: isCheckoutFirst,
			is_checkout_second: isCheckoutSecond,
			is_checkout_third: isCheckoutThird,
	})
	.save(null, {method: 'insert'})
	.then(function(row) {
		debug('Added score for player %s (%s-%s, %s-%s, %s-%s)', currentPlayerId,
			firstDartScore, firstDartMultiplier, secondDartScore, secondDartMultiplier, thirdDartScore, thirdDartMultiplier);

		// Change current player, maybe check what round is that ?
		new Match({
			id: matchId
		})
			.save({current_player_id: nextPlayerId})
			.then(function (match) {
				res.redirect('/match/' + matchId);
			})
			.catch(function (err) {
				helper.renderError(res, err);
			});
	})
	.catch(function(err) {
		return helper.renderError(res, err);
	});
});


/* Modify the score */
router.post('/:id/results', function (req, res) {
	// TODO Only allow if match is not finished

	// Assign those values to vars since they will be used in other places
	var scoreId = req.body.scoreId;
	var firstDartScore = req.body.firstDart;
	var secondDartScore = req.body.secondDart;
	var thirdDartScore = req.body.thirdDart;
	var firstDartMultiplier = req.body.firstDartMultiplier;
	var secondDartMultiplier = req.body.secondDartMultiplier;
	var thirdDartMultiplier = req.body.thirdDartMultiplier;
	debug('Updating score %s to first: %s, %s, second: %s, %s, third: %s, %s', scoreId, firstDartScore,
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
	Match.forge({ id: req.params.id })
		.destroy()
		.then(function (match) {
			debug('Cancelled match %s', req.params.id);
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
						writeStatistics(match, function(err) {
							if(err) {
								debug('ERROR Unable to insert statistics match %s, player %s', matchId, player.id);
								debug(err);
								return helper.renderError(res, err);
							}
							res.status(200).end();
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
						debug(err);
						return;
					}
					debug('Finished finalie Match');
				});
		});
});

function writeStatistics(match, callback) {
	// Get all players in the match and set their statistics
	var matchId = match.id;
	Player2match
		.where('match_id', '=', matchId)
		.fetchAll()
		.then(function(rows) {
			var players = rows.serialize();
			var playerIds = [];
			for (var i = 0; i < players.length; i++){
				playerIds.push(players[i].player_id);
			}
			Score
				.where('match_id', '=', matchId)
				.fetchAll()
				.then(function(scoreRows){
					var playerMap = getPlayerStatistics(players, scoreRows.serialize(), match.starting_score);
					for (id in playerMap){
						var player = playerMap[id];
						var stats = new StatisticsX01({
							match_id: matchId,
							player_id: player.id,
							ppd: player.ppd,
							first_nine_ppd: player.first9ppd,
							checkout_percentage: player.checkoutPercentage,
							darts_thrown: player.dartsThrown,
							accuracy_20: player.accuracyStats.accuracy20,
							accuracy_19: player.accuracyStats.accuracy19,
							overall_accuracy: player.accuracyStats.overallAccuracy
						});
						stats.attributes['60s_plus'] = player.highScores['60+'];
						stats.attributes['100s_plus'] = player.highScores['100+'];
						stats.attributes['140s_plus'] = player.highScores['140+'];
						stats.attributes['180s'] = player.highScores['180'];
						stats
							.save(null, { method: 'insert' })
							.then(function(row) {
								debug('Inserted statistics for match %s', matchId);
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
		if (score.is_bust) {
			continue;
		}
		var totalVisitScore = (score.first_dart * score.first_dart_multiplier) +
				(score.second_dart * score.second_dart_multiplier) +
				(score.third_dart * score.third_dart_multiplier);
		player.remainingScore -= totalVisitScore;

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
		if (score.first_dart !== null) {
			getAccuracyStats(score.first_dart, player.accuracyStats);
			player.dartsThrown++;
		}
		if (score.second_dart !== null) {
			getAccuracyStats(score.second_dart, player.accuracyStats);
			player.dartsThrown++;
		}
		if (score.third_dart !== null) {
			getAccuracyStats(score.third_dart, player.accuracyStats);
			player.dartsThrown++;
		}
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
		debug(accuracyStats);
		accuracyStats.overallAccuracy = (accuracyStats.accuracy20 + accuracyStats.accuracy19) /
			(accuracyStats.attempts20 + accuracyStats.attempts19 + accuracyStats.misses);
		accuracyStats.accuracy20 = accuracyStats.accuracy20 / (accuracyStats.attempts20 + accuracyStats.misses);
		accuracyStats.accuracy19 = accuracyStats.accuracy19 / (accuracyStats.attempts19 + accuracyStats.misses);
	}
	return playerMap;
}

function getAccuracyStats(score, accuracyStats) {
	switch (score) {
		case 20:
			accuracyStats.hits20 += 1;
			accuracyStats.attempts20 += 1;
			accuracyStats.accuracy20 += 100;
			break;
		case 5:
		case 1:
			accuracyStats.attempts20 += 1;
			accuracyStats.accuracy20 += 70;
			break;
		case 12:
		case 18:
			accuracyStats.attempts20 += 1;
			accuracyStats.accuracy20 += 30;
			break;
		case 9:
		case 4:
			accuracyStats.attempts20 += 1;
			accuracyStats.accuracy20 += 5;
			break;
		case 19:
			accuracyStats.hits19 += 1;
			accuracyStats.attempts19 += 1;
			accuracyStats.accuracy19 += 100;
			break;
		case 7:
		case 3:
			accuracyStats.attempts19 += 1;
			accuracyStats.accuracy19 += 70;
			break;
		case 16:
		case 17:
			accuracyStats.attempts19 += 1;
			accuracyStats.accuracy19 += 30;
			break;
		case 8:
		case 2:
			accuracyStats.attempts19 += 1;
			accuracyStats.accuracy19 += 5;
			break;
		default:
			accuracyStats.misses += 1;
			break;
	}
}

function isViliusVisit(visit) {
	if (visit.first_dart_multiplier != 1 || visit.second_dart_multiplier != 1 || visit.third_dart_multiplier != 1) {
		return false;
	}
	if ((visit.first_dart == 20 && visit.second_dart == 0 && visit.third_dart == 20) ||
		(visit.first_dart == 0 && visit.second_dart == 20 && visit.third_dart == 20) ||
		(visit.first_dart == 20 && visit.second_dart == 20 && visit.third_dart == 0)) {
		return true;
	}
	return false;
}

module.exports = router
