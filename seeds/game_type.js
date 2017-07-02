
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('game_type').del()
    .then(function () {
      // Inserts seed entries
      return knex('game_type').insert([
        {id: 1, matches_required: 1, name: 'No sets', short_name: 'SG'},
        {id: 2, matches_required: 2, name: 'Best of 3', short_name: 'BO3'},
        {id: 3, matches_required: 3, name: 'Best of 5', short_name: 'BO5'}
      ]);
    });
};
