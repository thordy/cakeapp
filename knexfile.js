'use strict';
var sqliteConfig = {
	development: {
        client: 'mysql',
        connection: {
            host : 'localhost',
            user : 'developer',
            password : 'abcd1234',
            database : 'cakeapp_dev'
        }
	},
	production: {
        client: 'mysql',
        connection: {
            host : 'localhost',
            user : 'developer',
            password : 'abcd1234',
            database : 'cakedarts'
        }
	}
};
module.exports = sqliteConfig;