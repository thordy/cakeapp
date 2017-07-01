
exports.up = function(knex, Promise) {
    return knex.schema.table('match', function (table) {
        table.integer('game_id').unsigned().notNullable().default(0);
        
        table.foreign('game_id').references('game.id');
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table('match', function (table) {
        table.dropColumn('game_id');
    })  
};
