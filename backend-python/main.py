from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
import os

app = FastAPI(title="ESCALA Spatial & Airport API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://escala_user:escala_pass@localhost:5432/escala_db")

@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(DATABASE_URL)

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "spatial-api"}

# F-201: Búsqueda por radio geográfico de aeropuertos cercanos
@app.get("/api/v1/airports/nearby")
async def get_nearby_airports(
    lat: float = Query(..., description="Latitud del origen"),
    lon: float = Query(..., description="Longitud del origen"),
    radius_km: float = Query(100.0, description="Radio de búsqueda en km")
):
    query = """
        SELECT iata_code, name_es, name_en, city_es, city_en, country_code,
               ST_Y(coordinates::geometry) as lat, ST_X(coordinates::geometry) as lon,
               ST_Distance(coordinates, ST_MakePoint($1, $2)::geography) / 1000 as distance_km
        FROM airports
        WHERE ST_DWithin(coordinates, ST_MakePoint($1, $2)::geography, $3 * 1000)
        ORDER BY distance_km ASC;
    """
    async with app.state.db.acquire() as conn:
        rows = await conn.fetch(query, lon, lat, radius_km)
        
    return {
        "count": len(rows),
        "radius_km": radius_km,
        "airports": [dict(row) for row in rows]
    }