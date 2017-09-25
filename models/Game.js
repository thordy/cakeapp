'use strict';
var bookshelf = require('../bookshelf');
var GameType = require.main.require('./models/GameType');
var OweType = require.main.require('./models/OweType');
var Player = require.main.require('./models/Player');
var Player2Match = require.main.require('./models/Player2match');

var Game = bookshelf.Model.extend({
    tableName: 'game',
    game_type: function() {
      return this.hasOne(GameType, 'id', 'game_type_id');  
    },    
    game_winner: function() {
      return this.hasOne(Player, 'id', 'winner_id')
    },
    players: function() {
        return this.belongsToMany(Player, 'id').through(Player2Match, 'game_id');
    },
    game_stake: function() {
      return this.hasOne(OweType, 'id', 'owe_type_id');  
    },  
});
module.exports = Game;