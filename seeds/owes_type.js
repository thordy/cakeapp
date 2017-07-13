
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('owe_type').del()
    .then(function () {
      // Inserts seed entries
      return knex('owe_type').insert([
        {id: 1, item: 'Cake'},
        {id: 2, item: 'Beer'}
      ]);
    });
};
