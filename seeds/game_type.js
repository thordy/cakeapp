
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('game_type').del()
    .then(function () {
      // Inserts seed entries
      return knex('game_type').insert([
        {id: 1, wins_required: 1, matches_required: 1, name: 'No sets', short_name: 'SG'},
        {id: 2, wins_required: 2, matches_required: null, name: 'First to win 2', short_name: 'BO3'},
        {id: 3, wins_required: 3, matches_required: null, name: 'First to win 3', short_name: 'BO5'},
        {id: 4, wins_required: 2, matches_required: 2, name: 'Best of 2', short_name: 'BO2'},
        {id: 5, wins_required: 3, matches_required: 4, name: 'Best of 4', short_name: 'BO4'}
      ]);
    });
};
