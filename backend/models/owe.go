package models

import "kcapp-api/jsonutil"

// OweType struct used for storing owe types
type OweType struct {
	ID   jsonutil.JSONInt    `json:"id"`
	Item jsonutil.JSONString `json:"item"`
}
