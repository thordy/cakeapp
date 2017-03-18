var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Match = mongoose.model('Match');
var Player = mongoose.model('Player');

var scoreSchema = new Schema({
    match: {type: ObjectId, ref: 'Match', required: true, unique: false},
    player: {type: ObjectId, ref: 'Player', required: true, unique: false},
    firstDart: { type: Number, min: 0, max: 60, default: 0, required: true },
    secondDart: { type: Number, min: 0, max: 60, default: 0, required: true },
    thirdDart: { type: Number, min: 0, max: 60, default: 0, required: true }
},
{
	timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

var Score = mongoose.model('Score', scoreSchema);
module.exports = Score;
