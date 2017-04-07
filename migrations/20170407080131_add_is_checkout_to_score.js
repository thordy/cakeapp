
exports.up = function(knex, Promise) {
    return knex.schema
        .table('score', function(table) {
            table.boolean('is_checkout_first').notNullable().default(0);
            table.boolean('is_checkout_second').notNullable().default(0);
            table.boolean('is_checkout_third').notNullable().default(0);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('score', function(table) {
            table.dropColumn('is_checkout_first');
            table.dropColumn('is_checkout_second');
            table.dropColumn('is_checkout_third');
        });
};
