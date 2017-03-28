'use strict';
var bookshelf = require('../bookshelf');
bookshelf.plugin('registry');

var Match = require('./Match');

var Score = bookshelf.Model.extend({
    tableName: 'score',
    match: function() {
        return this.belongsTo('Match', 'id');
    }
});
module.exports = bookshelf.model('Score', Score);