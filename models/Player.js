var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var owesSchema = new Schema({
    item: { type: String, required: true },
    owee: { type: ObjectId, ref: 'Player', required: true },
    amount: { type: Number, default: 0 }
});
var Owes = mongoose.model('Owes', owesSchema);

var playerSchema = new Schema({
  name: { type: String, required: true, unique: true },
  gamesPlayed: { type: Number, min: 0, default: 0 },
  gamesWon: { type: Number, min: 0, default: 0 },
  ppd: { type: Number, min: 0, default: 0 },
  first9ppd: { type: Number, min: 0, default: 0 },
  owes: [owesSchema]
});

playerSchema.method('addOwes', function(oweePlayerId, item, amount) {
  var owe = { owee: oweePlayerId, item: item, amount: amount };
  if (this.owes.length === 0) {
    this.owes.push(owe);
  }
  else {
    var found = false;
    for (var i = 0; i < this.owes.length; i++) {
      if (this.owes[i].item === item) {
        this.owes[i].amount += amount;
        found = true;
        break;;
      }
    }
    if (found === false) {
      this.owes.push(owe);
    }
  }
});

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;