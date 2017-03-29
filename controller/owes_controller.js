var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var Player = require.main.require('./models/Player');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));

/* Method to get overview over who owes who what */
router.get('/owes', function (req, res, next) {
	Player.find({})
		.sort('name')
		.populate('owes.owee')
		.exec(function (err, players) {
			res.render('owes', {owes: players});
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
	    			console.log(ower + " paid back '" + amount + "' '" + item + "' to " + owee);
					return res.status(200)
	    				.send()
	    				.end();
	    		});
	    		return;
	    	}
	    }
	    console.log(ower + ' does not owe ' + owee + ' any ' + item);
	    res.status(400)
	    	.send('No outstanding owes between selected players!')
	    	.end();
	});		
});

module.exports = router