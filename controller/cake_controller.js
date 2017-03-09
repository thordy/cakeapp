var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

var moment = require('moment');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Method to get overview over who owes who what */
router.get('/owes', function (req, res, next) {
	res.status(202)
		.send('Not Yet Implemented')
		.end();
	/* connection.query('SELECT p1.name AS "ower",p2.name AS "owee", ot.name as "item", o.amount AS "amount" \
	  FROM owes o\
	  JOIN player p1 ON p1.id = o.player_ower_id \
	  JOIN player p2 ON p2.id = o.player_owee_id \
	  JOIN owe_type ot ON ot.id = o.owe_type_id \
	  WHERE amount > 0', function (error, rows, fields) {
		if (error) {
			return sendError(error, res);
		}

		 var owes = {};
		for (i = 0; i < rows.length; i++) {
			var row = rows[i]
			var name = row.ower;
			var player = {}
			player.owes = [];

			var amount = {};
			amount.player = row.owee;
			amount.amount = row.amount;
			amount.item = row.item;
			player.owes.push(amount);
			if (name in owes) {
				owes[name].owes.push(amount);
			}
			else {
				owes[name] = player
			}
		} 
		var owes = rows;
		connection.query('SELECT pb.id, p1.name AS "payer", p2.name AS "payee", ot.name as "item", payback_date AS "when" FROM payback pb\
			LEFT JOIN player p1 ON p1.id = pb.player_ower_id\
			LEFT JOIN player p2 ON p2.id = pb.player_owee_id\
			JOIN owe_type ot ON ot.id = pb.owe_type_id\
			ORDER BY pb.id', function (error, rows, fields) {
			if (error) {
				return sendError(error, res);
			}
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				row.when = moment(row.when).format('YYYY-MM-DD HH:mm:ss z');
			}

			owes.paybacks = rows;
			res.render('owes', {owes: owes});
		});
	});*/
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