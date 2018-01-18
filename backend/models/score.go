package models

// Score struct used for storing matches
type Score struct {
	ID         int    `json:"id"`
	MatchID    int    `json:"match_id"`
	PlayerID   int    `json:"player_id"`
	FirstDart  *Dart  `json:"first_dart"`
	SecondDart *Dart  `json:"second_dart"`
	ThirdDart  *Dart  `json:"third_dart"`
	IsBust     bool   `json:"is_bust"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

// Dart struct used for storing darts
type Dart struct {
	Value      int  `json:"value"`
	Multiplier int  `json:"multiplier"`
	IsCheckout bool `json:"is_checkout"`
}
