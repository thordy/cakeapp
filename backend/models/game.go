package models

import (
	"github.com/guregu/null"
)

// Game struct used for storing games
type Game struct {
	ID             int       `json:"id"`
	IsFinished     bool      `json:"is_finished"`
	CurrentMatchID null.Int  `json:"current_match_id"`
	GameType       *GameType `json:"game_type"`
	WinnerID       null.Int  `json:"winner_id"`
	CreatedAt      string    `json:"created_at"`
	UpdatedAt      string    `json:"updated_at"`
	OweTypeID      null.Int  `json:"owe_type_id"`
	OweType        *OweType  `json:"owe_type,omitempty"`
	Players        []int     `json:"players"`
	Matches        []*Match  `json:"matches,omitempty"`
}

// GameType struct used for storing game types
type GameType struct {
	ID              int      `json:"id"`
	Name            string   `json:"name"`
	ShortName       string   `json:"short_name"`
	WinsRequired    int      `json:"wins_required"`
	MatchesRequired null.Int `json:"matches_required"`
}

// GetGames returns all games
func GetGames() ([]*Game, error) {
	rows, err := db.Query(`
		SELECT
			g.id, g.is_finished, g.current_match_id, g.winner_id, g.created_at, g.updated_at, g.owe_type_id,
			gt.id, gt.name, gt.short_name, gt.wins_required, gt.matches_required,
			ot.id, ot.item,
			GROUP_CONCAT(DISTINCT p2m.player_id) AS 'players'
		FROM game g
		LEFT JOIN game_type gt ON gt.id = g.game_type_id
		LEFT JOIN owe_type ot ON ot.id = g.owe_type_id
		LEFT JOIN player2match p2m ON p2m.game_id = g.id
		GROUP BY g.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	games := make([]*Game, 0)
	for rows.Next() {
		g := new(Game)
		g.GameType = new(GameType)
		ot := new(OweType)
		var players string
		err := rows.Scan(&g.ID, &g.IsFinished, &g.CurrentMatchID, &g.WinnerID, &g.CreatedAt, &g.UpdatedAt, &g.OweTypeID,
			&g.GameType.ID, &g.GameType.Name, &g.GameType.ShortName, &g.GameType.WinsRequired, &g.GameType.MatchesRequired,
			&ot.ID, &ot.Item, &players)
		if err != nil {
			return nil, err
		}
		if g.OweTypeID.Valid {
			g.OweType = ot
		}

		g.Players = stringToIntArray(players)
		games = append(games, g)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return games, nil
}

// GetGame returns a game with the given ID
func GetGame(id int) (*Game, error) {
	g := new(Game)
	g.GameType = new(GameType)
	ot := new(OweType)
	var players string
	err := db.QueryRow(`
        SELECT
            g.id, g.is_finished, g.current_match_id, g.winner_id, g.created_at, g.updated_at, g.owe_type_id,
			gt.id, gt.name, gt.short_name, gt.wins_required, gt.matches_required,
			ot.id, ot.item,
			GROUP_CONCAT(DISTINCT p2m.player_id) AS 'players'
        FROM game g
		LEFT JOIN game_type gt ON gt.id = g.game_type_id
		LEFT JOIN owe_type ot ON ot.id = g.owe_type_id
		LEFT JOIN player2match p2m ON p2m.game_id = g.id
		WHERE g.id = ?`, id).Scan(&g.ID, &g.IsFinished, &g.CurrentMatchID, &g.WinnerID, &g.CreatedAt, &g.UpdatedAt, &g.OweTypeID,
		&g.GameType.ID, &g.GameType.Name, &g.GameType.ShortName, &g.GameType.WinsRequired, &g.GameType.MatchesRequired, &ot.ID, &ot.Item, &players)
	if err != nil {
		return nil, err
	}
	if g.OweTypeID.Valid {
		g.OweType = ot
	}
	g.Players = stringToIntArray(players)
	matches, err := GetMatches(id)
	if err != nil {
		return nil, err
	}
	g.Matches = matches
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
