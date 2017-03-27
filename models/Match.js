'use strict';

var bookshelf = require('../bookshelf');
var Player2match = require.main.require('./models/Player2match');
var Player = require.main.require('./models/Player');
var Score = require.main.require('./models/Score');

var Match = bookshelf.Model.extend({
    tableName: 'match',
    orderBy: function (column, order) {
        return this.query(function (qb) {
            qb.orderBy(column, order);
        });
    },
    players: function() {
        return this.belongsToMany(Player, 'id').through(Player2match, 'match_id');
    },
    scores: function() {
        return this.belongsToMany(Player, 'id').through(Score, 'match_id');
    }
});
module.exports = Match;