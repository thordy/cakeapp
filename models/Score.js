var bookshelf = require.main.require('bookshelf');
var Score = bookshelf.Model.extend({
    tableName: 'score',
});

module.exports = Score;