exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('game_type', function(table) {
            table.increments('id').primary();
            table.integer('wins_required').unsigned().notNullable();
            table.integer('matches_required').unsigned().notNullable();
            table.string('name').notNullable();
            table.timestamps(true, true);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('game_type');
};