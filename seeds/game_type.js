
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('game_type').del()
    .then(function () {
      // Inserts seed entries
      return knex('game_type').insert([
        {id: 1, matches_required: 1, name: 'first to win 1'},
        {id: 2, matches_required: 2, name: 'first to win 2'},
        {id: 3, matches_required: 3, name: 'first to win 3'}
      ]);
    });
};
