'use client';

import { useState, useEffect, useRef } from 'react';

const i18n = {
  es: {
    title: 'ESCALA',
    tagline: 'TOPOLOGY ENGINE',
    searchTitle: 'Buscador de Conexiones',
    origin: 'Aeropuerto Origen (IATA)',
    dest: 'Aeropuerto Destino (IATA)',
    dayOfWeek: 'Día Operativo de Salida',
    radius: 'Radio Proximidad Nearby',
    stops: 'Número de Escalas',
    allStops: 'Todas',
    directOnly: 'Solo Directos',
    oneStop: 'Máx. 1 Escala',
    twoStops: 'Máx. 2 Escalas',
    alliances: 'Alianza de Aerolíneas',
    allAlliances: 'Todas las alianzas',
    searchBtn: 'Buscar Rutas Topológicas',
    calculating: 'Calculando Topología...',
    mapTitle: 'Proyección Topológica Geodésica',
    resultsTitle: 'Opciones de Escala y Conexión',
    noResults: 'Selecciona un origen y destino para visualizar los arcos geodésicos y combinaciones.',
    direct: 'VUELO DIRECTO',
    stopsLabel: 'ESCALA(S)',
    legs: 'Trayecto(s)',
  },
  en: {
    title: 'ESCALA',
    tagline: 'TOPOLOGY ENGINE',
    searchTitle: 'Connection Finder',
    origin: 'Origin Airport (IATA)',
    dest: 'Destination Airport (IATA)',
    dayOfWeek: 'Operating Departure Day',
    radius: 'Nearby Radius Search',
    stops: 'Max Layover Stops',
    allStops: 'All',
    directOnly: 'Direct Only',
    oneStop: 'Max 1 Stop',
    twoStops: 'Max 2 Stops',
    alliances: 'Airline Alliances',
    allAlliances: 'All Alliances',
    searchBtn: 'Search Topological Routes',
    calculating: 'Computing Topology...',
    mapTitle: 'Geodesic Topological Projection',
    resultsTitle: 'Layover & Connection Options',
    noResults: 'Select origin and destination to display geodesic arcs and route options.',
    direct: 'NON-STOP FLIGHT',
    stopsLabel: 'STOP(S)',
    legs: 'Leg(s)',
  }
};

export default function EscalaPlatform() {
  const [lang, setLang] = useState('es');
  const t = i18n[lang];

  const [origin, setOrigin] = useState('MAD');
  const [destination, setDestination] = useState('JFK');
  const [selectedDay, setSelectedDay] = useState(1);
  const [radius, setRadius] = useState('0');
  const [maxStops, setMaxStops] = useState('ALL');
  const [alliance, setAlliance] = useState('ALL');

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);

  const daysOfWeek = [
    { id: 1, label: 'L' },
    { id: 2, label: 'M' },
    { id: 3, label: 'X' },
    { id: 4, label: 'J' },
    { id: 5, label: 'V' },
    { id: 6, label: 'S' },
    { id: 0, label: 'D' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 800;
    canvas.height = 220;

    // Fondo
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rejilla
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (routes.length === 0) return;

    const x1 = 80;
    const y1 = 110;
    const x2 = canvas.width - 80;
    const y2 = 110;

    // Dibujar Arcos Topológicos
    routes.forEach((route, index) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);

      const offset = (index - (routes.length - 1) / 2) * 40;
      const controlY = route.stops === 0 ? 30 : 110 + offset;
      
      ctx.quadraticCurveTo((x1 + x2) / 2, controlY, x2, y2);

      ctx.strokeStyle = route.stops === 0 ? '#10B981' : '#F97316';
      ctx.lineWidth = route.stops === 0 ? 3 : 2;
      ctx.setLineDash(route.stops === 0 ? [] : [6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (route.stops > 0) {
        const midX = (x1 + x2) / 2;
        ctx.beginPath();
        ctx.arc(midX, (y1 + controlY) / 2, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#F97316';
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.stroke();
      }
    });

    // Nodos Origen y Destino
    [{ x: x1, y: y1, label: origin }, { x: x2, y: y2, label: destination }].forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(node.label, node.x - 12, node.y + 24);
    });
  }, [routes, origin, destination]);

  const searchFlightRoutes = async () => {
    setLoading(true);

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

      if (!res.ok) throw new Error('Error en backend Go');
      let data = await res.json();

      if (maxStops !== 'ALL') {
        const limit = parseInt(maxStops, 10);
        data = data.filter((r) => r.stops <= limit);
      }

      setRoutes(data);
    } catch (err) {
      console.warn('Backend no disponible. Cargando datos de contingencia:', err);
      let mockData = [
        { type: 'DIRECT', stops: 0, legs: [{ airline: 'Iberia (Oneworld)', flight_number: 'IB-6251', origin, destination }] },
        { type: '1_STOP', stops: 1, legs: [{ airline: 'Air France (SkyTeam)', flight_number: 'AF-1020', origin, destination: 'CDG' }, { airline: 'Air France (SkyTeam)', flight_number: 'AF-022', origin: 'CDG', destination }] },
        { type: '2_STOPS', stops: 2, legs: [{ airline: 'Lufthansa (Star Alliance)', flight_number: 'LH-1110', origin, destination: 'FRA' }, { airline: 'Lufthansa (Star Alliance)', flight_number: 'LH-710', origin: 'FRA', destination: 'HND' }, { airline: 'ANA (Star Alliance)', flight_number: 'NH-204', origin: 'HND', destination }] }
      ];

      if (maxStops !== 'ALL') {
        const limit = parseInt(maxStops, 10);
        mockData = mockData.filter((r) => r.stops <= limit);
      }

      setRoutes(mockData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#090D16', color: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1F2937', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#10B981', borderRadius: '8px', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: '#090D16' }}>✈</div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{t.title}</span>
          <span style={{ fontSize: '0.75rem', color: '#10B981', backgroundColor: '#10B98120', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{t.tagline}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ border: '1px solid #374151', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
            <button onClick={() => setLang('es')} style={{ padding: '0.3rem 0.75rem', border: 'none', backgroundColor: lang === 'es' ? '#10B981' : '#111827', color: lang === 'es' ? '#090D16' : '#94A3B8', fontWeight: 'bold', cursor: 'pointer' }}>ES</button>
            <button onClick={() => setLang('en')} style={{ padding: '0.3rem 0.75rem', border: 'none', backgroundColor: lang === 'en' ? '#10B981' : '#111827', color: lang === 'en' ? '#090D16' : '#94A3B8', fontWeight: 'bold', cursor: 'pointer' }}>EN</button>
          </div>
        </div>
      </header>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', minHeight: 'calc(100vh - 65px)' }}>
        
        {/* Panel de Control */}
        <div style={{ padding: '1.5rem', borderRight: '1px solid #1F2937', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#10B981', margin: 0 }}>{t.searchTitle}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>{t.origin}</label>
              <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} maxLength={3} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>{t.dest}</label>
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={3} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>{t.radius}</label>
            <select value={radius} onChange={(e) => setRadius(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', boxSizing: 'border-box' }}>
              <option value="0">Aeropuerto Exacto (0 km)</option>
              <option value="50">+50 km (Cercanos)</option>
              <option value="100">+100 km (Regionales)</option>
              <option value="200">+200 km (Área Metropolitana)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>{t.stops}</label>
            <select value={maxStops} onChange={(e) => setMaxStops(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', boxSizing: 'border-box' }}>
              <option value="ALL">{t.allStops}</option>
              <option value="0">{t.directOnly}</option>
              <option value="1">{t.oneStop}</option>
              <option value="2">{t.twoStops}</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '0.3rem' }}>{t.alliances}</label>
            <select value={alliance} onChange={(e) => setAlliance(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', boxSizing: 'border-box' }}>
              <option value="ALL">{t.allAlliances}</option>
              <option value="OW">Oneworld</option>
              <option value="SA">Star Alliance</option>
              <option value="ST">SkyTeam</option>
              <option value="LCC">Low-Cost / LCC</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>{t.dayOfWeek}</label>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {daysOfWeek.map((day) => (
                <button key={day.id} onClick={() => setSelectedDay(day.id)} style={{ flex: 1, padding: '0.4rem 0', borderRadius: '6px', border: '1px solid #334155', backgroundColor: selectedDay === day.id ? '#10B981' : '#1E293B', color: selectedDay === day.id ? '#090D16' : '#F8FAFC', fontWeight: 'bold', cursor: 'pointer' }}>
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={searchFlightRoutes} disabled={loading} style={{ width: '100%', padding: '0.85rem', backgroundColor: '#10B981', color: '#090D16', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' }}>
            {loading ? t.calculating : t.searchBtn}
          </button>
        </div>

        {/* Panel de Visualización */}
        <div style={{ padding: '1.5rem', backgroundColor: '#090D16', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#94A3B8', margin: '0 0 0.5rem 0' }}>{t.mapTitle}</h3>
            <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t.resultsTitle}</h3>

            {routes.length === 0 ? (
              <div style={{ border: '2px dashed #1F2937', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                {t.noResults}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {routes.map((route, idx) => (
                  <div key={idx} style={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '10px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: route.stops === 0 ? '#10B98120' : '#F9731620', color: route.stops === 0 ? '#10B981' : '#F97316' }}>
                        {route.stops === 0 ? t.direct : `${route.stops} ${t.stopsLabel}`}
                      </span>
                      <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{route.legs.length} {t.legs}</span>
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
    </div>
  );
}