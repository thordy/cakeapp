
exports.up = function(knex, Promise) {
    return knex.schema.table('game_type', function (table) {
        table.string('short_name');
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table('game_type', function (table) {
        table.dropColumn('short_name');
    })  
};
