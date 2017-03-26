
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('score', function(table) {
            table.increments('id').primary();
            table.integer('match_id').notNullable();
            table.integer('player_id').notNullable();
            table.integer('first_dart');
            table.integer('second_dart');
            table.integer('third_dart');
            table.integer('first_dart_multiplier').notNullable().default(1);
            table.integer('second_dart_multiplier').notNullable().default(1);
            table.integer('third_dart_multiplier').notNullable().default(1);
            table.integer('round_number').notNullable().default(1);
            table.foreign('match_id').references('match.id');
            table.foreign('player_id').references('player.id');
            table.timestamps();
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('score');
};
