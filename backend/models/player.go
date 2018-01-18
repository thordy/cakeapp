package models

import (
	"kcapp-api/jsonutil"
)

// Player struct used for storing players
type Player struct {
	ID           int                 `json:"id"`
	Name         string              `json:"name"`
	Nickname     jsonutil.JSONString `json:"nickname,omitempty"`
	GamesPlayed  int                 `json:"games_played,omitempty"`
	GamesWon     jsonutil.JSONInt    `json:"games_won,omitempty"`
	PPD          string              `json:"ppd,omitempty"`
	FirstNinePPD string              `json:"first_nine_ppd,omitempty"`
	CreatedAt    string              `json:"created_at,omitempty"`
	UpdatedAt    string              `json:"updated_at,omitempty"`
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
