'use strict';
var bookshelf = require('../bookshelf');
var GameType = require.main.require('./models/GameType');

var Game = bookshelf.Model.extend({
    tableName: 'game',
    game_type: function() {
      return this.hasOne(GameType, 'id', 'game_type_id');  
    },    
});
module.exports = Game;