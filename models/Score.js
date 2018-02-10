'use strict';
const debug = require('debug')('kcapp:score-model');
const bookshelf = require('../bookshelf');
bookshelf.plugin('registry');

const scoreHelper = require('../lib/score_helper');
const Match = require('./Match');

var Score = bookshelf.Model.extend({
    tableName: 'score',
    match: function() {
        return this.belongsTo('Match', 'id');
    },
    addVisit: function (visit, match, callback) {
        var matchId = visit.match_id;

        var firstDart = visit.first_dart;
        var secondDart = visit.second_dart;
        var thirdDart = visit.third_dart;

        var currentPlayerId = visit.player_id;

        this.getPlayerScore(currentPlayerId, match, function(err, player) {
            if (err) {
                debug('ERROR when trying to get player score player %s, match %s. Err: %s', currentPlayerId, matchId, err);
                return;
            }
            scoreHelper.setVisitModifiers(player.currentScore, firstDart, secondDart, thirdDart);
            var isBust = firstDart.is_bust || secondDart.is_bust || thirdDart.is_bust;
            Score.forge({
                match_id: matchId,
                player_id: currentPlayerId,
                is_bust: isBust,
                first_dart: firstDart.value,
                first_dart_multiplier: firstDart.multiplier,
                is_checkout_first: firstDart.is_checkout_attempt,
                second_dart: secondDart.value,
                second_dart_multiplier: secondDart.multiplier,
                is_checkout_second: secondDart.is_checkout_attempt,
                third_dart: thirdDart.value,
                third_dart_multiplier: thirdDart.multiplier,
                is_checkout_third: thirdDart.is_checkout_attempt
            })
            .save(null, { method: 'insert' })
            .then(function(row) {
                debug('Added score for player %s (%s-%s, %s-%s, %s-%s)', currentPlayerId, firstDart.value, firstDart.multiplier, secondDart.value, 
                    secondDart.multiplier, thirdDart.value, thirdDart.multiplier);
                callback(null, row);
            })
            .catch(function (err) {
                callback(err)
            });
        });
    },
    getPlayerScore: function(playerId, match, callback) {
        Score.forge()
            .where({ player_id: playerId, match_id: match.id })
            .fetchAll()
            .then(function (rows) {
                var scores = rows.serialize();

                var player = {
                    playerId: playerId,
                    currentScore: match.starting_score,
                }
                for (var i = 0; i < scores.length; i++) {
                    var score = scores[i];
                    if (score.is_bust) {
                        continue;
                    }   
                    var visitScore = ((score.first_dart * score.first_dart_multiplier) +
                        (score.second_dart * score.second_dart_multiplier) +
                        (score.third_dart * score.third_dart_multiplier));
                    player.currentScore -= visitScore;
                }            
                callback(null, player);
            })
            .catch(function (err) {
                callback(err)
        });
    }
});
module.exports = bookshelf.model('Score', Score);