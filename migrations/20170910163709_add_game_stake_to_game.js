
exports.up = function(knex, Promise) {
    return knex.schema.table('game', function (table) {
        table.integer('owe_type_id').unsigned();
        
        table.foreign('owe_type_id').references('owe_type.id');
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table('game', function (table) {
        table.dropColumn('owe_type_id');
    })  
};
