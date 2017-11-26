function resetUIelements() {
    // Reset UI elements
    window.darts_thrown = 0;
    $('#first').text('');
    $('#first').removeAttr('data-score');
    $('#first').attr('data-multiplier', 1);
    $('#first').attr('data-checkout', 0);
    $('#second').text('');
    $('#second').removeAttr('data-score');
    $('#second').attr('data-multiplier', 1);
    $('#second').attr('data-checkout', 0);
    $('#third').text('');
    $('#third').removeAttr('data-score');
    $('#third').attr('data-multiplier', 1);
    $('#third').attr('data-checkout', 0);
    $('#submit-score-button').data('busted', 0);
    $('#submit-score-button').data('finished', 0);
}

function setupSocketIO(matchId) {
    var socket = io('http://' + window.location.hostname + ':3000/match/' + matchId);
    
    socket.on('connect', function(data) {
        socket.emit('join', 'Client Conneting');
    });

    socket.on('spectator_connected', function(data) {
        alertify.success('Spectator connected');
    });
    
    socket.on('spectator_disconnected', function(data) {
        alertify.warning('Spectator disconnected');
    });

    socket.on('connected', function(data) {
        console.log(data);
    });

    socket.on('match_finished', function(data) {
        // Forward all clients to results page when match is finished
        location.href = 'match/' + matchId + '/leg';
    });

    socket.on('score_update', function(data) {
        $('#submit-score-button').prop('disabled', false);

        var match = data.match;
        $('#round-number').text('R' + match.round_number);

        // Set updated score per player
        var currentPlayerId = data.current_player;
        var players = data.players;
        for (key in players) {
            var player = players[key];
            var td = $('#player-score-' + player.id);
            var label = td.find('.label-player-score');
            label.text(player.current_score);

            if (player.id === currentPlayerId) {
                td.removeClass(1);
                td.addClass('label-active-player ' + player.modifier_class)
                label.attr('id', 'current-player');
                $('#submit-score-button').data('current-player-id', player.id);
            }
            else {
                td.removeClass();
                td.addClass('label-inactive-player ' + player.modifier_class);
                label.attr('id', 'player-label-' + player.id);
                label.removeAttr('data-current-player-id');
            }

            // Update the popover with First 9 and PPD
            var popoverContent = 'First 9: ' + player.first9ppd.toFixed(2) + ', PPD: ' + player.ppd.toFixed(2);
            label.attr('data-content', popoverContent).data('bs.popover').setContent();
        }
        resetUIelements();
    });

    return socket;
}
