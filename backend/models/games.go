package models

import (
	"kcapp-api/jsonutil"
	"log"
)

// Game struct used for storing games
type Game struct {
	ID             int              `json:"id"`
	IsFinished     bool             `json:"is_finished"`
	CurrentMatchID jsonutil.JSONInt `json:"current_match_id"`
	GameType       *GameType        `json:"game_type"`
	WinnerID       jsonutil.JSONInt `json:"winner_id"`
	CreatedAt      string           `json:"created_at"`
	UpdatedAt      string           `json:"updated_at"`
	OweTypeID      jsonutil.JSONInt `json:"owe_type_id"`
	OweType        *OweType         `json:"owe_type,omitempty"`
	Players        []*Player        `json:"players"`
}

// GameType struct used for storing game types
type GameType struct {
	ID              int              `json:"id"`
	Name            string           `json:"name"`
	ShortName       string           `json:"short_name"`
	WinsRequired    int              `json:"wins_required"`
	MatchesRequired jsonutil.JSONInt `json:"matches_required"`
}

// GetGames returns all games
func GetGames() ([]*Game, error) {
	rows, err := db.Query(`
        SELECT
            g.id, g.is_finished, g.current_match_id, g.winner_id, g.created_at, g.updated_at, g.owe_type_id,
			gt.id, gt.name, gt.short_name, gt.wins_required, gt.matches_required,
			ot.id, ot.item
        FROM game g
		LEFT JOIN game_type gt ON gt.id = g.game_type_id
		LEFT JOIN owe_type ot ON ot.id = g.owe_type_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	gms := make([]*Game, 0)
	m := make(map[int]*Game)
	for rows.Next() {
		g := new(Game)
		gt := new(GameType)
		ot := new(OweType)
		err := rows.Scan(&g.ID, &g.IsFinished, &g.CurrentMatchID, &g.WinnerID, &g.CreatedAt,
			&g.UpdatedAt, &g.OweTypeID, &gt.ID, &gt.Name, &gt.ShortName, &gt.WinsRequired, &gt.MatchesRequired, &ot.ID, &ot.Item)
		g.GameType = gt
		if g.OweTypeID.Valid {
			g.OweType = ot
		}
		if err != nil {
			return nil, err
		}
		gms = append(gms, g)
		m[g.ID] = g
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	// Load Players
	rows, err = db.Query(`
		SELECT
			p2m.game_id, p.id, p.name, p.nickname
		FROM player2match p2m
		JOIN player p ON p.id = p2m.player_id
		GROUP BY p2m.player_id, p2m.game_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		p := new(Player)
		var id int
		err := rows.Scan(&id, &p.ID, &p.Name, &p.Nickname)
		if err != nil {
			return nil, err
		}
		g := m[id]
		g.Players = append(g.Players, p)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return gms, nil
}

// GetGame returns a game with the given ID
func GetGame(id int) (*Game, error) {
	g := new(Game)
	gt := new(GameType)
	ot := new(OweType)
	err := db.QueryRow(`
        SELECT
            g.id, g.is_finished, g.current_match_id, g.winner_id, g.created_at, g.updated_at, g.owe_type_id,
			gt.id, gt.name, gt.short_name, gt.wins_required, gt.matches_required,
			ot.id, ot.item
        FROM game g
		LEFT JOIN game_type gt ON gt.id = g.game_type_id
		LEFT JOIN owe_type ot ON ot.id = g.owe_type_id
		WHERE g.id = ?`, id).Scan(&g.ID, &g.IsFinished, &g.CurrentMatchID, &g.WinnerID, &g.CreatedAt,
		&g.UpdatedAt, &g.OweTypeID, &gt.ID, &gt.Name, &gt.ShortName, &gt.WinsRequired, &gt.MatchesRequired, &ot.ID, &ot.Item)
	if err != nil {
		return nil, err
	}
	g.GameType = gt
	if g.OweTypeID.Valid {
		g.OweType = ot
	}

	// Load Players
	rows, err := db.Query(`
        SELECT
			p.id, p.name, p.nickname
		FROM player2match p2m
		JOIN player p ON p.id = p2m.player_id
		WHERE p2m.game_id = ? GROUP BY p2m.player_id;`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plr := make([]*Player, 0)
	for rows.Next() {
		p := new(Player)
		err := rows.Scan(&p.ID, &p.Name, &p.Nickname)

		if err != nil {
			return nil, err
		}
		plr = append(plr, p)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	g.Players = plr

	log.Println("Got row from database: ", g)
	return g, nil
}

// NewGame will insert a new game in the database
func NewGame() (*Game, error) {
	// TODO
	return nil, nil
}

// DeleteGame will delete the game with the given ID from the database
func DeleteGame(id int) (*Game, error) {
	// TODO
	return nil, nil
}
