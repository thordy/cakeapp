'use strict';
var sqliteConfig = {
	development: {
        /*client: 'sqlite3',
    	connection: {
      		filename: 'database.dev.sqlite3'
    	},
    	useNullAsDefault: true*/
        client: 'mysql',
        connection: {
            host : 'localhost',
            user : 'developer',
            password : 'abcd1234',
            database : 'cakedarts'
        }
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