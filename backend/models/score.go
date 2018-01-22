package models

import "github.com/guregu/null"

// Visit struct used for storing matches
type Visit struct {
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
	Value      null.Int `json:"value"`
	Multiplier int      `json:"multiplier"`
	IsCheckout bool     `json:"is_checkout"`
}

// GetPlayerVisits will return all visits for a given player
func GetPlayerVisits(id int) ([]*Visit, error) {
	rows, err := db.Query(`
		SELECT
			id, match_id, player_id, 
			first_dart, first_dart_multiplier, is_checkout_first,
			second_dart, second_dart_multiplier, is_checkout_second,
			third_dart, third_dart_multiplier, is_checkout_third,
			is_bust,
			created_at,
			updated_at
		FROM score s
		WHERE player_id = ?`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	visits := make([]*Visit, 0)
	for rows.Next() {
		v := new(Visit)
		first := new(Dart)
		second := new(Dart)
		third := new(Dart)
		err := rows.Scan(&v.ID, &v.MatchID, &v.PlayerID,
			&first.Value, &first.Multiplier, &first.IsCheckout,
			&second.Value, &second.Multiplier, &second.IsCheckout,
			&third.Value, &third.Multiplier, &third.IsCheckout,
			&v.IsBust, &v.CreatedAt, &v.UpdatedAt)
		v.FirstDart = first
		v.SecondDart = second
		v.ThirdDart = third
		if err != nil {
			return nil, err
		}
		visits = append(visits, v)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return visits, nil
}
