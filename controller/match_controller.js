var express = require('express');
var bodyParser = require('body-parser');
var Bookshelf = require.main.require('./bookshelf.js');
var router = express.Router();
var moment = require('moment');
var Player = require.main.require('./models/Player');
var Match = require.main.require('./models/Match');
var Score = require.main.require('./models/Score');
var Player2match = require.main.require('./models/Player2match');
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

			console.log(player2match);

			var playerScores = {};
			for (var i = 0; i < players.length; i++){
				var player = players[i];
				playerScores[player.id] = {
					name: player.name,
					playerOrder: player2match.order,
					current_score: match.starting_score,
					current: player.id === match.current_player_id ? true : false,
					scores: []
				}
			}

            console.log(player2match);

			for (var i = 0; i < scores.length; i++) {
				var score = scores[i];
				var player = playerScores[score.player_id];
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
		.fetch( { withRelated: ['players', 'scores', 'player2match'] } )
		.then(function (match) {
			var players = match.related('players').serialize();
			var scores = match.related('scores').serialize();
			var match = match.serialize();
			console.log(match);
			var playerStatistics = {};
			for (var i = 0; i < players.length; i++){
				var player = players[i];
				playerStatistics[player.id] = {
					id: player.id,
					name: player.name,
					ppdScore: 0,
					ppd: 0,
					first9ppd: 0,
					first9Score: 0,
					totalScore: 0,
					visits: 0,
					scores: [],
					highScores: { '60+': 0, '100+': 0, '140+': 0, '180': 0 }
				};
			}
			for (var i = 0; i < scores.length; i++) {
				var score = scores[i];
				var player = playerStatistics[score.player_id];
				var totalVisitScore = (score.first_dart * score.first_dart_multiplier) +
						(score.second_dart * score.second_dart_multiplier) +
						(score.third_dart * score.third_dart_multiplier);

				player.visits += 1;
				if (player.visits <= 3) {
					player.first9Score += totalVisitScore;
				}
				if ((match.starting_score - totalVisitScore) > 170) {
					player.ppdScore += totalVisitScore;
				}
				player.totalScore += totalVisitScore;

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
				player.scores.push(score);
			}
			// Calculate PPD and First 9 PPD
			for (var i = 0; i < players.length; i++){
				var player = playerStatistics[players[i].id];
				player.ppd = player.ppdScore / (player.visits * 3);
				player.first9ppd = player.first9Score / 9;
			}

			res.render('results', {
				match: match,
				scores: scores,
				players: playerStatistics
			});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Method for starting a new match */
router.post('/new', function (req, res) {
	if (req.body.players === undefined) {
		console.log('No players specified, unable to start match');
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
			console.log('Created match: ' + match.id);

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
					console.log('Added players: ' + playersInMatch);
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
		};
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
		}
	)
		.save(null, {method: 'insert'})
		.then(function(row) {
			console.log('Added score for player ' + currentPlayerId);

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
			console.log("Cancelled match: " + req.params.id);
			res.status(204)
				.send()
				.end();
		});
});

/* Method to finalize a match */
router.post('/:id/finish', function (req, res) {
	console.log('Game finished');

	// Assign those values to vars since they will be used in other places
	var matchId = req.body.matchId;
	var currentPlayerId = req.body.playerId;
	var firstDartScore = req.body.firstDart;
	var secondDartScore = req.body.secondDart;
	var thirdDartScore = req.body.thirdDart;
	var firstDartMultiplier = req.body.firstDartMultiplier;
	var secondDartMultiplier = req.body.secondDartMultiplier;
	var thirdDartMultiplier = req.body.thirdDartMultiplier;

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
		}
	)
		.save(null, {method: 'insert'})
		.then(function(row) {
			console.log('Added finishing score for player ' + currentPlayerId);

			// Update match with winner
			new Match({
				id: matchId
			})
				.save({
					current_player_id: currentPlayerId,
					is_finished: true,
					winner_id: currentPlayerId,
					end_time: moment().format("YYYY-MM-DD HH:mm:ss"),
				})
				.then(function (match) {
					res.status(200).end();
				})
				.catch(function (err) {
					helper.renderError(res, err);
				});
		})
		.catch(function(err) {
			return helper.renderError(res, err);
		});
});

module.exports = router

