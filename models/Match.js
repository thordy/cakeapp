var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dartsPlayer = new Schema({
	name: { type: String, required: true, unique: true }
});

var matchSchema = new Schema({
  startTime: { type: Date, required: true },
  endTime: Date,
  startingScore: { type: Number, required: true, min: 301, max: 1701, default: 301 },
  players: { type: Array, required: true },
  currentPlayer: dartsPlayer,
  isFinished: { type: Boolean, required: true, default: false },
  winnerPlayerId: Number
});

matchSchema.method('setPlayers', function(players) {
    for (var i in players) {
		this.players.push({
        	name: players[i],
        	current_score: this.startingScore
        });
	}
});
var Match = mongoose.model('Match', matchSchema);

module.exports = Match;