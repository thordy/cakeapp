'use strict';
var bookshelf = require('../bookshelf');
var GameType = require.main.require('./models/GameType');

var Game = bookshelf.Model.extend({
    tableName: 'game',
    game_type: function() {
        return this.belongsTo(GameType, 'game_type_id', 'id');
    },
});
module.exports = Game;