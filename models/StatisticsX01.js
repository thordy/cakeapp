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
    getCheckouts: function (playerIds, callback) {
		if (playerIds === undefined) {
			return callback('No player ids specified', []);
		}
		var placeHolders = new Array(playerIds.length + 1).join('?,').slice(0, -1);
		var checkoutStatistics = {};
		bookshelf.knex.raw(`
			SELECT
				MAX(s.id) as 'row_id',
				s.match_id,
				s.player_id,
				IFNULL(s.first_dart * s.first_dart_multiplier, 0) +
				IFNULL(s.second_dart * s.second_dart_multiplier, 0) +
				IFNULL(s.third_dart * s.third_dart_multiplier, 0) as 'checkout'
			FROM score s
			JOIN \`match\` m ON m.id = s.match_id
			WHERE m.winner_id = s.player_id
			AND s.player_id IN (` + placeHolders + `)
			GROUP BY match_id`, playerIds
		)
		.then(function(rows) {
			checkoutStatistics.checkouts = rows[0];
			bookshelf.knex.raw(`
				SELECT
					player_id,
					COUNT(NULLIF(0, is_checkout_first)) +
					COUNT(NULLIF(0, is_checkout_second)) +
					COUNT(NULLIF(0, is_checkout_third)) AS 'checkout_attempts'
				FROM score s
				WHERE (is_checkout_first = 1 OR is_checkout_second = 1 OR is_checkout_third = 1)
				AND player_id IN  (` + placeHolders + `)
				GROUP BY player_id`, playerIds
			)
			.then(function(rows) {
				checkoutStatistics.attempts = rows[0];
				callback(null, checkoutStatistics);
			})
			.catch(function (err) {
				callback(err)
			});
		})
		.catch(function (err) {
			callback(err)
		});
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
			JOIN player p ON p.id = s.player_id
			JOIN \`match\` m ON m.id = s.match_id
			WHERE s.player_id IN (` + placeHolders + `)`, playerIds
		)
		.then(function(rows) {
			callback(null, rows[0]);
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
				SUM(s.ppd) / p.games_played AS 'ppd',
				SUM(s.first_nine_ppd) / p.games_played AS 'first9ppd',
				SUM(s.'60s_plus') AS '60+',
				SUM(s.'100s_plus') AS '100+',
				SUM(s.'140s_plus') AS '140+',
				SUM(s.'180s') AS '180s',
				SUM(accuracy_20) / COUNT(s.id) AS 'accuracy_20',
				SUM(accuracy_19) / COUNT(s.id) AS 'accuracy_19',
				SUM(overall_accuracy) / COUNT(s.id) AS 'overall_accuracy',
				p.name,
				p.games_played AS 'gamesPlayed',
				p.games_won AS 'gamesWon',
				m.winner_id,
				m.starting_score
			FROM statistics_x01 s
			JOIN player p ON p.id = s.player_id
			JOIN \`match\` m ON m.id = s.match_id
			WHERE s.player_id IN (` + placeHolders + `)
			GROUP BY s.player_id`, playerIds
		)
		.then(function(rows) {
			callback(null, rows[0]);
		})
		.catch(function (err) {
			callback(err)
		});
	}
});
module.exports = StatisticsX01;