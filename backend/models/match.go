package models

// Match struct used for storing matches
type Match struct {
	ID              int             `json:"id"`
	Endtime         string          `json:"end_time"`
	StartingScore   int             `json:"starting_score"`
	IsFinished      bool            `json:"is_finished"`
	CurrentPlayerID int             `json:"current_player_id"`
	WinnerPlayerID  int             `json:"winner_player_id"`
	CreatedAt       string          `json:"created_at"`
	UpdatedAt       string          `json:"updated_at"`
	GameID          int             `json:"game_id"`
	Players         []int           `json:"players,omitempty"`
	DartsThrown     int             `json:"darts_thrown,omitempty"`
	Visits          []*Visit        `json:"visits,omitempty"`
	Hits            map[int64]*Hits `json:"hits,omitempty"`
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

	m.Players = stringToArray(players)
	visits, err := GetMatchVisits(id)
	if err != nil {
		return nil, err
	}
	m.Visits = visits
	m.Hits, m.DartsThrown = GetHitsMap(visits)

	return m, nil
}
