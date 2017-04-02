
exports.up = function(knex, Promise) {
	return knex.schema
    	.createTable('owe_type', function(table) {
        	table.increments('id').primary();
            table.string('item');
        });  
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('owe_type');  
};
