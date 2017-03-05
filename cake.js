var express = require('express')
var bodyParser = require('body-parser')
var router = express.Router()
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'developer',
  password : 'abcd1234',
  database : 'cakedarts'
});

router.use(bodyParser.json()); // Accept incoming JSON entities

function sendError(error, res) {
	console.log(error);
	error.error_message = error.message;
	res.render('error', {error: error});
  	/*res.status(500)
  		.send(error)
		.end();*/
}

function sendResponse(res, json, statusCode) {
	res.status(statusCode)
		.send(json)
		.end();
}

/* Method to get overview over who owes who cake */
router.get('/owes', function (req, res, next) {
	var owes = [
		{ower: "Player 1", owee: "Player 2", item: "Cake", amount: 1},
		{ower: "Player 1", owee: "Player 2", item: "Beer", amount: 2},
		{ower: "Player 2", owee: "Player 1", item: "Beer", amount: 1},
		{ower: "Player 2", owee: "Player 1", item: "Cake", amount: 0}
	];
	owes.paybacks = [
		{when: '2017-04-01 15:49', payer: 'Player 1', payee: 'Player 2', item: 'Cake'},
		{when: '2017-04-03 15:56', payer: 'Player 2', payee: 'Player 1', item: 'Cake'},
		{when: '2017-04-05 15:32', payer: 'Player 2', payee: 'Player 1', item: 'Cake'}
	];

	res.render('owes', {owes: owes});
	/*connection.query('SELECT p1.name AS "ower",p2.name AS "owee", ot.name as "item", o.amount AS "amount" \
	  FROM owes o\
	  JOIN player p1 ON p1.id = o.player_ower_id \
	  JOIN player p2 ON p2.id = o.player_owee_id \
	  JOIN owe_type ot ON ot.id = o.owe_type_id', function (error, rows, fields) {
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
		sendResponse(res, owes, 200);
	});*/
});

/* Method to get payback log over who owes who cake */
router.get('/paybacklog', function (req, res, next) {
	connection.query('SELECT pb.id, p1.name AS "payer", p2.name AS "payee", ot.name as "item", payback_date AS "when" FROM payback pb\
			LEFT JOIN player p1 ON p1.id = pb.player_ower_id\
			LEFT JOIN player p2 ON p2.id = pb.player_owee_id\
			JOIN owe_type ot ON ot.id = pb.owe_type_id\
			ORDER BY pb.id', function (error, rows, fields) {
		if (error) {
			return sendError(error, res);
		}
		sendResponse(res, rows, 200);
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
	connection.beginTransaction(function(error) {
		if (error) {
			return next(error);
			// return sendError(error, res);
		}
		var body = req.body;
		var query = 'INSERT INTO payback (player_ower_id, player_owee_id, payback_date) VALUES (?, ?, NOW())';
		connection.query(query, [body.payer_id , body.payee_id], function (error, results, fields) {
			if (error) {
				return connection.rollback(function() { throw error; });
			}
			connection.query('UPDATE owes SET amount = amount-1 WHERE player_ower_id = ? AND player_owee_id = ?', [body.payer_id, body.payee_id], function (error, results, fields) {
				if (error) {
					return connection.rollback(function() { throw error; });
				}
				connection.commit(function(error) {
					if (error) {
				  		return connection.rollback(function() { throw error; });
					}
					console.log('Sucessfully registered payback between users: ' + body.payer_id + ' and ' + body.payee_id);
					sendResponse(res, {'message': 'Payback logged between: ' + body.payer_id + ' and ' + body.payee_id}, 200);
				});
			});
		});
	});
});

module.exports = router