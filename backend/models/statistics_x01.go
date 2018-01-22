package models

import (
	"sort"

	"github.com/guregu/null"
)

// StatisticsX01 struct used for storing statistics
type StatisticsX01 struct {
	ID                 int             `json:"id,omitempty"`
	MatchID            int             `json:"match_id,omitempty"`
	PlayerID           int             `json:"player_id,omitempty"`
	PPD                float32         `json:"ppd"`
	FirstNinePPD       float32         `json:"first_nine_ppd"`
	CheckoutPercentage float32         `json:"checkout_percentage"`
	DartsThrown        int             `json:"darts_thrown"`
	Score60sPlus       int             `json:"scores_60s_plus"`
	Score100sPlus      int             `json:"scores_100s_plus"`
	Score140sPlus      int             `json:"scores_140s_plus"`
	Score180s          int             `json:"scores_180s"`
	Accuracy20         null.Float      `json:"accuracy_20"`
	Accuracy19         null.Float      `json:"accuracy_19"`
	AccuracyOverall    null.Float      `json:"accuracy_overall"`
	Hits               map[int64]*Hits `json:"hits,omitempty"`
	GamesPlayed        int             `json:"games_played,omitempty"`
	GamesWon           int             `json:"games_won,omitempty"`
}

// Hits sturct used to store summary of hits for players/matches
type Hits struct {
	Singles int `json:"1,omitempty"`
	Doubles int `json:"2,omitempty"`
	Triples int `json:"3,omitempty"`
}

// GetX01Statistics will return statistics for all players active duing the given period
func GetX01Statistics(from string, to string) ([]*StatisticsX01, error) {
	rows, err := db.Query(`
		SELECT
			p.id,
			COUNT(DISTINCT g.id),
			SUM(s.ppd) / COUNT(p.id),
			SUM(s.first_nine_ppd) / COUNT(p.id),
			SUM(60s_plus),
			SUM(100s_plus),
			SUM(140s_plus),
			SUM(180s) AS '180s',
			SUM(accuracy_20) / COUNT(accuracy_20),
			SUM(accuracy_19) / COUNT(accuracy_19),
			SUM(overall_accuracy) / COUNT(overall_accuracy),
			SUM(checkout_percentage) / COUNT(checkout_percentage)
		FROM statistics_x01 s
			JOIN player p ON p.id = s.player_id
			JOIN `+"`match`"+` m ON m.id = s.match_id
			JOIN game g ON g.id = m.game_id
		WHERE g.updated_at >= ? AND g.updated_at < ?
		AND g.is_finished = 1
		GROUP BY p.id`, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	statsMap := make(map[int]*StatisticsX01, 0)
	for rows.Next() {
		s := new(StatisticsX01)
		err := rows.Scan(&s.PlayerID, &s.GamesPlayed, &s.PPD, &s.FirstNinePPD, &s.Score60sPlus, &s.Score100sPlus,
			&s.Score140sPlus, &s.Score180s, &s.Accuracy20, &s.Accuracy19, &s.AccuracyOverall, &s.CheckoutPercentage)
		if err != nil {
			return nil, err
		}
		statsMap[s.PlayerID] = s
	}

	rows, err = db.Query(`
		SELECT
			p.id AS 'player_id',
			COUNT(g.winner_id) AS 'games_won'
		FROM game g
			JOIN player p ON p.id = g.winner_id
		WHERE g.updated_at >= ? AND g.updated_at < ?
		GROUP BY g.winner_id`, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var playerID int
		var gamesWon int
		err := rows.Scan(&playerID, &gamesWon)
		if err != nil {
			return nil, err
		}
		statsMap[playerID].GamesWon = gamesWon
	}

	stats := make([]*StatisticsX01, 0)
	for _, s := range statsMap {
		stats = append(stats, s)
	}
	sort.Slice(stats, func(i, j int) bool {
		return (stats[i].GamesWon / stats[i].GamesPlayed) > (stats[j].GamesWon / stats[j].GamesPlayed)
	})

	return stats, nil
}
