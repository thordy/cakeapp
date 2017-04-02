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
    }
});
module.exports = Owe;