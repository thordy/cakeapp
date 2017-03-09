var express = require('express')
var bodyParser = require('body-parser')
var router = express.Router()
var moment = require('moment');
var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit : 10,
    host     : 'localhost',
    user     : 'developer',
    password : 'abcd1234',
    database : 'cakedarts'
});


router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded( {extended: true} ));

function sendError(error, res) {
	console.log(error);
	error.error_message = error.message;
  	res.status(500)
  		.send(error)
		.end();
}

function sendResponse(res, json, statusCode) {
	res.status(statusCode)
		.send(json)
		.end();
}

/* Get a list of all matches */
router.get('/list', function (req, res) {
	var query = 'SELECT m.id, m.start_time, m.end_time, m.starting_score, p.name AS "winner", IF(m.end_time IS NULL, FALSE, TRUE) AS "is_finished", \
		  GROUP_CONCAT(p2.name ORDER BY p2.id SEPARATOR ", ") AS "players" FROM matches m \
			JOIN match_players mp ON mp.match_id = m.id \
			LEFT JOIN player p ON p.id = m.winner_player_id \
			JOIN player p2 ON p2.id = mp.player_id \
			GROUP BY m.id ORDER BY m.id';
	connection.query(query, function (error, rows, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  for (var i = 0; i < rows.length; i++) {
	  	var row = rows[i];
		row.start_time = moment(row.start_time).format('YYYY-MM-DD HH:mm:ss z');
		if (row.end_time) {
			row.end_time = moment(row.end_time).format('YYYY-MM-DD HH:mm:ss z');
		}
	  }
	  res.render('matches', {matches: rows});
	});
});

/* Render the match view */
router.get('/:id', function (req, res) {
	var matchId = req.params.id;
	var query = 'SELECT m.id, m.start_time, m.starting_score, GROUP_CONCAT(p.name ORDER BY p.id ) as players FROM matches m \
				JOIN match_players mp ON mp.match_id = m.id \
				JOIN player p ON p.id = mp.player_id WHERE m.id = ?';
	connection.query(query, [matchId], function (error, rows, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  var row = rows[0];
	  row.start_time = moment(row.start_time).format('YYYY-MM-DD HH:mm:ss z');
	  row.players = row.players.split(',');

	  res.render('match', {match: row});
	});
});

/* Render the results view */
router.get('/:id/results', function (req, res) {
	var matchId = req.params.id;
	var query = 'SELECT m.id, m.start_time, m.end_time, TIMEDIFF(m.end_time, m.start_time) AS match_duration, m.starting_score, \
				GROUP_CONCAT(p.name ORDER BY p.id) as players FROM matches m \
				JOIN match_players mp ON mp.match_id = m.id \
				JOIN player p ON p.id = mp.player_id WHERE m.id = ?';
	connection.query(query, [matchId], function (error, rows, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  var query = 'SELECT p.id as "player_id", p.name as "player", dt.first_dart, dt.second_dart, dt.third_dart \
				FROM darts_thrown dt JOIN player p ON p.id = dt.player_id WHERE match_id = ? ORDER BY dt.when';
	  var match = rows[0];
  	match.start_time = moment(match.start_time).format('YYYY-MM-DD HH:mm:ss z');
  	match.end_time = moment(match.end_time).format('YYYY-MM-DD HH:mm:ss z');
  	match.players = match.players.split(',');

		connection.query(query, [matchId], function (error, rows, fields) {
	  	if (error) {
		  	return sendError(error, res);
		  }
			match.darts_thrown = rows;
		  res.render('results', {match: match});
		});
	});
});


/* Method for starting a new match */
router.post('/start', function (req, res) {
	connection.beginTransaction(function(error) {
		if (error) {
			return sendError(error, res);
		}
		var playersArray = req.body.players;
		var startingScore = req.body.matchType;
		connection.query('INSERT INTO matches(start_time, starting_score) VALUES(NOW(), ?)', [startingScore], function (error, results, fields) {
			if (error) {
			  return connection.rollback(function() { throw error; });
			}
			var matchId = results.insertId;
			var query = 'INSERT INTO match_players(match_id, player_id, current_score) VALUES';
			for (i = 0; i < playersArray.length; i++) {
				query += '(' + matchId + ',' + mysql.escape(playersArray[i]) + ',' + mysql.escape(startingScore) + ')';
				if (i < playersArray.length - 1) {
					query += ',';
				}
			}
			connection.query(query, [matchId, req.body.players[i], startingScore], function (error, results, fields) {
				if (error) {
					return connection.rollback(function() { throw error; });
				}
				connection.commit(function(error) {
					if (error) {
				  		return connection.rollback(function() { throw error; });
					}
					console.log('Match successfuly started with ID: ' + matchId);
					res.redirect('/match/' + matchId);
				});
			});
		});
	});
});

/* Method to register three thrown darts
	Expects a JSON body like the following:
	{
		"player_id": <id>,
		"first_dart": <score>,
		"second_dart": <score>,
		"third_dart": <score>
	}
*/
router.put('/:id/throw/', function (req, res) {
	var matchId = req.params.id;
	var playerId = req.body.player_id;
	var firstDart = req.body.first_dart;
	var secondDart = req.body.second_dart;
	var thirdDart = req.body.third_dart;

	var query = 'INSERT INTO cakedarts.darts_thrown(`when`, match_id, player_id, first_dart, second_dart, third_dart) VALUES (NOW(), ?, ?, ?, ?, ?)';
	connection.query(query, [matchId, playerId, firstDart, secondDart, thirdDart], function (error, results, fields) {
		if (error) {
			return sendError(error, res);
		}
		var query = 'SELECT player_id, m.starting_score - (SUM(first_dart) + SUM(second_dart) + SUM(third_dart)) AS remaining_score FROM darts_thrown dt \
					JOIN matches m ON m.id = dt.match_id WHERE match_id = ? AND player_id = ? GROUP BY player_id';
		connection.query(query, [matchId, playerId], function (error, rows, fields) {
			if (error) { throw error }
			sendResponse(res, rows[0], 200);
		});
	});
});

/* Method to cancel a match in progress. Will remove all information about the match */
router.delete('/:id/cancel', function(req, res) {
	var matchId = req.params.id;
	console.log("Cancelled match " + matchId);
	//sendResponse(res, '', 204);
	connection.query('DELETE FROM matches WHERE id = ?', [matchId], function (error, results, fields) {
		if (error) {
			return sendError(error, res);
		}
		// sendResponse(res, '', 204);
		res.redirect('/matches');
	});
});

/* Method to finalize a match
	Expects a JSON body like the following:
	{
 		"id": <id>,
 		"winner_player_id": <id>
	}
*/
router.post('/finish', function (req, res) {
	var matchId = req.body.id;
	var winnerPlayerId = req.winner_player_id;
	connection.query('CALL finalize_match(?, ?)', [matchId, winnerPlayerId], function (error, results, fields) {
		if (error) {
		  return sendError(error, res);
		}
		var status_code = results[0][0].status_code;
		if (status_code !== 0) {
			var status_message = results[1][0].status_message;
			console.log("Unable to finalize match: " + matchId + ", because: " + status_message);
			sendResponse(res, {'status_code': status_code, 'status_message': status_message}, 400);
		}
		else {
			console.log('Match with ID: ' + matchId + ' successfully finalized');
			sendResponse(res, {'match_id': matchId}, 200);
		}
	});
	// connection.beginTransaction(function(error) {
	// 	if (error) {
	// 		return sendError(error, res);
	// 	}
	// 	connection.query('UPDATE matches SET end_time = NOW(), winner_player_id = ? WHERE id = ?', [winnerPlayerId, matchId],
	// 		finalize.bind(this, matchId, winnerPlayerId, res));
	// });
});

function finalize(matchId, winnerPlayerId, res, error, results, fields) {
	if (error) {
	  return connection.rollback(function() { throw error; });
	}
	connection.query('SELECT player_id FROM match_players WHERE match_id = ?', [matchId], function (error, results, fields) {
		if (error) {
			return connection.rollback(function() { throw error; });
		}
		var players = '';
		for (i = 0; i < results.length; i++) {
			players += results[i].player_id + ',';
		}
		players = players.substring(0, players.length - 1);
		connection.query('UPDATE player SET games_played = games_played+1 WHERE id IN (' + players + ')', function (error, results, fields) {
			if (error) {
			  return connection.rollback(function() { throw error; });
			}
			connection.commit(function(error) {
				if (error) {
			  		return connection.rollback(function() { throw error; });
				}
				console.log('Match with ID: ' + matchId + ' successfully finalized');
				sendReponse(res, {'match_id': matchId}, 200);
			});
		});
	});
}

module.exports = router

