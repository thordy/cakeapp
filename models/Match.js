'use strict';

var bookshelf = require('../bookshelf');
bookshelf.plugin('registry');

var Player = require('./Player');
var Player2Match = require('./Player2match');
var Score = require('./Score');
var StatisticsX01 = require('./StatisticsX01');

var Match = bookshelf.Model.extend({
    tableName: 'match',
    orderBy: function (column, order) {
        return this.query(function (qb) {
            qb.orderBy(column, order);
        });
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
        var numPlayers = players.length;
        var currentPlayerOrder = 1;
        var playersArray = {};
        for (var i = 0; i < players.length; i++){
            var player = players[i];
            if (player.player_id === currentPlayerId) {
                currentPlayerOrder = player.order;
            }
            playersArray[parseInt(player.order)] = {
                playerId: player.player_id
            }
        }
        var nextPlayerOrder = ((parseInt(currentPlayerOrder) % numPlayers)) + 1;
        var nextPlayerId = playersArray[nextPlayerOrder].playerId;

        new Match({ id: matchId })
            .save({current_player_id: nextPlayerId})
            .then(function (match) {
                callback(null, match);
            })
            .catch(function (err) {
                callback(err)
            });
    }
},
{
  dependents: ['players', 'scores' ]
});
module.exports = bookshelf.model('Match', Match);