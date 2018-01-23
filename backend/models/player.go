package models

import "github.com/guregu/null"

// Player struct used for storing players
type Player struct {
	ID           int         `json:"id"`
	Name         string      `json:"name"`
	Nickname     null.String `json:"nickname,omitempty"`
	GamesPlayed  int         `json:"games_played"`
	GamesWon     int         `json:"games_won"`
	PPD          float32     `json:"ppd,omitempty"`
	FirstNinePPD float32     `json:"first_nine_ppd,omitempty"`
	CreatedAt    string      `json:"created_at"`
	UpdatedAt    string      `json:"updated_at,omitempty"`
}

// GetPlayers returns a map of all players
func GetPlayers() (map[int]*Player, error) {
	rows, err := db.Query(`SELECT p.id, p.name, p.nickname, p.games_played, p.games_won, p.created_at FROM player p`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	players := make(map[int]*Player)
	for rows.Next() {
		p := new(Player)
		err := rows.Scan(&p.ID, &p.Name, &p.Nickname, &p.GamesPlayed, &p.GamesWon, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		players[p.ID] = p
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return players, nil
}

// AddPlayer will add a new player to the database
func AddPlayer(player Player) error {
	// Prepare statement for inserting data
	stmt, err := db.Prepare("INSERT INTO player (name, nickname) VALUES (?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(player.Name, player.Nickname)
	return err // Will be nil if no error occured
}

// GetPlayerStatistics will get statistics about the given player id
func GetPlayerStatistics(id int) (*StatisticsX01, error) {
	s := new(StatisticsX01)
	err := db.QueryRow(`
		SELECT
			p.id,
			SUM(s.ppd) / p.games_played,
			SUM(s.first_nine_ppd) / p.games_played,
			SUM(s.60s_plus),
			SUM(s.100s_plus),
			SUM(s.140s_plus),
			SUM(s.180s),
			SUM(accuracy_20) / COUNT(accuracy_20),
			SUM(accuracy_19) / COUNT(accuracy_19),
			SUM(overall_accuracy) / COUNT(overall_accuracy),
			SUM(checkout_percentage) / COUNT(checkout_percentage)
		FROM statistics_x01 s
		JOIN player p ON p.id = s.player_id
		JOIN `+"`match`"+` m ON m.id = s.match_id
		WHERE s.player_id = ?
		GROUP BY s.player_id`, id).Scan(&s.PlayerID, &s.PPD, &s.FirstNinePPD, &s.Score60sPlus, &s.Score100sPlus, &s.Score140sPlus,
		&s.Score180s, &s.Accuracy20, &s.Accuracy19, &s.AccuracyOverall, &s.CheckoutPercentage)
	if err != nil {
		return nil, err
	}

	visits, err := GetPlayerVisits(id)
	if err != nil {
		return nil, err
	}
	s.Hits = getHitsMap(s, visits)

	return s, nil
}

func getHitsMap(stats *StatisticsX01, visits []*Visit) map[int64]*Hits {
	hitsMap := make(map[int64]*Hits)
	// Populate the map with hits for each value (miss - 20) and bull
	for i := 0; i <= 20; i++ {
		hitsMap[int64(i)] = new(Hits)
	}
	hitsMap[25] = new(Hits)

	for _, visit := range visits {
		if visit.FirstDart != nil {
			hit := hitsMap[visit.FirstDart.Value.Int64]
			if visit.FirstDart.Multiplier == 1 {
				hit.Singles++
			}
			if visit.FirstDart.Multiplier == 2 {
				hit.Doubles++
			}
			if visit.FirstDart.Multiplier == 3 {
				hit.Triples++
			}
			stats.DartsThrown++
		}
		if visit.SecondDart != nil {
			hit := hitsMap[visit.SecondDart.Value.Int64]
			if visit.SecondDart.Multiplier == 1 {
				hit.Singles++
			}
			if visit.SecondDart.Multiplier == 2 {
				hit.Doubles++
			}
			if visit.SecondDart.Multiplier == 3 {
				hit.Triples++
			}
			stats.DartsThrown++
		}
		if visit.ThirdDart != nil {
			hit := hitsMap[visit.ThirdDart.Value.Int64]
			if visit.ThirdDart.Multiplier == 1 {
				hit.Singles++
			}
			if visit.ThirdDart.Multiplier == 2 {
				hit.Doubles++
			}
			if visit.ThirdDart.Multiplier == 3 {
				hit.Triples++
			}
			stats.DartsThrown++
		}
	}
	return hitsMap
}