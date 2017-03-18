var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var moment = require('moment');
var Player = require.main.require('./models/Player');
var Match = require.main.require('./models/Match');
var helper = require('../helpers.js');

router.use(bodyParser.json()); // Accept incoming JSON entities
router.use(bodyParser.urlencoded({extended: true}));


/* Get a list of all matches */
router.get('/list', function (req, res) {
    Match.find({})
        .sort('startingTime')
        .populate('players')
        .populate('winner')
        .exec(function (err, matches) {
            if (err) {
                return helper.renderError(res, err);
            }
            res.render('matches', {matches: matches});
        });
});

/* Render the match view */
router.get('/:id', function (req, res) {
    Match.findById(req.params.id)
    .populate('players')
    .exec(function (err, match) {
        if (err) {
            return helper.renderError(res, err);
        }        
        res.render('match', {match: match});
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
            res.render('results', {match: match});
        });
});


/* Method for starting a new match */
router.post('/new', function (req, res) {
    if (req.body.players === undefined) {
        console.log('No players specified, unable to start match');
        return res.redirect('/');
    }
    var match = new Match({
        startingScore: req.body.startingScore,
        stake: req.body.matchStake,
        startTime: moment().add(-30, 'minutes')
    });
    match.setPlayers(req.body.players);
    match.save(function (err) {
        if (err) {
            return helper.renderError(res, err);
        }
        res.redirect('/match/' + match.id);
    });
});

/* Method to register three thrown darts */
router.put('/:id/throw/', function (req, res) {
    var matchId = req.params.id;
    var playerId = req.body.player_id;
    var firstDart = req.body.first_dart;
    var secondDart = req.body.second_dart;
    var thirdDart = req.body.third_dart;

    res.status(202)
        .send('Not Yet Implemented')
        .end();
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

