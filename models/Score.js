var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Match = mongoose.model('Match');
var Player = mongoose.model('Player');

var scoreSchema = new Schema({
    match: { type: Match, required: true, unique: false },
    player: { type: Player, required: true, unique: false },
    firstDart: { type: Number, min: 0, default: 0, required: true },
    secondDart: { type: Number, min: 0, default: 0, required: true },
    thirdDart: { type: Number, min: 0, default: 0, required: true }
});

var Score = mongoose.model('Score', scoreSchema);
module.exports = Score;
