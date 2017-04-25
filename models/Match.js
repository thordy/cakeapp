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
    }
},
{
  dependents: ['players', 'scores' ]
});
module.exports = bookshelf.model('Match', Match);