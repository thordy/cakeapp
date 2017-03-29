'use strict';
var sqliteConfig = (require('./knexfile'));
var knexConfig = sqliteConfig[process.env.NODE_ENV || 'development'];
var knex = require('knex')(knexConfig);

var bookshelf = require('bookshelf')(knex);
module.exports = bookshelf;