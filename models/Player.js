var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var playerSchema = new Schema({
  name: { type: String, required: true, unique: true },
  gamesPlayed: { type: Number, min: 0, default: 0 },
  gamesWon: { type: Number, min: 0, default: 0 },
  ppd: { type: Number, min: 0, default: 0 },
  first9ppd: { type: Number, min: 0, default: 0 }
});

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;