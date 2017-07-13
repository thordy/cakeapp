exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('game', function(table) {
            table.increments('id').primary();
            table.boolean('is_finished').notNullable().default(0)
            table.integer('current_match_id').unsigned();
            table.integer('game_type_id').unsigned().notNullable();
            table.integer('winner_id').unsigned();

            table.foreign('game_type_id').references('game_type.id');
            table.foreign('winner_id').references('player.id');
            table.timestamps(true, true);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('game');
};