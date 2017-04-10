'use strict';

var bookshelf = require('../bookshelf');

var Player = require.main.require('./models/Player');

var StatisticsX01 = bookshelf.Model.extend({
	tableName: 'statistics_x01',
    match: function () {
        return this.belongsTo(Match, 'id');
    },
    player: function () {
        return this.hasOne(Player, ['player_id'])
    },
    getStatistics: function (playerIds, callback) {
		if (playerIds === undefined) {
			return callback('No player ids specified', []);
		}
		var placeHolders = new Array(playerIds.length + 1).join('?,').slice(0, -1);
		bookshelf.knex.raw(`
			SELECT 
				s.*,
				p.name,
				p.games_played AS 'gamesPlayed',
				p.games_won AS 'gamesWon',
				m.winner_id,
				m.starting_score
			FROM statistics_x01 s
			JOIN player p on p.id = s.player_id
			JOIN match m on m.id = s.match_id
			WHERE s.player_id in (` + placeHolders + `)`, playerIds
		)
		.then(function(rows) {
			callback(null, rows);
		})
		.catch(function (err) {
			callback(err)
		});
	},
	getAggregatedStatistics: function (playerIds, callback) {
		if (playerIds === undefined) {
			return callback('No player ids specified', []);
		}
		var placeHolders = new Array(playerIds.length + 1).join('?,').slice(0, -1);
		bookshelf.knex.raw(`
			SELECT 
				SUM(s.ppd) / p.games_played as 'ppd',
				SUM(s.first_nine_ppd) / p.games_played as 'first9ppd',
				SUM(s.'60s_plus') as '60+',
				SUM(s.'100s_plus') as '100+',
				SUM(s.'140s_plus') as '140+',
				SUM(s.'180s') as '180s',
				p.name,
				p.games_played AS 'gamesPlayed',
				p.games_won AS 'gamesWon',
				m.winner_id,
				m.starting_score
			FROM statistics_x01 s
			JOIN player p on p.id = s.player_id
			JOIN match m on m.id = s.match_id
			WHERE s.player_id in (` + placeHolders + `)
			GROUP BY s.player_id`, playerIds
		)
		.then(function(rows) {
			callback(null, rows);
		})
		.catch(function (err) {
			callback(err)
		});
	}
});
module.exports = StatisticsX01;