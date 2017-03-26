'use strict';

var bookshelf = require('../bookshelf');
var Player2match = require.main.require('./models/Player2match');

var Player = bookshelf.Model.extend({
    tableName: 'player',
    player2match: function () {
        return this.belongsToMay(Player2Match);
    }
});
module.exports = Player;