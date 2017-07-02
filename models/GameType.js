'use strict';
var bookshelf = require('../bookshelf');
var Game = require.main.require('./models/Game');

var GameType = bookshelf.Model.extend({
    tableName: 'game_type',
});
module.exports = GameType;