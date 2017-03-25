var bookshelf = require.main.require('bookshelf');
var Player = bookshelf.Model.extend({
    tableName: 'player',
});

module.exports = Player;