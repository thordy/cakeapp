'use strict';
var bookshelf = require('../bookshelf');
var Player2match = bookshelf.Model.extend({
    tableName: 'player2match',
});
module.exports = Player2match;