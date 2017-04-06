var debug = require('debug')('dartapp:player-controller');

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var Player = require.main.require('./models/Player');
var Score = require.main.require('./models/Score');
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
	new Player({id: req.params.id})
		.fetch()
		.then(function(row) {
			var player = row.serialize();

			Score.where( {player_id: req.params.id} )
			.fetchAll()
			.then(function (scoreRows) {
				var scores = scoreRows.serialize();
				var statistics = getPlayerStatistics([player], scores)[player.id];
				res.render('playerStatistics', { player: statistics } );
			});
		})
		.catch(function(err) {
			helper.renderError(res, err);
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
	Player
		.where('id', 'IN', playerIds)
		.fetchAll()
		.then(function(rows) {
			var players = rows.serialize();
			Score
				.where('player_id', 'IN', playerIds)
				.fetchAll()
				.then(function(scoreRows){
					var playerMap = getPlayerStatistics(players, scoreRows.serialize());
					res.render('playerComparison', { players: playerMap });
				});
		});
});

function getPlayerStatistics(players, scores) {
	var playerMap = {};
	for (var i = 0; i < players.length; i++) {
		var player = players[i];
		playerMap[player.id] = {
			id: player.id,
			name: player.name,
			gamesWon: player.games_won,
			gamesPlayed: player.games_played,
			ppdScore: 0,
			ppd: 0,
			first9ppd: 0,
			first9Score: 0,
			totalScore: 0,
			visits: 0,
			scores: [],
			highScores: { '60+': 0, '100+': 0, '140+': 0, '180': 0 }
		}
	}

	for (var i = 0; i < scores.length; i++) {
		var score = scores[i];
		var player = playerMap[score.player_id];

		var totalVisitScore = (score.first_dart * score.first_dart_multiplier) +
				(score.second_dart * score.second_dart_multiplier) +
				(score.third_dart * score.third_dart_multiplier);

		player.visits += 1;
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
	}
	for (id in playerMap) {
		var player = playerMap[id];
		player.ppd = player.ppdScore / (player.visits * 3);
	}
	return playerMap;	
}

module.exports = router