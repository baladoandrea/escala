// Crear Nodos de Aeropuertos
CREATE (lcg:Airport {iata: 'LCG', name: 'A Coruña', country: 'ES', lat: 43.302, lon: -8.377})
CREATE (mad:Airport {iata: 'MAD', name: 'Madrid Barajas', country: 'ES', lat: 40.483, lon: -3.567})
CREATE (lhr:Airport {iata: 'LHR', name: 'London Heathrow', country: 'GB', lat: 51.470, lon: -0.454})
CREATE (mex:Airport {iata: 'MEX', name: 'Ciudad de México', country: 'MX', lat: 19.436, lon: -99.072})

// Crear Relaciones de Vuelos (Tramo LCG -> MAD -> MEX)
CREATE (lcg)-[:FLIGHT_ROUTE {airline: 'IB', flight_number: 'IB0523', dep_time: '08:45', arr_time: '09:55', origin: 'LCG', destination: 'MAD', days_of_week: '1111111'}]->(mad)
CREATE (mad)-[:FLIGHT_ROUTE {airline: 'IB', flight_number: 'IB6401', dep_time: '12:10', arr_time: '18:15', origin: 'MAD', destination: 'MEX', days_of_week: '1111111'}]->(mex)

// Crear Relaciones Alternativas (Tramo LCG -> LHR -> MEX)
CREATE (lcg)-[:FLIGHT_ROUTE {airline: 'VY', flight_number: 'VY7102', dep_time: '10:15', arr_time: '11:30', origin: 'LCG', destination: 'LHR', days_of_week: '1010100'}]->(lhr)
CREATE (lhr)-[:FLIGHT_ROUTE {airline: 'BA', flight_number: 'BA0243', dep_time: '15:10', arr_time: '20:00', origin: 'LHR', destination: 'MEX', days_of_week: '1111111'}]->(mex);