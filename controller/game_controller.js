const debug = require('debug')('kcapp:match-controller');

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

/* Get a list of all games */
router.get('/list', function (req, res) {
    axios.get('http://localhost:8001/game')
        .then(response => {
            var games = response.data;
            axios.get('http://localhost:8001/player')
                .then(response => {
                    var players = response.data;
                    res.render('games', { games: games, players: players });
                  })
                  .catch(error => {
                    debug('Error when getting players: ' + error);
                    helper.renderError(res, error);
                  });
          })
          .catch(error => {
            debug('Error when getting games: ' + error);
            helper.renderError(res, error);
          });
});

/**
 * This method should handle resuming a game with creating a new match
 * or resuming a game with unfinished match
 */
router.get('/:gameid', function (req, res) {
    // res.redirect('/game/' + req.params.gameid + '/results');
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

/* Spectate the given game */
router.get('/:gameid/spectate', function (req, res) {
    axios.get('http://localhost:8001/game/' + req.params.gameid)
    .then(response => {
        var game = response.data;
        res.redirect('/match/' + game.current_match_id + '/spectate');
      })
      .catch(error => {
        debug('Error when getting game: ' + error);
        helper.renderError(res, error);
      });
});

/* Render the results view */
router.get('/:id/results', function (req, res) {
    var id = req.params.id;
    axios.get('http://localhost:8001/game/' + id)
        .then(response => {
            var game = response.data;
            axios.get('http://localhost:8001/player')
                .then(response => {
                    var players = response.data;
                    axios.get('http://localhost:8001/game/' + id + '/statistics')
                    .then(response => {
                        var stats = response.data;                        
                        res.render('game_result', { game: game, players: players, stats: stats });
                      })
                      .catch(error => {
                        debug('Error when getting statistics: ' + error);
                        helper.renderError(res, error);
                      });                    
                  })
                  .catch(error => {
                    debug('Error when getting players: ' + error);
                    helper.renderError(res, error);
                  });
          })
          .catch(error => {
            debug('Error when getting game: ' + error);
            helper.renderError(res, error);
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