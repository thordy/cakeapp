'use strict';
var bookshelf = require('../bookshelf');

var GameType = bookshelf.Model.extend({
    tableName: 'game_type'
});
module.exports = GameType;