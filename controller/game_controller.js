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

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

/* Get a list of all games */
router.get('/list', function (req, res) {
	// Get collection of matches
	var Games = Bookshelf.Collection.extend({ model: Game });

	// Fetch related players
	new Games()
		.fetch({
			withRelated: [
				'game_winner',
				'game_type',
				'players'
			]
		})
		.then(function (rows) {
			var games = rows.serialize();
			var players = {};
			for (var i = 0; i < games.length; i++) {
				var game = games[i];
				for (var j = 0; j < game.players.length; j++){
					var player = game.players[j];
					players[player.id] = { name: player.name, wins: 0 }
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
				var playerWins = {};
				for (var i = 0; i < rows.length; i++) {
					var playerId = rows[i].winner_id;
					var wins = rows[i].wins;					
					players[playerId].wins = wins;
				}	
				res.render('games', {
					games: games,
					players: players
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

/**
 * Continue game or show results
 */

/* Render the match view */
router.get('/:gameid/match/:matchid', function (req, res) {
	new Match({ id: req.params.matchid })
		.fetch({
			withRelated: [
				{ 'players': function (qb) { qb.orderBy('order', 'asc') } },
				'game',
				'game.game_type',
				{ 'scores': function (qb) { qb.where('is_bust', '0'); qb.orderBy('id', 'asc') } },
				{ 'player2match': function (qb) { qb.orderBy('order', 'asc') } }
			]
		})
		.then(function (match) {
            var players = match.related('players').serialize();
            var matchData = match.serialize();
            players.push(players.shift())

            // Get first player in the list, order should be handled in frontend
            var currentPlayerId = players[0].id;

            new Match({
                starting_score: matchData.starting_score,
                current_player_id: currentPlayerId,
                game_id: req.params.gameid,
                created_at: moment().format("YYYY-MM-DD HH:mm:ss")
            })
            .save(null, {method: 'insert'})
            .then(function (newmatch) {
                debug('Created match %s', newmatch.id);

                // Update game and set current match id
                new Game({
                    id: req.params.gameid,
                    current_match_id: newmatch.id
                })
                .save()
                .then(function (game) {
                    console.log(players);
                    var playersArray = players;
                    var playerOrder = 1;
                    var playersInMatch = [];
                    for (var i in playersArray) {
                        playersInMatch.push({
                            player_id: playersArray[i].id,
                            match_id: newmatch.id,
                            order: playerOrder,
							game_id: game.id
                        });
                        playerOrder++;
                    }

                    Bookshelf
                        .knex('player2match')
                        .insert(playersInMatch)
                        .then(function (rows) {
                            debug('Added players %s', playersArray);
                            res.redirect('/match/' + newmatch.id);
                        })
                        .catch(function (err) {
                            helper.renderError(res, err);
                        });
                });
            })
            .catch(function (err) {
                helper.renderError(res, err);
            });

            /*
            var gameType = req.body.gameType;

            /**
             * Check the game type and add new one
             * This is only for starting new match,
             * for next sets we need to pass game id to /new/gameid route 
             *
            debug('New game added', gameType);
            new Game({
                game_type_id: gameType,
                created_at: moment().format("YYYY-MM-DD HH:mm:ss")
            })
            .save(null, {method: 'insert'})
            .then(function (game) {

            })
            .catch(function (err) {
                helper.renderError(res, err);
            });            
                        console.log(players);
            /*
			
			var scores = match.related('scores').serialize();
			var match = match.serialize();

			// Set all scores and round number
			match.scores = scores;
			match.roundNumber = Math.floor(scores.length / players.length) + 1;
			res.render('match', {
				match: match,
				players: playersMap,
				game: match.game,
				game_type: match.game.game_type,
			});
            */
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

	/**
	 * Check the game type and add new one
	 * This is only for starting new match,
	 * for next sets we need to pass game id to /new/gameid route 
	 */
	debug('New game added', gameType);
	new Game({
		game_type_id: gameType,
		created_at: moment().format("YYYY-MM-DD HH:mm:ss")
	})
	.save(null, {method: 'insert'})
	.then(function (game) {
		new Match({
			starting_score: req.body.matchType,
			current_player_id: currentPlayerId,
			game_id: game.id,
			created_at: moment().format("YYYY-MM-DD HH:mm:ss")
		})
		.save(null, {method: 'insert'})
		.then(function (match) {
			debug('Created match %s', match.id);

			// Update game and set current match id
			new Game({
				id: game.id,
				current_match_id: match.id
			})
			.save()
			.then(function (game) {
				var playersArray = req.body.players;
				var playerOrder = 1;
				var playersInMatch = [];
				for (var i in playersArray) {
					playersInMatch.push({
						player_id: playersArray[i],
						match_id: match.id,
						order: playerOrder,
						game_id: game.id,
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



module.exports = router
