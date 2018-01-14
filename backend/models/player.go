package models

import (
	"kcapp-api/jsonutil"
	"time"
)

// Player struct used for storing players
type Player struct {
	ID           int                 `json:"id"`
	Name         string              `json:"name"`
	Nickname     jsonutil.JSONString `json:"nickname,omitempty"`
	GamesPlayed  *GameType           `json:"games_played,omitempty"`
	GamesWon     jsonutil.JSONInt    `json:"games_won,omitempty"`
	PPD          string              `json:"ppd,omitempty"`
	FirstNinePPD string              `json:"first_nine_ppd,omitempty"`
	CreatedAt    time.Time           `json:"created_at,omitempty"`
	UpdatedAt    time.Time           `json:"updated_at,omitempty"`
}
