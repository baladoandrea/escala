package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

// Estructuras de datos para la API de rutas
type RouteRequest struct {
	Origin    string `json:"origin"`
	Dest      string `json:"destination"`
	DayOfWeek int    `json:"day_of_week"`
}

type RouteLeg struct {
	Airline     string `json:"airline"`
	FlightNumber string `json:"flight_number"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
}

type Route struct {
	Type  string     `json:"type"`
	Stops int        `json:"stops"`
	Legs  []RouteLeg `json:"legs"`
}

// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Permitir cualquier origen (necesario para URLs dinámicas de Codespaces)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Responder a la petición de verificación previa (Preflight OPTIONS)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Handler de la API de cálculo topológico de rutas
func routesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var req RouteRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Cuerpo de petición JSON no válido", http.StatusBadRequest)
		return
	}

	orig := strings.ToUpper(strings.TrimSpace(req.Origin))
	dest := strings.ToUpper(strings.TrimSpace(req.Dest))

	log.Printf("[RouteEngine] Consulta recibida: %s -> %s (Día de la semana: %d)", orig, dest, req.DayOfWeek)

	// Generar respuesta con opciones de vuelo directo, 1 escala y 2 escalas
	routes := []Route{
		{
			Type:  "DIRECT",
			Stops: 0,
			Legs: []RouteLeg{
				{
					Airline:      "Iberia (Oneworld)",
					FlightNumber: "IB-6251",
					Origin:       orig,
					Destination:  dest,
				},
			},
		},
		{
			Type:  "1_STOP",
			Stops: 1,
			Legs: []RouteLeg{
				{
					Airline:      "Air France (SkyTeam)",
					FlightNumber: "AF-1020",
					Origin:       orig,
					Destination:  "CDG",
				},
				{
					Airline:      "Air France (SkyTeam)",
					FlightNumber: "AF-022",
					Origin:       "CDG",
					Destination:  dest,
				},
			},
		},
		{
			Type:  "2_STOPS",
			Stops: 2,
			Legs: []RouteLeg{
				{
					Airline:      "Lufthansa (Star Alliance)",
					FlightNumber: "LH-1110",
					Origin:       orig,
					Destination:  "FRA",
				},
				{
					Airline:      "Lufthansa (Star Alliance)",
					FlightNumber: "LH-710",
					Origin:       "FRA",
					Destination:  "HND",
				},
				{
					Airline:      "ANA (Star Alliance)",
					FlightNumber: "NH-204",
					Origin:       "HND",
					Destination:  dest,
				},
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(routes)
}

func main() {
	// Registro de rutas HTTP con soporte CORS habilitado
	http.HandleFunc("/api/routes", enableCORS(routesHandler))

	port := ":8080"
	fmt.Printf("🚀 [Escala Route Engine] Servidor iniciado en http://localhost%s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Error al iniciar el servidor Go: %v", err)
	}
}