'use strict';

var bookshelf = require('../bookshelf');
bookshelf.plugin('registry');

var Player = require('./Player');
var Player2Match = require('./Player2match');
var Score = require('./Score');
var Statisticsx01 = require('./Statisticsx01');

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
        return this.hasMany(Statisticsx01);
    }
},
{
  dependents: ['players', 'scores' ]
});
module.exports = bookshelf.model('Match', Match);