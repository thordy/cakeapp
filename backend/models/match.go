package models

import "github.com/guregu/null"

// Match struct used for storing matches
type Match struct {
	ID              int             `json:"id"`
	Endtime         null.String     `json:"end_time"`
	StartingScore   int             `json:"starting_score"`
	IsFinished      bool            `json:"is_finished"`
	CurrentPlayerID int             `json:"current_player_id"`
	WinnerPlayerID  null.Int        `json:"winner_player_id"`
	CreatedAt       string          `json:"created_at"`
	UpdatedAt       string          `json:"updated_at"`
	GameID          int             `json:"game_id"`
	Players         []int           `json:"players,omitempty"`
	DartsThrown     int             `json:"darts_thrown,omitempty"`
	Visits          []*Visit        `json:"visits"`
	Hits            map[int64]*Hits `json:"hits,omitempty"`
}

// Player2Match struct used for stroring players in a match
type Player2Match struct {
	MatchID         int   `json:"match_id"`
	PlayerID        int   `json:"player_id"`
	Order           int   `json:"order"`
	CurrentScore    int64 `json:"current_score"`
	IsCurrentPlayer bool  `json:"is_current_player"`
	Wins            int   `json:"wins,omitempty"`
}

// GetMatches returns all matches for the given game ID
func GetMatches(gameID int) ([]*Match, error) {
	rows, err := db.Query(`
		SELECT
			id, end_time, starting_score, is_finished, current_player_id, winner_id, created_at, updated_at, game_id
		FROM `+"`match`"+` WHERE game_id = ?`, gameID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	matches := make([]*Match, 0)
	for rows.Next() {
		m := new(Match)
		err := rows.Scan(&m.ID, &m.Endtime, &m.StartingScore, &m.IsFinished, &m.CurrentPlayerID, &m.WinnerPlayerID, &m.CreatedAt, &m.UpdatedAt, &m.GameID)
		if err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return matches, nil
}

// GetMatch returns a match with the given ID
func GetMatch(id int) (*Match, error) {
	m := new(Match)
	var players string
	err := db.QueryRow(`
		SELECT
			m.id, end_time, starting_score, is_finished, current_player_id, winner_id, m.created_at, m.updated_at, m.game_id, GROUP_CONCAT(DISTINCT p2m.player_id) AS 'players'
		FROM `+"`match` m"+`
		LEFT JOIN player2match p2m ON p2m.match_id = m.id
		WHERE m.id = ?`, id).Scan(&m.ID, &m.Endtime, &m.StartingScore, &m.IsFinished, &m.CurrentPlayerID, &m.WinnerPlayerID, &m.CreatedAt, &m.UpdatedAt, &m.GameID, &players)
	if err != nil {
		return nil, err
	}

	m.Players = stringToIntArray(players)
	visits, err := GetMatchVisits(id)
	if err != nil {
		return nil, err
	}
	m.Visits = visits
	m.Hits, m.DartsThrown = GetHitsMap(visits)

	return m, nil
}

// GetMatchPlayers returns a information about current score for players in a match
func GetMatchPlayers(id int) ([]*Player2Match, error) {
	rows, err := db.Query(`
		SELECT p2m.match_id, p2m.player_id, p2m.order, m.starting_score, m.current_player_id
		FROM  player2match p2m
		LEFT JOIN `+"`match`"+` m ON m.id = p2m.match_id
		WHERE p2m.match_id = ?
		ORDER BY p2m.order`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	playersMap := make(map[int]*Player2Match)
	for rows.Next() {
		var currentPlayerID int
		p2m := new(Player2Match)
		err := rows.Scan(&p2m.MatchID, &p2m.PlayerID, &p2m.Order, &p2m.CurrentScore, &currentPlayerID)
		if err != nil {
			return nil, err
		}
		p2m.IsCurrentPlayer = currentPlayerID == p2m.PlayerID
		playersMap[p2m.PlayerID] = p2m
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	visits, err := GetMatchVisits(id)
	if err != nil {
		return nil, err
	}
	for _, visit := range visits {
		player := playersMap[visit.PlayerID]
		if visit.FirstDart.Value.Valid {
			player.CurrentScore -= visit.FirstDart.Value.Int64 * visit.FirstDart.Multiplier
		}
		if visit.SecondDart.Value.Valid {
			player.CurrentScore -= visit.SecondDart.Value.Int64 * visit.SecondDart.Multiplier
		}
		if visit.ThirdDart.Value.Valid {
			player.CurrentScore -= visit.ThirdDart.Value.Int64 * visit.ThirdDart.Multiplier
		}
	}

	players := make([]*Player2Match, 0)
	for _, p2m := range playersMap {
		players = append(players, p2m)
	}
	return players, nil
}
