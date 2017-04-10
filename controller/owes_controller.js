var debug = require('debug')('dartapp:owes-controller');

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var Bookshelf = require.main.require('./bookshelf.js');
var Player = require.main.require('./models/Player');
var Owe = require.main.require('./models/Owe');
var helper = require('../helpers.js');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

/* Method to get overview over who owes who what */
router.get('/owes', function (req, res, next) {
	Owe.collection()
		.query(function(qb) {
			qb.orderBy('player_ower_id','ASC');
			qb.where('amount', '<>', 0);
		})
		.fetch({ withRelated: ['player_ower', 'player_owee', 'owe_type'] })
		.then(function (rows) {
			var owes = rows.serialize();
			Player
				.fetchAll()
				.then(function(players) {
					res.render('owes', { owes: owes, players: players.serialize() });
				})
				.catch(function(err) {
					helper.renderError(res, err);
				});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Method to register a payback between two players */
router.put('/payback', function (req, res) {
	var ower = req.body.ower;	
	var owee = req.body.owee;
	var item = req.body.item;
	var amount = req.body.amount;
	
	if (ower === owee) {
		return res.status(400)
			.send('Cannot register a payback between the same user')
			.end();
	}

	new Owe().registerPayback(ower, owee, amount, item, function(err, updateCount) {
		if (err) {
			return helper.renderError(res, err);
		}

		if (updateCount === 0) {
			debug('Did not payback anything...');
			return res.status(500).send().end();
		}
		debug('player %s paid back %s %s to player %s', ower, amount, item, owee);
		return res.status(200)
			.send()
			.end();
	});
});

module.exports = router