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
	var rows = [
		{id: 1, start_time: '2017-03-04 17:51', end_time: '2017-03-04 18:23', starting_score: 301,
			winner: 'Player 1', players: ['Player 1', 'Player 2'], is_finished: true},
		{id: 2, start_time: '2017-03-04 17:51', starting_score: 301, players: ['Player 1', 'Player 2'], is_finished: false}
	];

	res.render('matches', {matches: rows});

	/*
	var query = 'SELECT m.id, m.start_time, m.end_time, m.starting_score, p.name AS "winner", GROUP_CONCAT(p2.name SEPARATOR ", ") AS "players" FROM matches m \
			JOIN match_players mp ON mp.match_id = m.id \
			JOIN player p ON p.id = m.winner_player_id \
			JOIN player p2 ON p2.id = mp.player_id \
			GROUP BY m.id ORDER BY m.id';
	connection.query(query, function (error, rows, fields) {
	  if (error) {
	  	return sendError(error, res);
	  }
	  for (var i = 0; i < rows.length; i++) {
	  	var row = rows[i];
		row.start_time = moment(row.start_time).format('YYYY-MM-DD HH:mm:ss z');
		row.end_time = moment(row.end_time).format('YYYY-MM-DD HH:mm:ss z');
	  }
	  res.render('matches', {matches: rows});
	});
	*/
});

/* Render the match view */
router.get('/:id', function (req, res) {
	// TODO Read from database
	var match = {};
	match.id = req.params.id;
	match.starting_score = 301;
	match.players = [{id: 1, name: 'Player 1'}, {id: 2, name: 'Player 2'}, {id: 3, name: 'Player 3'}];

	res.render('match', {match: match});
});

router.get('/:id/results', function (req, res) {
	// TODO Read from Database
	var match = {};
	match.id = req.params.id;
	match.starting_score = 301;
	match.start_time = '2017-03-04 17:51';
	match.end_time = '2017-03-04 18:21';
	match.players = [
		{id: 1, name: 'Test Player', games_won: 3, games_played: 12, win_percentage: 30},
		{id: 2, name: 'Test Player 2', games_won: 4, games_played: 11, win_percentage: 30}
	];
	match.darts_thrown = [
		{player: 'Player 1', first_dart: 20, second_dart: 20, third_dart: 3}, 
		{player: 'Player 2', first_dart: 60, second_dart: 5, third_dart: 20},
		{player: 'Player 1', first_dart: 19, second_dart: 7, third_dart: 21},
		{player: 'Player 2', first_dart: 60, second_dart: 60, third_dart: 5}
	];

	res.render('results', {match: match});
});


/* Method for starting a new match */
router.post('/start', function (req, res) {
	var matchId = 2;
	var players = req.body.players;
	var startingScore = req.body.startingScore;

	res.redirect('/match/' + matchId);
	/*connection.beginTransaction(function(error) {
		if (error) {
			return sendError(error, res);
		}
		var playersArray = req.body.players;
		var startingScore = req.body.starting_score;
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

					var query = 'SELECT m.id AS match_id, m.start_time, m.starting_score, CONCAT("[", GROUP_CONCAT(mp.player_id), "]") AS players FROM matches m JOIN match_players mp ON mp.match_id = m.id WHERE m.id = ?';
					connection.query(query, [matchId], function (error, rows, fields) {
						if (error) {
							return sendError(error, res);
						}
						var startedMatch = rows[0];
						startedMatch.players = JSON.parse(startedMatch.players);
						sendResponse(res, startedMatch, 201);
					});
				});
			});
		});
	});
	*/
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

