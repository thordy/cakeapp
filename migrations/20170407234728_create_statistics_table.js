
exports.up = function(knex, Promise) {
	return knex.schema
		.createTable('statistics_x01', function(table) {
            table.increments('id').primary();
            table.integer('match_id').notNullable().references('id').inTable('match');
            table.integer('player_id').notNullable().references('id').inTable('player');
            table.double('ppd').notNullable();
            table.double('first_nine_ppd').notNullable();
            table.double('checkout_percentage');
            table.integer('darts_thrown');
            table.integer('60s_plus');
            table.integer('100s_plus');
            table.integer('140s_plus')
            table.integer('180s');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('statistics_x01');
};