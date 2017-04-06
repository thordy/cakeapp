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
			qb.where('amount', '>', 0);
		})
		.fetch({ withRelated: ['player_ower', 'player_owee', 'owe_type'] })
		.then(function (rows) {
			var owes = rows.serialize();
			res.render('owes', {owes: owes});
		})
		.catch(function (err) {
			helper.renderError(res, err);
		});
});

/* Method to register a payback between two players */
router.put('/payback', function (req, res) {
	var ower = req.body.ower;	
	var owee = req.body.owee;
	var item = req.body.paybackItem;
	var amount = req.body.paybackAmount;
	
	if (ower === owee) {
		return res.status(400)
			.send('Cannot register a payback between the same user')
			.end();
	}
	Player.findById(ower)
		.exec(function(err, player) {
	    if (err) {
	    	return helper.renderError(res, err);
	    }
	    var owes = player.owes;
	    for (var i = 0; i < owes.length; i ++) {
	    	var owe = owes[i];
	    	if (owe.item === item && owe.owee == owee) {
	    		owe.amount -= amount;
	    		player.save(function(error, player){
	    			debug('%s paid back %s %s to %s', ower, amount, item, owee);
					return res.status(200)
	    				.send()
	    				.end();
	    		});
	    		return;
	    	}
	    }
	    debug('%s does not owe %s any %s', ower, owee, item);
	    res.status(400)
	    	.send('No outstanding owes between selected players!')
	    	.end();
	});		
});

module.exports = router