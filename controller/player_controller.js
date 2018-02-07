const debug = require('debug')('kcapp:player-controller');

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const helper = require('../helpers.js');
const axios = require('axios');
const _ = require('underscore');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Add a new player */
router.post('/', function (req, res) {
	axios.post('http://localhost:8001/player', req.body)
		.then(function (response) {
			res.redirect('/player/list');
		}).catch(function (error) {
			helper.renderError(res, error);
		});
});

/* Get specific statistics for a given player */
router.get('/:id/stats', function(req, res) {
	var playerId = req.params.id;
	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var playersMap = response.data;
			axios.get('http://localhost:8001/player/' + playerId + '/statistics')
				.then(response => {
					var statistics = response.data;
					res.render('player_statistics', { player: playersMap[statistics.player_id], statistics: statistics });
				}).catch(error => {
			    	debug('Error when getting player statistics: ' + error);
					helper.renderError(res, error);
				});
		}).catch(function (error) {
			helper.renderError(res, error);
		});
});

/* Get a list of all players */
router.get('/list', function (req, res) {
	axios.get('http://localhost:8001/player')
		.then(response => {
			var players = response.data;
			players = _.sortBy(players, (player) => player.name )
			res.render('players', { players: players });
		}).catch(error => {
		    debug('Error when getting players: ' + error);
			helper.renderError(res, error);
		});
});

/* Get comparable statistics for the given players */
router.get('/compare', function (req, res) {
	var playerIds = req.query.player_id;
	debug('Comparing players %s', playerIds);

	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var players = response.data;
			axios.get('http://localhost:8001/player/compare?id=' + playerIds.join("&id="))
				.then(response => {
					var statistics = response.data;
					res.render('player_comparison', { players: players, statistics: statistics });
				})
				.catch(error => {
			    	debug('Error when comparing players: ' + error);
					helper.renderError(res, error);
				});
		}).catch(function (error) {
			helper.renderError(res, error);
		});
});

module.exports = router