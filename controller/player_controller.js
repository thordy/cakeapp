var debug = require('debug')('dartapp:player-controller');

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

var Bookshelf = require.main.require('./bookshelf.js');
var Player = require.main.require('./models/Player');
var Score = require.main.require('./models/Score');
var StatisticsX01 = require.main.require('./models/StatisticsX01');
var helper = require('../helpers.js');

const axios = require('axios');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Add a new player */
router.post('/', function (req, res) {
	axios.post('http://localhost:8001/player', { name: req.body.name, nickname: req.body.nickname })
	  .then(function (response) {
		res.redirect('/player/list');
	  })
	  .catch(function (error) {
		helper.renderError(res, error);
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
						'totalThrows': 0
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
					res.render('player_statistics', { player: playerStatistics, scoresMap: scoresMap });
				})
				.catch(function(err) {
					helper.renderError(res, err);
				});
		});
	});
});

/* Get a list of all players */
router.get('/list', function (req, res) {
	axios.get('http://localhost:8001/player')
		.then(response => {
			var players = response.data;
			res.render('players', { players: players });
		  })
		  .catch(error => {
		    debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		  });
});

/* Get comparable statistics for the given players */
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
		for (id in playersMap) {
			var player = playersMap[id];
			player.statistics = calculateStatistics(player.statistics);
		}

		// Get the highest checkout for each player
		new StatisticsX01().getCheckouts(playerIds, function(err, rows) {
			if (err) {
				return helper.renderError(res, err);
			}

			// Find highest checkout for each player
			var checkouts = rows.checkouts;
			for (var i = 0; i < checkouts.length; i++) {
				var row = checkouts[i];
				playersMap[row.player_id].statistics.highestCheckout = row.highest_checkout;
			}
			// Calculate checkout percentage for each player
			if (rows !== undefined) {
				var attempts = rows.attempts;
				for (var i = 0; i < attempts.length; i++) {
					var row = attempts[i];
					var stats = playersMap[row.player_id].statistics;
					stats.checkoutAttempts = row.checkout_attempts;
				}
			}

			var statistics = Object.keys(playersMap).map(function(v) { return playersMap[v].statistics; });
			res.render('player_comparison', { players: statistics });
		});
	});
});

function calculateStatistics(rawStatistics) {
	if (rawStatistics.length === 0) {
		return {};
	}
	var statistics = {
		id: rawStatistics[0].player_id,
		name: rawStatistics[0].name,
		gamesWon: rawStatistics[0].gamesWon,
		gamesPlayed: rawStatistics[0].gamesPlayed,
		ppd: 0,
		bestPpd: 0,
		bestFirst9Ppd: 0,
		first9ppd: 0,
		checkoutAttempts: 0,
		accuracy20: 0,
		accuracy19: 0,
		overallAccuracy: 0,
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

		// Calculate accuracy
		statistics.accuracy19 += rawStatistics.accuracy_19;
		statistics.accuracy20 += rawStatistics.accuracy_20;
		statistics.overallAccuracy += rawStatistics.overall_accuracy;

		if (statistics.bestPpd < stats.ppd) {
			statistics.bestPpd = stats.ppd;
		}
		if (statistics.bestFirst9Ppd < stats.first_nine_ppd) {
			statistics.bestFirst9Ppd = stats.first_nine_ppd;
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