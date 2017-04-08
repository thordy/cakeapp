'use strict';

var bookshelf = require('../bookshelf');

var Player = require.main.require('./models/Player');

var StatisticsX01 = bookshelf.Model.extend({
    tableName: 'statistics_x01',
    match: function () {
        return this.belongsTo(Match, 'id');
    },
    player: function () {
        return this.hasOne(Player, ['player_id'])
    }
});
module.exports = StatisticsX01;