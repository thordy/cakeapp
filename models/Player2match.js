'use strict';
var bookshelf = require('../bookshelf');
var Player = require.main.require('./models/Player');

var Player2match = bookshelf.Model.extend({
    tableName: 'player2match',
    match: function () {
        return this.belongsTo(Match, 'id');
    },
    player: function () {
        return this.hasOne(Player, ['player_id'])
    }
});
module.exports = Player2match;