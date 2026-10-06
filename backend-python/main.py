from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(
    title="ESCALA Spatial & Airport Metadata API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Airport(BaseModel):
    iata: str
    icao: str
    name: str
    city: str
    country: str
    lat: float
    lon: float

AIRPORTS_DATABASE = [
    Airport(iata="MAD", icao="LEMD", name="Adolfo Suárez Madrid-Barajas", city="Madrid", country="España", lat=40.4839, lon=-3.5680),
    Airport(iata="BCN", icao="LEBL", name="Josep Tarradellas Barcelona-El Prat", city="Barcelona", country="España", lat=41.2974, lon=2.0785),
    Airport(iata="JFK", icao="KJFK", name="John F. Kennedy International", city="New York", country="Estados Unidos", lat=40.6413, lon=-73.7781),
    Airport(iata="CDG", icao="LFPG", name="Charles de Gaulle", city="Paris", country="Francia", lat=48.8566, lon=2.3522),
    Airport(iata="LHR", icao="EGLL", name="London Heathrow", city="London", country="Reino Unido", lat=51.4700, lon=-0.4543),
    Airport(iata="HND", icao="RJTT", name="Tokyo Haneda", city="Tokyo", country="Japón", lat=35.5494, lon=139.7798),
    Airport(iata="FRA", icao="EDDF", name="Frankfurt Airport", city="Frankfurt", country="Alemania", lat=50.0379, lon=8.5622)
]

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "escala-spatial-api"}

@app.get("/api/airports/search", response_model=List[Airport])
def search_airports(q: str = Query(..., min_length=1)):
    query = q.lower()
    return [
        apt for apt in AIRPORTS_DATABASE 
        if query in apt.iata.lower() 
        or query in apt.name.lower() 
        or query in apt.city.lower()
    ]

@app.get("/api/airports/{iata}", response_model=Airport)
def get_airport_by_iata(iata: str):
    for apt in AIRPORTS_DATABASE:
        if apt.iata.upper() == iata.upper():
            return apt
    raise HTTPException(status_code=404, detail="Aeropuerto no encontrado")