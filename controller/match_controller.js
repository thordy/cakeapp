var express = require('express');
var bodyParser = require('body-parser');
var Bookshelf = require.main.require('./bookshelf.js');
var router = express.Router();
var moment = require('moment');
var Player = require.main.require('./models/Player');
var Match = require.main.require('./models/Match');
var Score = require.main.require('./models/Score');
var Player2match = require.main.require('./models/Player2match');
var helper = require('../helpers.js');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));


/* Get a list of all matches */
router.get('/list', function (req, res) {
    // Get collection of matches
    var Matches = Bookshelf.Collection.extend({
        model: Match
    });

    // Fetch related players
    new Matches()
        .fetch({ withRelated: 'players' })
        .then(function(match) {
            console.log(match);
            res.render('matches', {matches: match.serialize()});
        }).catch(function(err) {
            console.error(err);
        });
});

/* Render the match view */
router.get('/:id', function (req, res) {
    Match.query('where', 'id', '=', req.params.id)
        .fetch({ withRelated: 'players' })
        .then(function(match) {
            res.render('match', {match: match.serialize(), players: match.related('players').serialize() });
        }).catch(function(err) {
        console.error(err);
    });
});

/* Render the results view */
router.get('/:id/results', function (req, res) {
    Match.findById(req.params.id)
        .populate('players')
        .populate('winner')
        .exec(function (err, match) {
            if (err) {
                return helper.renderError(res, err);
            }
            Score.find({match: match._id})
                .populate('player')
                .exec(function (err, scores) {
                     if (err) {
                        return helper.renderError(res, err);
                    }
                    match.scores = scores;
                    res.render('results', {match: match});
                });
        });
});

/* Method for starting a new match */
router.post('/new', function (req, res) {
    if (req.body.players === undefined) {
        console.log('No players specified, unable to start match');
        return res.redirect('/');
    }

    // Get first player in the list, order should be handled in frontend
    var currentPlayerId = req.body.players[0];

    new Match({
        starting_score: req.body.matchType,
        start_time: Math.floor(Date.now() / 1000),
        current_player_id: currentPlayerId
    })
        .save(null, {method: 'insert'})
        .then(function(match) {
            console.log('Created match: ' + match.id);

            var playersArray = req.body.players;
            var playerOrder = 1;
            var playersInMatch = [];
            for (var i in playersArray) {
                playersInMatch.push({
                    player_id: playersArray[i],
                    match_id: match.id,
                    order: playerOrder
                });
                playerOrder++;
            }

            Bookshelf.knex('player2match')
                .insert(playersInMatch)
                .then(function(rows) {
                    console.log('Added players: ' + playersInMatch);
                    res.redirect('/match/' + match.id);
                })
                .catch(function(err) {
                    return helper.renderError(res, err);
                });
        }).catch(function(err) {
            return helper.renderError(res, err);
        });
});

/* Method to register three thrown darts */
router.post('/:id/throw', function (req, res) {
    // Assign those values to vars since they will be used in other places
    var matchId = req.body.matchId;
    var playerId = req.body.playerId;
    var firstDartScore = req.body.firstDart;
    var secondDartScore = req.body.secondDart;
    var thirdDartScore = req.body.thirdDart;

    // Insert new score
    var score = new Score({
        match: matchId,
        player: playerId,
        firstDart: firstDartScore,
        secondDart: secondDartScore,
        thirdDart: thirdDartScore
    });

    // TODO substract scored points from player's score in the match

    // TODO change current player in match

    score.save(function (err) {
        if (err) {
            return helper.renderError(res, err);
        }
        res.redirect('/match/' + matchId);
    });
});

/* Method to cancel a match in progress */
router.delete('/:id/cancel', function (req, res) {
    Match.remove({_id: req.params.id}, function (err) {
        if (err) {
            return helper.renderError(res, err);
        }
        res.status(204)
            .send()
            .end();
    });
});

/* Method to finalize a match */
router.post('/finish', function (req, res) {
    res.status(202)
        .send('Not Yet Implemented')
        .end();
});

module.exports = router

