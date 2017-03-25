'use strict';
var bookshelf = require('../bookshelf');
var Match = bookshelf.Model.extend({
    tableName: 'match',
});
module.exports = Match;