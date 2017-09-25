exports.up = function(knex, Promise) {
    return knex.schema.table('owes', function (table) {
        table.unique(['player_ower_id', 'player_owee_id', 'owe_type_id']);
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table('owes', function (table) {
        table.dropUnique(['player_ower_id', 'player_owee_id', 'owe_type_id']);
    })
};
