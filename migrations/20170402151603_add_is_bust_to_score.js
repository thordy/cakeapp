
exports.up = function(knex, Promise) {
    return knex.schema
        .table('score', function(table) {
            table.boolean('is_bust').notNullable().default(0);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('score', function(table) {
            table.dropColumn('is_bust');
        });
};
