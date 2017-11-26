'use strict';
const debug = require('debug')('dartapp:match-model');

const bookshelf = require('../bookshelf');
bookshelf.plugin('registry');
const moment = require('moment');

const Player = require('./Player');
const Player2Match = require('./Player2match');
const Score = require('./Score');
const Game = require('./Game');
const GameType = require('./GameType');
const StatisticsX01 = require('./StatisticsX01');

var Match = bookshelf.Model.extend({
    tableName: 'match',
    orderBy: function (column, order) {
        return this.query(function (qb) {
            qb.orderBy(column, order);
        });
    },
    game: function() {
        return this.belongsTo(Game);
    },
    players: function() {
        return this.belongsToMany(Player, 'id').through(Player2Match, 'match_id');
    },
    player2match: function() {
        return this.hasMany(Player2Match);
    },
    scores: function() {
        return this.hasMany(Score);
    },
    statistics: function() {
        return this.hasMany(StatisticsX01);
    },
    finalizeMatch: function(matchId, winningPlayerId, callback) {
        // Increment played matches and games won
        bookshelf.knex.raw(`
            UPDATE player
            SET games_played = games_played + 1
            WHERE id IN (SELECT player_id from player2match WHERE match_id = ?)`, matchId)
        .then(function(rows) {
            bookshelf.knex.raw(`
                UPDATE player
                SET games_won = games_won + 1
                WHERE id = ?`, winningPlayerId)
            .then(function(rows) {
                callback(null, rows);
            })
            .catch(function (err) {
                callback(err)
            });
        })
        .catch(function (err) {
            callback(err)
        });
    },
    setCurrentPlayer: function(matchId, currentPlayerId, players, callback) {
        // We might as well load the player2match model in here for given match id
        var currentPlayerOrder = 1;
        var playersArray = {};
        for (var i = 0; i < players.length; i++){
            var player = players[i];
            if (player.player_id === currentPlayerId) {
                currentPlayerOrder = player.order;
            }
            playersArray[player.order] = { playerId: player.player_id }
        }
        var nextPlayerId = playersArray[(currentPlayerOrder % players.length) + 1].playerId;
        new Match({ id: matchId })
            .save( {current_player_id: nextPlayerId} )
            .then(function (match) {
                callback(null, match);
            })
            .catch(function (err) {
                callback(err)
            });
    },
    getMatch: function(matchId, callback) {
        new Match({ id: matchId })
            .fetch( { withRelated: [
                { 'players': function (qb) { qb.orderBy('order', 'asc') } },
                'game',
                'game.game_type',
                { 'scores': function (qb) { qb.orderBy('id', 'asc') } },
                { 'player2match': function (qb) { qb.orderBy('order', 'asc') } }
            ] } )				
            .then(function (row) {
                callback(null, row);
            })
            .catch(function (err) {
                callback(err)
            });
    },
    createMatch: function(gameId, startingScore, startingPlayerId, players, callback) {
        new Match({
            starting_score: startingScore,
            current_player_id: startingPlayerId,
            game_id: gameId,
            created_at: moment().format("YYYY-MM-DD HH:mm:ss")
        })
        .save(null, {method: 'insert'})
        .then(function (match) {
            debug('Created match %s', match.id);

            // Update game and set current match id
            new Game({ id: gameId, current_match_id: match.id })
            .save()
            .then(function (game) {
                var playersArray = players;
                var playerOrder = 1;
                var playersInMatch = [];
                for (var i in playersArray) {
                    playersInMatch.push({
                        player_id: playersArray[i],
                        match_id: match.id,
                        order: playerOrder,
                        game_id: gameId,
                    });
                    playerOrder++;
                }
                bookshelf.knex('player2match')
                    .insert(playersInMatch)
                    .then(function (rows) {
                        callback(null, match);
                    })
                    .catch(function (err) {
                        callback(err);
                    });
            });
        })
        .catch(function (err) {
            callback(err);
        })
    }
},
{
  dependents: ['players', 'scores' ]
});
module.exports = bookshelf.model('Match', Match);