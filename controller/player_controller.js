var debug = require('debug')('dartapp:player-controller');

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

var Bookshelf = require.main.require('./bookshelf.js');
var Player = require.main.require('./models/Player');
var Score = require.main.require('./models/Score');
var StatisticsX01 = require.main.require('./models/StatisticsX01');
var helper = require('../helpers.js');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Add a new player */
router.post('/', function (req, res) {
	new Player({name: req.body.name})
		.save(null, {method: 'insert'})
		.then(function(player) {
			debug('Created player %s', req.body.name);
			res.redirect('/player/list');
		})
		.catch(function(err) {
			return helper.renderError(res, err);
		});
});

/* Get specific statistics for a given player */
router.get('/:id/stats', function(req, res) {
	var playerId = req.params.id;
	new StatisticsX01().getAggregatedStatistics([playerId], function(err, rows) {
		if (err) {
			return helper.renderError(res, err);
		}
		var playerStatistics = rows[0];
		new StatisticsX01().getCheckouts([playerId], function(err, rows) {
			if (err) {
				return helper.renderError(res, err);
			}
			playerStatistics.checkoutAttempts = 0;
			if (rows.attempts.length !== 0) {
				playerStatistics.checkoutAttempts = rows.attempts[0].checkout_attempts;
			}
			Score.forge()
				.where('player_id', '=', playerId)
				.fetchAll()
				.then(function (scoreRows) {
					var scores = scoreRows.serialize();

					var scoreMap = scores.reduce(function (map, score) {
						if (score.first_dart !== null) {
							var firstDartIndex = 'p.' + score.first_dart + '.' + score.first_dart_multiplier;
							map[firstDartIndex] = map[firstDartIndex] === undefined ? 1 : map[firstDartIndex] + 1;
						}
						if (score.second_dart !== null) {
							var secondDartIndex = 'p.' + score.second_dart + '.' + score.second_dart_multiplier;
							map[secondDartIndex] = map[secondDartIndex] === undefined ? 1 : map[secondDartIndex] + 1;
						}
						if (score.third_dart !== null) {
							var thirdDartIndex = 'p.' + score.third_dart + '.' + score.third_dart_multiplier;
							map[thirdDartIndex] = map[thirdDartIndex] === undefined ? 1 : map[thirdDartIndex] + 1;
						}
						return map;
					}, {});

					var map = {
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
						'totalThrows': 0
					}
					for (var i = 0; i < scores.length; i++) {
						var score = scores[i];
						if (score.first_dart !== null) {
							map[score.first_dart][score.first_dart_multiplier] += 1;
							map.totalThrows++;
						}
						if (score.second_dart !== null) {
							map[score.second_dart][score.second_dart_multiplier] += 1;
							map.totalThrows++;
						}
						if (score.third_dart !== null) {
							map[score.third_dart][score.third_dart_multiplier] += 1;
							map.totalThrows++;
						}
					}
					res.render('playerStatistics', { player: playerStatistics, scores: map });
				})
				.catch(function(err) {
					helper.renderError(res, err);
				});
		});
	});
});

/* Get a list of all players */
router.get('/list', function (req, res) {
	Player.query(function(qb) {
			qb.orderBy('name','ASC');
		})
		.fetchAll()
		.then(function(players) {
			res.render('players', { players: players.serialize() });
		})
		.catch(function(err) {
			helper.renderError(res, err);
		});
});

/* Get comparable statistics for the given players s*/
router.get('/compare', function (req, res) {
	var playerIds = req.query.player_id;
	debug('Comparing players %s', playerIds);

	new StatisticsX01().getStatistics(playerIds, function(err, rows) {
		if (err) {
			return helper.renderError(res, err);
		}
		var playersMap = {};
		for (var i = 0; i < rows.length; i++) {
			var stats = rows[i];
			if (playersMap[stats.player_id] === undefined) {
				playersMap[stats.player_id] = { statistics: [stats] };
			}
			else {
				playersMap[stats.player_id].statistics.push(stats);
			}
		}

		var playerStatistics = [];
		for (id in playersMap) {
			var player = playersMap[id];
			playerStatistics.push(calculateStatistics(player.statistics));
			player.statistics = calculateStatistics(player.statistics);
		}

		// Get the highest checkout for each player
		new StatisticsX01().getCheckouts(playerIds, function(err, rows) {
			if (err) {
				return helper.renderError(res, err);
			}

			// Find highest checkout for each player
			for (var i = 0; i < rows.checkouts.length; i++) {
				var row = rows.checkouts[i];
				var stats = playersMap[row.player_id].statistics;
				if (stats.highestCheckout === undefined || stats.highestCheckout < row.checkout) {
					stats.highestCheckout = row.checkout;
				}
			}
			// Calculate checkout percentage for each player
			var attempts = row.attempts;
			for (var i = 0; i < rows.attempts.length; i++) {
				var row = rows.attempts[i];
				var stats = playersMap[row.player_id].statistics;
				stats.checkoutAttempts = row.checkout_attempts;
			}

			var statistics = Object.keys(playersMap).map(function(v) { return playersMap[v].statistics; });
			res.render('playerComparison', { players: statistics });
		});
	});
});

function calculateStatistics(rawStatistics) {
	if (rawStatistics.length === 0) {
		return {};
	}
	var statistics = {
		id: rawStatistics[0].id,
		name: rawStatistics[0].name,
		gamesWon: rawStatistics[0].gamesWon,
		gamesPlayed: rawStatistics[0].gamesPlayed,
		ppd: 0,
		bestPpd: 0,
		first9ppd: 0,
		checkoutAttempts: 0,
		best301: undefined,
		best501: undefined,
		highestCheckout: undefined,
		'60+': 0, '100+': 0, '140+': 0, '180s': 0
	};
	for (var i = 0; i < rawStatistics.length; i++) {
		var stats = rawStatistics[i];
		statistics.ppd += stats.ppd;
		statistics.first9ppd += stats.first_nine_ppd;
		statistics['60+'] += stats['60s_plus'];
		statistics['100+'] += stats['100s_plus'];
		statistics['140+'] += stats['140s_plus'];
		statistics['180s'] += stats['180s'];

		if (statistics.bestPpd < stats.ppd) {
			statistics.bestPpd = stats.ppd;
		}
		if (statistics.id === stats.winner_id) {
			if (stats.starting_score === 301) {
				if (statistics.best301 === undefined || statistics.best301 > stats.darts_thrown) {
					statistics.best301 = stats.darts_thrown;
				}
			}
			else if (stats.starting_score === 501) {
				if (statistics.best501 === undefined || statistics.best501 > stats.darts_thrown) {
					statistics.best501 = stats.darts_thrown;
				}
			}
		}
	}
	statistics.ppd = statistics.ppd / rawStatistics.length;
	statistics.first9ppd = statistics.first9ppd / rawStatistics.length;
	return statistics;
}

module.exports = router