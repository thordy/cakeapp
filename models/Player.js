'use strict';
var bookshelf = require('../bookshelf');
var Player = bookshelf.Model.extend({
    tableName: 'player',
});
module.exports = Player;