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
            var games = _.indexBy(rows.serialize(), 'id');
            _.each(games, function(game) {
                for (var j = 0; j < game.players.length; j++){
                    var player = game.players[j];
                    player.legs_won = 0;
                }
                game.players = _.indexBy(game.players, 'id');
            });

            knex = Bookshelf.knex;
            knex('match')
            .select(knex.raw(`
                game.id as game_id,
                match.winner_id,
                count(match.winner_id) as wins,
                game_type.matches_required`
            ))
            .join(knex.raw('game on game.id = match.game_id'))
            .join(knex.raw('game_type on game_type.id = game.game_type_id'))
            .groupBy(['match.winner_id', 'game.id'])
            .then(function(rows) {
                for (var i = 0; i < rows.length; i++) {
                    var winner = rows[i];
                    if (winner.winner_id) {
                        var game = games[winner.game_id];
                        var player = game.players[winner.winner_id];
                        player.legs_won = winner.wins;
                    }
                }
                res.render('games', { games: games });
            })
            .catch(function (err) {
               return helper.renderError(res, err);
            });
        })
        .catch(function (err) {
            helper.renderError(res, err);
        });
});

/**
 * This method should handle resuming a game with creating a new match
 * or resuming a game with unfinished match
 */
router.get('/:gameid', function (req, res) {
    // Get game by id and check the current match id
    new Game({ id: req.params.gameid })
        .fetch()
        .then(function (game) {
            var gameData = game.serialize();
            var currentMatchId = gameData.current_match_id;
            var isGameFinished = gameData.is_finished;
            if (isGameFinished) {
                res.redirect('/game/' + req.params.gameid + '/results');
            }
            else {
                new Match({ id: currentMatchId })
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
                    var matchData = match.serialize();
                    // Check if the match is finished
                    if (!matchData.is_finished) {
                        // If not finished, redirect to it
                        res.redirect('/match/' + matchData.id);
                    }
                    else {
                        // If the match is not finished, create new one
                        var players = match.related('players').serialize();
                        players.push(players.shift())

                        // Get first player in the list, order should be handled in frontend
                        var currentPlayerId = players[0].id;

                        new Match({
                            starting_score: matchData.starting_score,
                            current_player_id: currentPlayerId,
                            game_id: req.params.gameid,
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss")
                        })
                        .save(null, { method: 'insert' })
                        .then(function (newmatch) {
                            debug('Created match %s', newmatch.id);

                            // Update game and set current match id
                            new Game({ id: req.params.gameid, current_match_id: newmatch.id })
                            .save()
                            .then(function (game) {
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
                                        
                                        socketHandler.setupNamespace(newmatch.id);

                                        // Forward all spectating clients to next match
                                        socketHandler.emitMessage(currentMatchId, 'match_finished', {
                                            old_match_id: currentMatchId,
                                            new_match_id: newmatch.id
                                        }); 
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
                    }
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

/* Spectate a given game */
router.get('/:gameid/spectate', function (req, res) {
    new Game({ id: req.params.gameid })
        .fetch()
        .then(function (game) {
            var gameData = game.serialize();
            var currentMatchId = gameData.current_match_id;
            res.redirect('/match/' + currentMatchId + '/spectate');
        })
        .catch(function (err) {
            helper.renderError(res, err);
        });
});

/* Render the results view */
router.get('/:id/results', function (req, res) {
    Match
        .where('game_id', '=', req.params.id)
        .fetchAll( { withRelated: [ 'players', 'statistics', 'scores', 'game', 'game.game_type' ] } )
        .then(function (row) {
            if (row === null) {
                return helper.renderError(res, 'No game with id ' + req.params.id + ' exists');
            }			
            var matches = row.serialize();
            var game = matches[0].game;
            game.end_time = matches[matches.length - 1].end_time;

            var playersMap = matches[0].players.reduce(function ( map, player ) {
                map['p' + player.id] = {
                    id: player.id,
                    name: player.name,
                    checkout_percentage: 0,
                    ppd: 0,
                    first_nine_ppd: 0,
                    scores_60s: 0,
                    scores_100s: 0,
                    scores_140s: 0,
                    scores_180: 0,
                    accuracy_20s: 0,
                    accuracy_19s: 0,
                    overall_accuracy: 0
                }
                return map;
            }, {});

            // Calculate some global statics for all legs
            for (var i = 0; i < matches.length; i++) {
                var statistics = matches[i].statistics;
                for (var j = 0; j < statistics.length; j++) {
                    var stats = statistics[j];
                    var player = playersMap['p' + stats.player_id];
                    player.scores_60s += stats['60s_plus'];
                    player.scores_100s += stats['100s_plus'];
                    player.scores_140s += stats['140s_plus'];
                    player.scores_180s += stats['180s'];
                    player.ppd += stats.ppd;
                    player.first_nine_ppd += stats.first_nine_ppd;
                    player.checkout_percentage += stats.checkout_percentage;
                    player.accuracy_19s += stats.accuracy_19s == null ? 0 : stats.accuracy_19s;
                    player.accuracy_20s += stats.accuracy_20s == null ? 0 : stats.accuracy_20s;
                    player.overall_accuracy += stats.overall_accuracy;
                }
            }
            var numLegs = matches.length;
            _.each(playersMap, (player) => {
                player.ppd = player.ppd / numLegs;
                player.first_nine_ppd = player.first_nine_ppd / numLegs;
                player.checkout_percentage = player.checkout_percentage / numLegs;
                player.accuracy_19s = player.accuracy_19s / numLegs;
                player.accuracy_20s = player.accuracy_20s / numLegs;
                player.overall_accuracy = player.overall_accuracy / numLegs;
            });

            res.render('game_result', {
                game: game,
                matches: matches,
                players: playersMap
            });
        })
        .catch(function (err) {
            helper.renderError(res, err);
        });	
});

/* Method for starting a new game */
router.post('/new', function (req, res) {
    var players = req.body.players;
	if (players === undefined) {
		debug('No players specified, unable to start match');
		return res.redirect('/');
	}
    if (players.constructor !== Array) {
        // If this is only a single player players is sent as a String, so make it an
        // array so that we select from the array instead of a substring below
        players = [ players ];
    }
	var currentPlayerId = players[0];
	var gameType = req.body.gameType;
	var gameStake = req.body.gameStake;

	debug('New game added', gameType);
	new Game({
		game_type_id: gameType,
		owe_type_id: gameStake == "0" ? undefined : gameStake,
		created_at: moment().format("YYYY-MM-DD HH:mm:ss")
	})
    .save(null, { method: 'insert' })
    .then(function (game) {
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

module.exports = function (socketHandler) {
    this.socketHandler = socketHandler;
    return router;
};