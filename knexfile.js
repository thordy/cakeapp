'use strict';
var sqliteConfig = {
	development: {
    	client: 'sqlite3',
    	connection: {
      		filename: 'database.dev.sqlite3'
    	},
    	useNullAsDefault: true
	},
	production: {
    	client: 'sqlite3',
    	connection: {
      		filename: 'database.prod.sqlite3'
    	},
    	useNullAsDefault: true
	} 
};
module.exports = sqliteConfig;