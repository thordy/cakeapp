
exports.up = function(knex, Promise) {
	return knex.schema
		.createTable('owes', function(table) {
			table.integer('player_ower_id').unsigned().notNullable();
            table.integer('player_owee_id').unsigned().notNullable();
            table.integer('owe_type_id').unsigned().notNullable();

			table.foreign('player_ower_id').references('player.id');
			table.foreign('player_owee_id').references('player.id');
			table.foreign('owe_type_id').references('owe_type.id');
            table.integer('amount').notNullable();
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('owes');
};
