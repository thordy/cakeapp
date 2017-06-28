'use strict';
var debug = require('debug')('dartapp:score-model');
var bookshelf = require('../bookshelf');
bookshelf.plugin('registry');

var Match = require('./Match');

var Score = bookshelf.Model.extend({
    tableName: 'score',
    match: function() {
        return this.belongsTo('Match', 'id');
    },
    addVisit: function (visit, callback) {
        var matchId = visit.matchId;
        var currentPlayerId = visit.playerId;
        var firstDartScore = visit.firstDart === undefined ? 0 : visit.firstDart;
        var secondDartScore = visit.secondDart === undefined ? 0 : visit.secondDart;
        var thirdDartScore = visit.thirdDart === undefined ? 0 : visit.thirdDart;
        var firstDartMultiplier = visit.firstDartMultiplier;
        var secondDartMultiplier = visit.secondDartMultiplier;
        var thirdDartMultiplier = visit.thirdDartMultiplier;
        var isBust = visit.isBust;
        var isCheckoutFirst = visit.isCheckoutFirst;
        var isCheckoutSecond = visit.isCheckoutSecond;
        var isCheckoutThird = visit.isCheckoutThird;

        // Insert new score and change current player in match
        new Score({
            match_id: matchId,
            player_id: currentPlayerId,
            first_dart: firstDartScore,
            second_dart: secondDartScore,
            third_dart: thirdDartScore,
            first_dart_multiplier: firstDartMultiplier,
            second_dart_multiplier: secondDartMultiplier,
            third_dart_multiplier: thirdDartMultiplier,
            is_bust: isBust,
            is_checkout_first: isCheckoutFirst,
            is_checkout_second: isCheckoutSecond,
            is_checkout_third: isCheckoutThird,
        })
        .save(null, { method: 'insert' })
        .then(function(row) {
            debug('Added score for player %s (%s-%s, %s-%s, %s-%s)', currentPlayerId, firstDartScore, 
                firstDartMultiplier, secondDartScore, secondDartMultiplier, thirdDartScore, thirdDartMultiplier);
            callback(null, row);
        })
        .catch(function (err) {
            callback(err)
        });     
    }
});
module.exports = bookshelf.model('Score', Score);