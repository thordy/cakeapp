var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var Player = mongoose.model('Player');

var matchSchema = new Schema({
	startTime: {type: Date, required: true},
	endTime: Date,
	startingScore: {type: Number, required: true, min: 301, max: 1701, default: 301},
	players: [{type: ObjectId, ref: 'Player', required: true}],
	currentPlayer: {type: ObjectId, ref: 'Player', required: true},
	isFinished: {type: Boolean, required: true, default: false},
  	stake: String,
	winner: String
},
{
	timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

matchSchema.method('setPlayers', function (players) {
	// Check if this is a single player game
	if (Array.isArray(players) === false) {
		this.players = [players];
		this.currentPlayer = players;
	} else {
		this.players = players;
		this.currentPlayer = players[0];
	}
});

var Match = mongoose.model('Match', matchSchema);

module.exports = Match;