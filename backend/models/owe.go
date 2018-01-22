package models

import "github.com/guregu/null"

// OweType struct used for storing owe types
type OweType struct {
	ID   null.Int    `json:"id"`
	Item null.String `json:"item"`
}
