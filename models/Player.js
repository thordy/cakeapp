'use strict';

var bookshelf = require('../bookshelf');
var Player2match = require.main.require('./models/Player2match');
var StatisticsX01 = require('./StatisticsX01');

function isViliusVisit(visit) {
	if (visit.first_dart_multiplier != 1 || visit.second_dart_multiplier != 1 || visit.third_dart_multiplier != 1) {
		return false;
	}
	if ((visit.first_dart == 20 && visit.second_dart == 0 && visit.third_dart == 20) ||
		(visit.first_dart == 0 && visit.second_dart == 20 && visit.third_dart == 20) ||
		(visit.first_dart == 20 && visit.second_dart == 20 && visit.third_dart == 0)) {
		return true;
	}
	return false;
}

var Player = bookshelf.Model.extend({
    tableName: 'player',
    player2match: function () {
        return this.belongsToMany(Player2Match);
    },
    statistics: function() {
        return this.hasMany(StatisticsX01);
    },
    getPlayersMap: function(scores, match, players) {
        var playersMap = players.reduce(function ( map, player ) {
            map['p' + player.id] = {
                id: player.id,
                name: player.name,
                wins: 0,
                wins_string: ' ',
                ppd: 0,
                first9ppd: 0,
                first9Score: 0,
                totalScore: 0,
                visits: 0,
                modifier_class: '',
                current_score: match.starting_score,
                current: player.id === match.current_player_id ? true : false
            }
            return map;
        }, {});	

        for (var i = 0; i < scores.length; i++) {
            var score = scores[i];
            if (score.is_bust) {
                continue;
            }
            var player = playersMap['p' + score.player_id];

            var visitScore = ((score.first_dart * score.first_dart_multiplier) +
                (score.second_dart * score.second_dart_multiplier) +
                (score.third_dart * score.third_dart_multiplier));
            player.current_score = player.current_score - visitScore;
            player.totalScore += visitScore;
            player.visits += 1;
            if (player.visits <= 3) {
                player.first9Score += visitScore;
            }
        }
        var lastVisit = scores[scores.length - 1];
        if (lastVisit !== undefined) {
            var lastPlayer = playersMap['p' + lastVisit.player_id];
            if (isViliusVisit(lastVisit)) {
                lastPlayer.modifier_class += 'vilius ';
            }
        }
        var lowestScore = undefined;
        for (var id in playersMap) {
            if (lowestScore === undefined || lowestScore > playersMap[id].current_score) {
                lowestScore = playersMap[id].current_score;
            }
        }

        // Set player ppd and first9ppd
        for (var id in playersMap) {
            var player = playersMap[id];
            var dartsThrown = player.visits === 0 ? 1 : (player.visits * 3);

            if (player.visits <= 3) {
                player.first9ppd = player.first9Score / dartsThrown;
            }
            else {
                player.first9ppd = player.first9Score / 9;
            }
            player.ppd = player.totalScore / dartsThrown;

            if (lowestScore < 171 && player.current_score > 199) {
                player.modifier_class += 'beer ';
            }
        }
        return playersMap;
    }
});
module.exports = Player;