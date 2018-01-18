package models

// Match struct used for storing matches
type Match struct {
	ID              int    `json:"id"`
	Endtime         string `json:"end_time"`
	StartingScore   int    `json:"starting_score"`
	IsFinished      bool   `json:"is_finished"`
	CurrentPlayerID int    `json:"current_player_id"`
	WinnerPlayerID  int    `json:"winner_player_id"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
	GameID          int    `json:"game_id"`
}
