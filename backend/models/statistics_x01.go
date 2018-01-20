package models

// StatisticsX01 struct used for storing statistics
type StatisticsX01 struct {
	ID                 int      `json:"id,omitempty"`
	MatchID            int      `json:"match_id,omitempty"`
	PlayerID           int      `json:"player_id,omitempty"`
	PPD                float32  `json:"ppd"`
	FirstNinePPD       float32  `json:"first_nine_ppd"`
	CheckoutPercentage float32  `json:"checkout_percentage"`
	DartsThrown        int      `json:"darts_thrown"`
	Score60sPlus       int      `json:"60s_plus"`
	Score100sPlus      int      `json:"100s_plus"`
	Score140sPlus      int      `json:"140s_plus"`
	Score180s          int      `json:"180s"`
	Accuracy20         float32  `json:"accuracy_20"`
	Accuracy19         float32  `json:"accuracy_19"`
	AccuracyOverall    float32  `json:"accuracy_overall"`
	Visits             []*Visit `json:"visits,omitempty"`
}
