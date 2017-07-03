
exports.up = function(knex, Promise) {
	return knex.schema
		.createTable('statistics_x01', function(table) {
            table.increments('id').primary();
            table.integer('match_id').unsigned().notNullable();
            table.integer('player_id').unsigned().notNullable();
            table.double('ppd').notNullable();
            table.double('first_nine_ppd').notNullable();
            table.double('checkout_percentage');
            table.integer('darts_thrown');
            table.integer('60s_plus');
            table.integer('100s_plus');
            table.integer('140s_plus')
            table.integer('180s');
            table.double('accuracy_20');
            table.double('accuracy_19');
            table.double('overall_accuracy');

            table.foreign('match_id').references('match.id');
            table.foreign('player_id').references('player.id');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('statistics_x01');
};