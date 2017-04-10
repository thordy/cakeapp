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
				{
					'scores' : function (qb) {
						qb.where('is_bust', '0');
					}
				},
				{
					'player2match' : function (qb) {
						qb.orderBy('order', 'asc');
					}
				}
			]
		})
		.then(function (match) {
			var players = match.related('players').serialize();
			var scores = match.related('scores').serialize();
			var player2match = match.related('player2match').serialize();
			var match = match.serialize();

			var playerScores = {};
			for (var i = 0; i < players.length; i++){
				var player = players[i];
				playerScores['p' + player.id] = {
					name: player.name,
					playerOrder: player2match.order,
					current_score: match.starting_score,
					current: player.id === match.current_player_id ? true : false,
					scores: []
				}
			}

			for (var i = 0; i < scores.length; i++) {
				var score = scores[i];
				var player = playerScores['p' + score.player_id];
				player.scores.push(score);
				player.current_score = player.current_score - ((score.first_dart * score.first_dart_multiplier) +
					(score.second_dart * score.second_dart_multiplier) +
					(score.third_dart * score.third_dart_multiplier));
			}
			match.scores = scores;

			res.render('match', {
				match: match,
				players: playerScores
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
			var scoresCount = {};
			for (var i = 0; i < scores.length; i++) {
				var score = scores[i];
				if (score.first_dart !== null) {
					var firstDartIndex = 'p.' + score.first_dart + '.' + score.first_dart_multiplier;
					scoresCount[firstDartIndex] = scoresCount[firstDartIndex] === undefined ? 1 : scoresCount[firstDartIndex] + 1;
				}
				if (score.second_dart !== null) {
					var secondDartIndex = 'p.' + score.second_dart + '.' + score.second_dart_multiplier;
					scoresCount[secondDartIndex] = scoresCount[secondDartIndex] === undefined ? 1 : scoresCount[secondDartIndex] + 1;
				}
				if (score.third_dart !== null) {
					var thirdDartIndex = 'p.' + score.third_dart + '.' + score.third_dart_multiplier;
					scoresCount[thirdDartIndex] = scoresCount[thirdDartIndex] === undefined ? 1 : scoresCount[thirdDartIndex] + 1;
				}
			}
			res.render('results', {
				match: match.serialize(),
				scores: scores,
				players: playersMap,
				scoresCount: scoresCount
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
	var secondDartScore = req.body.secondDart;
	var thirdDartScore = req.body.thirdDart;
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
		debug('Added score for player %s', currentPlayerId);

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
		.then(function (match) {
			writeStatistics(match, function() {
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

	// Increment played matches nad games won
	Bookshelf.knex.raw(`UPDATE player SET games_played = games_played + 1
		WHERE id IN (SELECT player_id from player2match WHERE match_id = ?)`, matchId)
	.then(function(rows) {
		debug('Incremented played matches for all players');
	});
	Bookshelf.knex.raw(`UPDATE player SET games_won = games_won + 1
		WHERE id = ?`, currentPlayerId)
	.then(function(rows) {
		debug('Incremented games_won for player %s', currentPlayerId);
	});
});

function writeStatistics(matchRow, callback) {
	// Get all players in the match and set their statistics
	var match = matchRow.serialize();
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
					var playerMap = getPlayerStatistics(players, scoreRows.serialize());
					for (id in playerMap){
						var player = playerMap[id];
						var stats = new StatisticsX01({
							match_id: matchId,
							player_id: player.id,
							ppd: player.ppd,
							first_nine_ppd: player.first9ppd,
							checkout_percentage: player.checkoutPercentage,
							darts_thrown: player.visits * 3,
							is_winner: match.winner_id === player.id ? true : false,
							starting_score: match.starting_score
						});
						stats.attributes['60s_plus'] = player.highScores['60+'];
						stats.attributes['100s_plus'] = player.highScores['100+'];
						stats.attributes['140s_plus'] = player.highScores['140+'];
						stats.attributes['180s'] = player.highScores['180'];
						stats
							.save(null, { method: 'insert' })
							.then(function(row) {
								debug('Inserted statistics for match %s, player %s', matchId, player.id);
								callback();
							})
							.catch(function(err) {
								debug('ERROR Unable to insert statistics match %s, player %s', matchId, player.id);
								debug(err);
								helper.renderError(res, err);
							});
					}
				});
		});	
}


function getPlayerStatistics(players, scores) {
	var playerMap = {};
	for (var i = 0; i < players.length; i++) {
		var player = players[i];
		playerMap[player.player_id] = {
			id: player.player_id,
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
	}
	for (id in playerMap) {
		var player = playerMap[id];
		player.ppd = player.ppdScore / (player.visits * 3);
		if (player.visits < 3) {
			// With 301 you could finish in 6 darts
			player.first9ppd = player.first9Score / 6;
		}
		else {
			player.first9ppd = player.first9Score / 9;
		}
	}
	return playerMap;	
}
module.exports = router

