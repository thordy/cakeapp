
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('match', function(table) {
            table.increments('id').primary();
            table.dateTime('end_time');
            table.integer('starting_score').notNullable();
            table.boolean('is_finished').notNullable().default(0);
            table.integer('current_player_id').unsigned().notNullable();
            table.integer('winner_id').unsigned();

            table.foreign('current_player_id').references('player.id');
            table.foreign('winner_id').references('player.id');
            table.timestamps(true, true);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('match');
};
