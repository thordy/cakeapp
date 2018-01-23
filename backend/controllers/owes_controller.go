package controllers

import (
	"encoding/json"
	"kcapp-api/models"
	"log"
	"net/http"
)

// GetOwes will return a list of all games
func GetOwes(w http.ResponseWriter, r *http.Request) {
	SetHeaders(w)
	owes, err := models.GetOwes()
	if err != nil {
		log.Println("Unable to get owes", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(owes)
}
