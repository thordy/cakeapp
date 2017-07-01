
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('score', function(table) {
            table.increments('id').primary();
            table.integer('match_id').unsigned().notNullable();
            table.integer('player_id').unsigned().notNullable();
            table.integer('first_dart');
            table.integer('second_dart');
            table.integer('third_dart');
            table.integer('first_dart_multiplier').notNullable().default(1);
            table.integer('second_dart_multiplier').notNullable().default(1);
            table.integer('third_dart_multiplier').notNullable().default(1);
            table.integer('round_number').notNullable().default(1);
            table.boolean('is_bust').notNullable().default(0);
            table.boolean('is_checkout_first').notNullable().default(0);
            table.boolean('is_checkout_second').notNullable().default(0);
            table.boolean('is_checkout_third').notNullable().default(0);

            table.foreign('match_id').references('match.id');
            table.foreign('player_id').references('player.id');
            table.timestamps(true, true);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('score');
};
