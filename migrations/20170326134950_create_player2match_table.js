
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('player2match', function(table) {
            table.increments('id').primary();
            table.integer('match_id').unsigned().notNullable();
            table.integer('player_id').unsigned().notNullable();
            table.integer('order').notNullable();

            table.foreign('match_id').references('match.id');
            table.foreign('player_id').references('player.id');
            table.timestamps(true, true);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('player2match');
};
