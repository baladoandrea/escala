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
	MaxStops    int    `json:"max_stops"`
}

type FlightLeg struct {
	Airline     string `json:"airline"`
	FlightNumber string `json:"flight_number"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	DepTime     string `json:"dep_time"`
	ArrTime     string `json:"arr_time"`
}

type RouteOption struct {
	Stops int         `json:"stops"`
	Legs  []FlightLeg `json:"legs"`
}

var driver neo4j.DriverWithContext

func main() {
	uri := os.Getenv("NEO4J_URI")
	user := os.Getenv("NEO4J_USER")
	pass := os.Getenv("NEO4J_PASS")

	var err error
	driver, err = neo4j.NewDriverWithContext(uri, neo4j.BasicAuth(user, pass, ""))
	if err != nil {
		log.Fatalf("Error conectando a Neo4j: %v", err)
	}
	defer driver.Close(context.Background())

	http.HandleFunc("/api/v1/search", handleRouteSearch)

	fmt.Println("🚀 Motor de Rutas ESCALA (Go) corriendo en el puerto 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleRouteSearch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var req RouteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Payload inválido", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	routes, err := searchRoutesInGraph(ctx, req.Origin, req.Destination, req.MaxStops)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error consultando grafo: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"origin":  req.Origin,
		"dest":    req.Destination,
		"results": routes,
	})
}

func searchRoutesInGraph(ctx context.Context, orig, dest string, maxStops int) ([]RouteOption, error) {
	session := driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	// Consulta Cypher para buscar trayectos de 1 hasta (maxStops + 1) saltos
	cypherQuery := `
		MATCH p = (a:Airport {iata: $orig})-[r:FLIGHT_ROUTE*1..3]->(b:Airport {iata: $dest})
		WHERE length(p) - 1 <= $maxStops
		RETURN p
		LIMIT 15
	`

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, cypherQuery, map[string]interface{}{
			"orig":     orig,
			"dest":     dest,
			"maxStops": maxStops,
		})
		if err != nil {
			return nil, err
		}

		var options []RouteOption
		for res.Next(ctx) {
			record := res.Record()
			pathVal, _ := record.Get("p")
			path := pathVal.(neo4j.Path)

			var legs []FlightLeg
			for _, rel := range path.Relationships {
				props := rel.Props
				legs = append(legs, FlightLeg{
					Airline:      props["airline"].(string),
					FlightNumber: props["flight_number"].(string),
					Origin:       props["origin"].(string),
					Destination:  props["destination"].(string),
					DepTime:      props["dep_time"].(string),
					ArrTime:      props["arr_time"].(string),
				})
			}

			options = append(options, RouteOption{
				Stops: len(legs) - 1,
				Legs:  legs,
			})
		}
		return options, nil
	})

	if err != nil {
		return nil, err
	}
	return result.([]RouteOption), nil
}