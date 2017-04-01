'use strict';

var bookshelf = require('../bookshelf');
bookshelf.plugin('registry');

var Player = require('./Player');
var Player2Match = require('./Player2match');
var Score = require('./Score');

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
    scores: function() {
        return this.hasMany('Score');
    }
},
{
  dependents: ['players']
});
module.exports = bookshelf.model('Match', Match);