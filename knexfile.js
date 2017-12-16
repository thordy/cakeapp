'use strict';
var dbConfig = {
	development: {
        client: 'mysql',
        connection: {
            host : '10.12.100.66',
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
module.exports = dbConfig;