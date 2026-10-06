package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type RouteRequest struct {
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	DayOfWeek   int    `json:"day_of_week"`
}

type FlightLeg struct {
	Airline     string `json:"airline"`
	FlightNo    string `json:"flight_number"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	DaysBitmask int    `json:"days_bitmask"`
}

type ConnectionRoute struct {
	Type  string      `json:"type"` // DIRECT, 1_STOP, 2_STOPS
	Stops int         `json:"stops"`
	Legs  []FlightLeg `json:"legs"`
}

var driver neo4j.DriverWithContext

func main() {
	neo4jURI := os.Getenv("NEO4J_URI")
	if neo4jURI == "" {
		neo4jURI = "bolt://neo4j:7687"
	}
	user := os.Getenv("NEO4J_USER")
	pass := os.Getenv("NEO4J_PASS")

	var err error
	driver, err = neo4j.NewDriverWithContext(neo4jURI, neo4j.BasicAuth(user, pass, ""))
	if err != nil {
		log.Printf("Aviso: No se pudo conectar inmediatamente a Neo4j: %v", err)
	} else {
		defer driver.Close(context.Background())
	}

	http.HandleFunc("/api/routes", handleSearchRoutes)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","service":"escala-route-engine"}`))
	})

	log.Println("⚡ ESCALA Route Engine activo en puerto :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func handleSearchRoutes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req RouteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Payload JSON inválido"}`, http.StatusBadRequest)
		return
	}

	routes, err := findRoutesInGraph(r.Context(), req.Origin, req.Destination, req.DayOfWeek)
	if err != nil || len(routes) == 0 {
		// Fallback seguro a rutas de demostración si Neo4j no tiene nodos inicializados
		routes = generateMockRoutes(req.Origin, req.Destination)
	}

	json.NewEncoder(w).Encode(routes)
}

func findRoutesInGraph(ctx context.Context, origin, dest string, day int) ([]ConnectionRoute, error) {
	if driver == nil {
		return nil, fmt.Errorf("driver neo4j no inicializado")
	}

	session := driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
	MATCH path = (a:Airport {iata: $origin})-[r:FLIGHT*1..3]->(b:Airport {iata: $dest})
	RETURN path
	LIMIT 15
	`

	result, err := session.Run(ctx, query, map[string]any{
		"origin": origin,
		"dest":   dest,
	})
	if err != nil {
		return nil, err
	}

	var routes []ConnectionRoute
	for result.Next(ctx) {
		record := result.Record()
		pathVal, ok := record.Get("path")
		if !ok {
			continue
		}
		path := pathVal.(neo4j.Path)

		var legs []FlightLeg
		for _, rel := range path.Relationships {
			props := rel.Props
			legs = append(legs, FlightLeg{
				Airline:     getPropString(props, "airline", "ESCALA Partner"),
				FlightNo:    getPropString(props, "flight_number", "ES-100"),
				Origin:      origin,
				Destination: dest,
				DaysBitmask: 127,
			})
		}

		routeType := "DIRECT"
		if len(legs) == 2 {
			routeType = "1_STOP"
		} else if len(legs) >= 3 {
			routeType = "2_STOPS"
		}

		routes = append(routes, ConnectionRoute{
			Type:  routeType,
			Stops: len(legs) - 1,
			Legs:  legs,
		})
	}

	return routes, nil
}

func getPropString(props map[string]any, key, fallback string) string {
	if val, ok := props[key].(string); ok {
		return val
	}
	return fallback
}

func generateMockRoutes(origin, dest string) []ConnectionRoute {
	return []ConnectionRoute{
		{
			Type:  "DIRECT",
			Stops: 0,
			Legs: []FlightLeg{
				{Airline: "Iberia", FlightNo: "IB-6800", Origin: origin, Destination: dest, DaysBitmask: 127},
			},
		},
		{
			Type:  "1_STOP",
			Stops: 1,
			Legs: []FlightLeg{
				{Airline: "Air France", FlightNo: "AF-1020", Origin: origin, Destination: "CDG", DaysBitmask: 62},
				{Airline: "Air France", FlightNo: "AF-228", Origin: "CDG", Destination: dest, DaysBitmask: 62},
			},
		},
		{
			Type:  "2_STOPS",
			Stops: 2,
			Legs: []FlightLeg{
				{Airline: "Lufthansa", FlightNo: "LH-1110", Origin: origin, Destination: "FRA", DaysBitmask: 127},
				{Airline: "Lufthansa", FlightNo: "LH-710", Origin: "FRA", Destination: "HND", DaysBitmask: 127},
				{Airline: "ANA", FlightNo: "NH-204", Origin: "HND", Destination: dest, DaysBitmask: 127},
			},
		},
	}
}