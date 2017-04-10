'use strict';
var bookshelf = require('../bookshelf');
var Player = require.main.require('./models/Player');
var OweType = require.main.require('./models/OweType');

var Owe = bookshelf.Model.extend({
    tableName: 'owes',
    player_ower: function () {
        return this.hasOne(Player, 'id', 'player_ower_id');
    },
    player_owee: function() {
      return this.hasOne(Player, 'id', 'player_owee_id');  
    },
    owe_type: function() {
		return this.belongsTo(OweType, 'owe_type_id', 'id');
    },
    registerPayback: function(ower_id, owee_id, amount, item, callback){
        var itemId = 1;
        if (item === 'Beer') {
            itemId = 2;
        }
        bookshelf.knex('owes')
            .where({
                player_ower_id: ower_id,
                player_owee_id: owee_id,
                owe_type_id: itemId
            })
            .update({
              amount: bookshelf.knex.raw('amount - 1')
            })
            .then(function(updateCount) {
                callback(null, updateCount);
            })
            .catch(function (err) {
                callback(err)
            });
    }
});
module.exports = Owe;