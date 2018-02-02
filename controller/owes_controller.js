const debug = require('debug')('kcapp:owes-controller');

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const helper = require('../helpers.js');

const axios = require('axios');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Method to get overview over who owes who what */
router.get('/owes', function (req, res, next) {
	axios.get('http://localhost:8001/player')
		.then(function (response) {
			var playersMap = response.data;
			axios.get('http://localhost:8001/owe')
				.then(response => {
					var owes = response.data;
					res.render('owes', { owes: owes, players: playersMap });
				})
				.catch(error => {
			    	debug('Error when getting owes: ' + error);
					helper.renderError(res, error);
				});
		})
		.catch(function (error) {
			helper.renderError(res, error);
		});
});

/* Method to register a payback between two players */
router.put('/payback', function (req, res) {
	axios.put('http://localhost:8001/owe/payback', req.body)
	.then(response => {
		return res.status(200).send().end();
	})
	.catch(error => {
    	debug('Error when getting owes: ' + error);
		return res.status(500).send().end();
	});
});

module.exports = router