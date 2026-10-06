# ✈️ ESCALA — Route Topology Engine & Network Platform

**ESCALA** es un motor de precisión y visualizador de topología de red para la conectividad de rutas aéreas globales. Permite descubrir y evaluar conexiones transatlánticas e interlineales (**directos, 1 escala y 2 escalas**) analizando restricciones temporales de conexión (MCT), puntualidad (OTP) y calendarios operativos mediante máscaras de bits.

---

## 👥 Equipo del Proyecto

* **Líder de Desarrollo / Software Engineer:** Andrea Balado[cite: 1]
* **Soporte Técnico / QA & Systems Support:** Mario García[cite: 1]

---

## 🎨 Identidad Visual & Design Tokens

* **Noche Profunda (Fondo UI):** `#090D16`[cite: 1]
* **Verde Esmeralda Radiactivo (Nodos / Hubs Activos):** `#10B981`[cite: 1]
* **Naranja Terracota (Alertas / Self-Transfer / Escalas Críticas):** `#F97316`[cite: 1]
* **Gris Grafito (Tarjetas & Paneles):** `#111827`[cite: 1]
* **Tipografías:** `Syne` (Titulares/Logo), `Plus Jakarta Sans` (UI) y `JetBrains Mono` (Códigos IATA, MCT y Bitmasks)[cite: 1].

---

## 🛠️ Arquitectura Técnica

El proyecto se compone de una arquitectura multimodular[cite: 1]:

* **Frontend:** Next.js + Tailwind CSS + Mapbox GL / WebGL Canvas para la representación geodésica de arcos de vuelo[cite: 1].
* **Route Engine (Go):** Servicio concurrente para recorridos en grafo (BFS) sobre la base de datos[cite: 1].
* **Spatial & Metadata API (Python / FastAPI):** Servicio para consultas espaciales (PostGIS) y metadatos de aeropuertos[cite: 1].
* **Base de Datos:** Neo4j (Grafos de vuelo) + PostgreSQL con extensión PostGIS[cite: 1].

---

## 🚀 Entorno de Desarrollo (GitHub Codespaces)

Este proyecto está optimizado para ejecutarse en **GitHub Codespaces** sin necesidad de dependencias locales ni instalaciones de Docker en tu máquina física.

### Pasos para iniciar en Codespaces:

1. En la página principal del repositorio en GitHub, haz clic en el botón verde **`< > Code`**.
2. Selecciona la pestaña **Codespaces** y haz clic en **Create codespace on main**.
3. Una vez abierto el entorno de VS Code en tu navegador, ejecuta los servidores en el terminal integrado:

```bash
# Para el Frontend
cd frontend && npm install && npm run dev

# Para el Motor en Go
cd backend-go && go run main.go
