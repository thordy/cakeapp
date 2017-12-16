var debug = require('debug')('dartapp:statistics-controller');

var express = require('express');
var bodyParser = require('body-parser');
var bookshelf = require.main.require('./bookshelf.js');
var router = express.Router();
var moment = require('moment');
var Match = require.main.require('./models/Match');
var Player2match = require.main.require('./models/Player2match');
var StatisticsX01 = require.main.require('./models/StatisticsX01');
var helper = require('../helpers.js');
var _ = require('underscore');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

router.get('/:from/:to', function(req, res) {
	var from = req.params.from;
	var to = req.params.to;
    getStatistics(from, to, (err, stats) => {
        if (err) {
            return helper.renderError(res, err);
        }
        var stats = {
            last_week: null,
            this_week: _.sortBy(stats, (player) => -(player.games_won / player.games_played) ),
            from: from,
            to: to
        }
        res.render('weekly_overview', { weekly: stats });
    });
});

router.get('/weekly', function (req, res) {
    var from = moment().isoWeekday(-6).format('YYYY-MM-DD');
    var to = moment().isoWeekday(0).format('YYYY-MM-DD');
    getStatistics(from, to, (err, lastWeek) => {
        if (err) {
            return helper.renderError(res, err);
        }
        var from = moment().isoWeekday(1).format('YYYY-MM-DD');
        var to = moment().isoWeekday(7).format('YYYY-MM-DD');
        getStatistics(from, to, (err, thisWeek) => {
            if (err) {
                return helper.renderError(res, err);
            }
            var stats = {
                last_week: _.sortBy(lastWeek, (player) => -(player.games_won / player.games_played) ),
                this_week: _.sortBy(thisWeek, (player) => -(player.games_won / player.games_played) ),
                from: from,
                to: to
            }
            res.render('weekly_overview', { weekly: stats });
        });
    });
});

router.get('/league', function (req, res) {
    res.render('leaguerepublic' );
});

function getStatistics(from, to, callback) {
    bookshelf.knex.raw(`
        SELECT
            p.id as 'player_id',
            p.name AS 'player_name',
            COUNT(DISTINCT g.id) AS 'games_played',
            0 as 'games_won', -- This will be updated in the next query
            SUM(s.ppd) / COUNT(p.id) AS 'ppd',
            SUM(s.first_nine_ppd) / COUNT(p.id) AS 'first_nine_ppd',
            SUM(60s_plus) AS '60s_plus',
            SUM(100s_plus) AS '100s_plus',
            SUM(140s_plus) AS '140s_plus',
            SUM(180s) AS '180s',
            SUM(accuracy_20) / COUNT(accuracy_20) AS 'accuracy_20',
            SUM(accuracy_19) / COUNT(accuracy_19) AS 'accuracy_19',
            SUM(overall_accuracy) / COUNT(overall_accuracy) AS 'overall_accuracy'
        FROM statistics_x01 s
            JOIN player p ON p.id = s.player_id
            JOIN \`match\` m ON m.id = s.match_id
            JOIN game g ON g.id = m.game_id
        WHERE g.id IN (SELECT id FROM game WHERE updated_at >= :from AND updated_at < :to)
        AND g.is_finished = 1
        GROUP BY p.id`, {from: from, to: to})
    .then(function(rows) {
        var weeklyStatistics = _.indexBy(rows[0], 'player_id');
        bookshelf.knex.raw(`
            SELECT
                p.id AS 'player_id',
                p.name AS 'player',
                COUNT(g.winner_id) AS 'games_won'
            FROM game g
                JOIN player p ON p.id = g.winner_id
            WHERE g.updated_at >= :from AND g.updated_at < :to
            GROUP BY g.winner_id`, {from: from, to: to})
        .then(function(rows) {
            var gamesWon = _.indexBy(rows[0], 'player_id');
            // Set games won for each player
            _.each(gamesWon, function(stats) {
                var weekly = weeklyStatistics[stats.player_id];
                weekly.games_won = stats.games_won;
            });
            callback(null, weeklyStatistics);
        })
        .catch(function (err) {
            callback(err);
        });
    })
    .catch(function (err) {
        callback(err);
    });
}


module.exports = router