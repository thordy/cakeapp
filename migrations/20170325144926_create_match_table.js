
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('match', function(table) {
            table.increments('id').primary();
            table.dateTime('start_time').notNullable();
            table.dateTime('end_time');
            table.integer('starting_score').notNullable();
            table.boolean('is_finished').notNullable().default(0);
            table.integer('current_player_id').notNullable();
            table.integer('current_round').notNullable().default(1);
            table.integer('winner_id');
            table.foreign('current_player_id').references('player.id');
            table.foreign('winner_id').references('player.id');
            table.timestamps();
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('match');
};
