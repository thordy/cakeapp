'use strict';

var bookshelf = require('../bookshelf');
var Player2match = require.main.require('./models/Player2match');
var StatisticsX01 = require('./StatisticsX01');

var Player = bookshelf.Model.extend({
    tableName: 'player',
    player2match: function () {
        return this.belongsToMany(Player2Match);
    },
    statistics: function() {
        return this.hasMany(StatisticsX01);
    }
});
module.exports = Player;