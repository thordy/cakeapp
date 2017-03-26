var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var Player = require.main.require('./models/Player');
var helper = require('../helpers.js');

router.use(bodyParser.json()); // Accept incoming JSON entities

/* Add a new player */
router.post('/', function (req, res) {
	new Player({name: req.body.name})
		.save(null, {method: 'insert'})
		.then(function(player) {
            console.log('Created player: ' + req.body.name);
            res.redirect('/player/list');
		}).catch(function(err) {
			return helper.renderError(res, err);
		});
});

/* Get specific statistics for a given player */
router.get('/:id/stats', function(req, res) {
    new Player({id: req.params.id})
		.fetch()
        .then(function(player) {
            res.render('playerStatistics', {player: player.serialize()});
        }).catch(function(err) {
        console.error(err);
    });
});

/* Get a list of all players */
router.get('/list', function (req, res) {
	Player.query(function(qb){
		qb.orderBy('name','ASC');
	})
		.fetchAll()
		.then(function(players) {
			res.render('players', {players: players.serialize()});
		}).catch(function(err) {
			console.error(err);
		});
	});

module.exports = router