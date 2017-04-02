'use strict';
var bookshelf = require('../bookshelf');

var OweType = bookshelf.Model.extend({
    tableName: 'owe_type'
});
module.exports = OweType;