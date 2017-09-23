var debug = require('debug')('dartapp:socket-handler');
var Match = require.main.require('./models/Match');
var Score = require.main.require('./models/Score');
var Player = require.main.require('./models/Player');

module.exports = (io) => {
	this.io = io;
  	return {
		emitMessage: (matchId, type, message) => {
			var nsp = this.io.of('/match/' + matchId);
			nsp.emit(type, message);
		},
		removeNamespace: (matchId) => {
			if (matchId === undefined) {
				return;
			}
			var namespace = '/match/' + matchId;
			delete io.nsps[namespace];
			debug("Removed socket.io namespace '%s'", namespace)
		},
    	setupNamespace: (matchId) => {
			if (matchId === undefined) {
					return;
			}
			var namespace = '/match/' + matchId;
			var nsp = this.io.of(namespace);
			nsp.on('connection', function(client){
				debug('Client connected: ' + client.handshake.address);

				client.on('join', function(data) {
					client.emit('connected', 'Connected to server');
				});

				client.on('spectator_connected', function(data) {
					nsp.emit('spectator_connected', data);
				});

				client.on('disconnect', function(){
					debug('Client disconnected: ' + client.handshake.address);
					nsp.emit('spectator_disconnected');
				});
				client.on('possible_throw', function(data) {
					nsp.emit('possible_throw', data);
				});
				client.on('undo_throw', function(data) {
					nsp.emit('possible_throw', data);
				});

				client.on('throw', function(data) {
					debug('Received throw from ' + client.handshake.address);
					var body = JSON.parse(data);
					var matchId = body.matchId;

					new Score().addVisit(body, function(err, rows) {
						if (err) {
							debug('ERROR: ' + err);
							nsp.emit('error', err);
							return;
						}
						var match = new Match();

						match.setCurrentPlayer(matchId, body.playerId, body.playersInMatch, function(err, match) {
							if (err) {
								debug('ERROR: ' + err);
								nsp.emit('error', err);
								return;
							}
							match.getMatch(matchId, function(err, match) {
								if (err) {
									debug('ERROR: ' + err);
									nsp.emit('error', err);
									return;
								}
								var scores = match.related('scores').serialize();
								var players = match.related('players').serialize();
								var match = match.serialize();
								// Set the round number
								match.round_number = Math.floor(scores.length / players.length) + 1;

								var playersMap = new Player().getPlayersMap(scores, match, players);

								nsp.emit('score_update', {
									players: playersMap,
									match: match,
									visits: scores,
									current_player: match.current_player_id
								});
							});
						});
					});
				});
			});
			debug("Created socket.io namespace '%s'", namespace);
		}
  	};
};