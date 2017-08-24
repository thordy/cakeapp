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
var moment = require('moment')

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));


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
            var stats = { last_week: lastWeek, this_week: thisWeek };
            res.render('weekly_overview', { weekly: stats });
        });
    });
});

function getStatistics(from, to, callback) {
    bookshelf.knex.raw(`
        SELECT
            p.id as 'player_id',
            p.name AS 'player_name',
            COUNT(DISTINCT m.game_id) AS 'matches_played',
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
        WHERE s.match_id IN (SELECT id FROM \`match\` WHERE end_time >= :from AND end_time < :to)
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
            var matchesWon = _.indexBy(rows[0], 'player_id');
            _.each(matchesWon, function(stats) {
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