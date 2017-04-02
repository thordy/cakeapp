
exports.up = function(knex, Promise) {
	return knex.schema
		.createTable('owes', function(table) {
			table.integer('player_ower_id').notNullable().references('id').inTable('player');
            table.integer('player_owee_id').notNullable().references('id').inTable('player');
            table.integer('owe_type_id').notNullable().references('id').inTable('owe_type');
            table.integer('amount').notNullable();
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('owes');
};
