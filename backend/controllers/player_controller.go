package controllers

import (
	"encoding/json"
	"kcapp-api/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GetPlayers will return a map containing all players
func GetPlayers(w http.ResponseWriter, r *http.Request) {
	players, err := models.GetPlayers()
	if err != nil {
		log.Println("Unable to get players", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(players)
}

// GetPlayer will return a player with the given ID
func GetPlayer(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		log.Println("Invalid id parameter")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Println(id)
	// TODO
}

// AddPlayer will create a new player
func AddPlayer(w http.ResponseWriter, r *http.Request) {
	// TODO
}
