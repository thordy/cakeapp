
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('player', function(table) {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.integer('games_played').notNullable().default(0);
            table.integer('games_won').notNullable().default(0);
            table.float('ppd');
            table.float('first_nine_ppd');
            table.timestamps(true, true);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('player');
};

