
exports.up = function(knex, Promise) {
    return knex.schema
        .table('statistics_x01', function(table) {
            table.boolean('accuracy_20');
            table.boolean('accuracy_19');
            table.boolean('overall_accuracy');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('statistics_x01', function(table) {
            table.dropColumn('accuracy_20');
            table.dropColumn('accuracy_19');
            table.dropColumn('overall_accuracy');
        });
};
