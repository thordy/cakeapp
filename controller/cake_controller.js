var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var Player = require.main.require('./models/Player');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Method to get overview over who owes who what */
router.get('/owes', function (req, res, next) {
	Player.find({})
		.sort('name')
		.populate('owes.owee')
		.exec(function (err, players) {
			res.render('owes', {owes: players});
	});
});

/* Method to register a payback of cake between two players
	Expects a JSON body like the following:
	{
		"payer_id": <id>,
		"payee_id": <id>
	}
*/
router.put('/payback', function (req, res) {
	res.status(202)
		.send('Not Yet Implemented')
		.end();
});

module.exports = router