package controllers

import (
	"encoding/json"
	"kcapp-api/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GetGames will return a list of all games
func GetGames(w http.ResponseWriter, r *http.Request) {
	games, err := models.GetGames()
	if err != nil {
		log.Println("Unable to get games", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(games)
}

// GetGame will reurn a the game with the given ID
func GetGame(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		log.Println("Invalid id parameter")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	game, err := models.GetGame(id)
	if err != nil {
		log.Println("Unable to get game: ", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(game)
}

func SpectateGame(w http.ResponseWriter, r *http.Request) {
	// TODO
}
func NewGame(w http.ResponseWriter, r *http.Request) {
	// TODO
}
func DeleteGame(w http.ResponseWriter, r *http.Request) {
	// TODO
}
