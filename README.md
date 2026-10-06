# ✈️ ESCALA — Route Topology Engine & Network Platform

**ESCALA** es un motor de precisión y visualizador de topología de red para la conectividad de rutas aéreas globales. Permite descubrir y evaluar conexiones transatlánticas e interlineales (**directos, 1 escala y 2 escalas**) analizando restricciones temporales de conexión (MCT), puntualidad (OTP) y calendarios operativos mediante máscaras de bits.

---

## 👥 Equipo del Proyecto

* **Líder de Desarrollo / Software Engineer:** Andrea Balado

---

## 🎨 Identidad Visual & Design Tokens

* **Noche Profunda (Fondo UI):** `#090D16`
* **Verde Esmeralda Radiactivo (Nodos / Hubs Activos):** `#10B981`
* **Naranja Terracota (Alertas / Self-Transfer / Escalas Críticas):** `#F97316`
* **Gris Grafito (Tarjetas & Paneles):** `#111827`
* **Tipografías:** `Syne` (Titulares/Logo), `Plus Jakarta Sans` (UI) y `JetBrains Mono` (Códigos IATA, MCT y Bitmasks).

---

## 🛠️ Arquitectura Técnica

El proyecto se compone de una arquitectura multimodular:

* **Frontend:** Next.js + Tailwind CSS + Mapbox GL / WebGL Canvas para la representación geodésica de arcos de vuelo.
* **Route Engine (Go):** Servicio concurrente para recorridos en grafo (BFS) sobre la base de datos.
* **Spatial & Metadata API (Python / FastAPI):** Servicio para consultas espaciales (PostGIS) y metadatos de aeropuertos.
* **Base de Datos:** Neo4j (Grafos de vuelo) + PostgreSQL con extensión PostGIS.

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
