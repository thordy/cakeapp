var bookshelf = require.main.require('bookshelf');
var Match = bookshelf.Model.extend({
    tableName: 'match',
});

module.exports = Match;