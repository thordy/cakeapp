const debug = require('debug')('dartapp:statistics-controller');

const express = require('express');
const router = express.Router();
const moment = require('moment');

const helper = require('../helpers.js');

const _ = require('underscore');
const axios = require('axios');

router.get('/:from/:to', function(req, res) {
	var from = req.params.from;
    var to = req.params.to;
	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var playersMap = response.data;
			axios.get('http://localhost:8001/statistics/x01/' + from + "/" + to)
				.then(response => {
                    var statistics = response.data;
                    statistics = _.sortBy(statistics, (stats) => -(stats.games_won / stats.games_played) )
                    statistics.from = from
                    statistics.to = to
					res.render('weekly_overview', { players: playersMap, statistics: statistics });
				})
				.catch(error => {
			    	debug('Error when getting player statistics: ' + error);
					helper.renderError(res, error);
				});
		})
		.catch(function (error) {
			helper.renderError(res, error);
		});
});

router.get('/weekly', function (req, res) {
    var from = moment().isoWeekday(1).format('YYYY-MM-DD');
    var to = moment().isoWeekday(7).format('YYYY-MM-DD');
	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var playersMap = response.data;
			axios.get('http://localhost:8001/statistics/x01/' + from + "/" + to)
				.then(response => {
                    var statistics = response.data;
                    statistics = _.sortBy(statistics, (stats) => -(stats.games_won / stats.games_played) )
                    statistics.from = from
                    statistics.to = to
					res.render('weekly_overview', { players: playersMap, statistics: statistics });
				})
				.catch(error => {
			    	debug('Error when getting player statistics: ' + error);
					helper.renderError(res, error);
				});
		})
		.catch(function (error) {
			helper.renderError(res, error);
		});
});

module.exports = router