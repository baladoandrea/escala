'use client';

import { useState } from 'react';

export default function EscalaPlatform() {
  const [origin, setOrigin] = useState('MAD');
  const [destination, setDestination] = useState('JFK');
  const [selectedDay, setSelectedDay] = useState(1);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { id: 1, label: 'L' },
    { id: 2, label: 'M' },
    { id: 3, label: 'X' },
    { id: 4, label: 'J' },
    { id: 5, label: 'V' },
    { id: 6, label: 'S' },
    { id: 0, label: 'D' },
  ];

  const searchFlightRoutes = async () => {
    setLoading(true);

    // Resuelve dinámicamente la URL si estamos dentro de GitHub Codespaces o en localhost
    const getApiUrl = () => {
      if (typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev')) {
        const host = window.location.hostname;
        return `https://${host.replace(/-3000\./, '-8080.')}/api/routes`;
      }
      return 'http://localhost:8080/api/routes';
    };

    try {
      const res = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          day_of_week: selectedDay,
        }),
      });

      if (!res.ok) throw new Error('Error al conectar con la API');
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.warn('Conectando con fallback de reserva:', err);
      // Datos mock por si el puerto 8080 no responde
      setRoutes([
        {
          type: 'DIRECT',
          stops: 0,
          legs: [{ airline: 'Iberia', flight_number: 'IB-6251', origin, destination }]
        },
        {
          type: '1_STOP',
          stops: 1,
          legs: [
            { airline: 'Air France', flight_number: 'AF-1020', origin, destination: 'CDG' },
            { airline: 'Air France', flight_number: 'AF-022', origin: 'CDG', destination }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#090D16', color: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #1F2937', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#10B981', borderRadius: '8px', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: '#090D16' }}>✈</div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>ESCALA</span>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#94A3B8', border: '1px solid #374151', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
          v1.0.0 — Topology Engine
        </span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', minHeight: 'calc(100vh - 65px)' }}>
        <div style={{ padding: '2rem', borderRight: '1px solid #1F2937', backgroundColor: '#0F172A' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#10B981' }}>Buscador de Conexiones</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>Aeropuerto Origen (IATA)</label>
              <input 
                type="text" 
                value={origin} 
                onChange={(e) => setOrigin(e.target.value)}
                maxLength={3}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', boxSizing: 'border-box' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>Aeropuerto Destino (IATA)</label>
              <input 
                type="text" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                maxLength={3}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', boxSizing: 'border-box' }} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}>Día Operativo de Salida</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {daysOfWeek.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: selectedDay === day.id ? '#10B981' : '#1E293B',
                    color: selectedDay === day.id ? '#090D16' : '#F8FAFC',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={searchFlightRoutes} 
            disabled={loading}
            style={{ width: '100%', padding: '1rem', backgroundColor: '#10B981', color: '#090D16', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
          >
            {loading ? 'Calculando Topología...' : 'Buscar Rutas'}
          </button>
        </div>

        <div style={{ padding: '2rem', backgroundColor: '#090D16' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Topología de Red & Opciones de Escala</h2>

          {routes.length === 0 ? (
            <div style={{ border: '2px dashed #1F2937', borderRadius: '12px', padding: '4rem', textAlign: 'center', color: '#64748B' }}>
              Selecciona un origen y destino para visualizar las combinaciones directas y con escalas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {routes.map((route, idx) => (
                <div key={idx} style={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '10px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: route.stops === 0 ? '#10B98120' : '#38BDF820',
                      color: route.stops === 0 ? '#10B981' : '#38BDF8'
                    }}>
                      {route.stops === 0 ? 'VUELO DIRECTO' : `${route.stops} ESCALA(S)`}
                    </span>
                    <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{route.legs.length} Trayecto(s)</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {route.legs.map((leg, legIdx) => (
                      <div key={legIdx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <div style={{ backgroundColor: '#1E293B', padding: '0.75rem', borderRadius: '8px', flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{leg.airline} • {leg.flight_number}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{leg.origin} ➔ {leg.destination}</div>
                        </div>
                        {legIdx < route.legs.length - 1 && <span style={{ color: '#64748B' }}>➔</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}