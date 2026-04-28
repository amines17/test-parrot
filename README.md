# Telemetry Dashboard — Parrot Technical Test

API de recherche de télémétrie drone + dashboard React/TypeScript.

---

## Démarrage rapide

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

API disponible sur `http://localhost:8000`  
Documentation Swagger : `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard disponible sur `http://localhost:5173`

---

## Endpoints

### `GET /events`

| Paramètre | Type   | Défaut | Description                     |
|-----------|--------|--------|---------------------------------|
| device    | string | —      | Filtre par device               |
| status    | string | —      | Filtre par status               |
| limit     | int    | 20     | Résultats par page (max 100)    |
| offset    | int    | 0      | Décalage de pagination          |
| sort      | string | desc   | Tri timestamp : `asc` / `desc`  |

Réponse :

```json
{
  "items": [...],
  "total": 10003,
  "limit": 20,
  "offset": 0,
  "anomaly_count": 2
}
```

### `GET /stats`

```json
{
  "total": 10003,
  "avg_battery": 49.87,
  "by_status": [
    { "status": "idle", "count": 2531 },
    { "status": "flying", "count": 2512 }
  ]
}
```

---

## Architecture

```
backend/
├── app/
│   ├── main.py              # CORS, lifespan, logging config
│   ├── database.py          # aiosqlite, seed 10k+ événements, index
│   ├── models/event.py      # Pydantic schemas + validators
│   ├── repositories/        # SQL async pur, aucune logique métier
│   ├── services/            # Logique métier, validation des params
│   └── routers/             # HTTP layer + logging structuré JSON

frontend/
├── src/
│   ├── api/client.ts        # fetch wrapper, AbortController, timeout
│   ├── hooks/               # useEvents (debounce), useStats (useMemo)
│   └── components/          # EventList, EventFilters, StatsPanel, BatteryChart
```

---

## Dataset — pièges volontaires

Le seed contient trois événements pathologiques intentionnels. Votre code doit les gérer proprement.

| Piège | Valeur |
|---|---|
| Status inconnu | `"unknown"` |
| Batterie négative | `-5` |
| Timestamp hors-ordre | `2025-12-31T23:59:00` |

---

## À documenter dans ce README

Complétez les sections suivantes avant de rendre le projet.

### Choix techniques

> Expliquez vos principaux choix d'implémentation : stack, librairies, décisions d'architecture notables.

### Stratégie de scaling en production

> Quels seraient les points de scaling de cette app si elle devait passer en production avec un volume de données 100x supérieur ?

### Question monitoring

> Comment détecteriez-vous un problème de performance en production sur l'endpoint `/events` ?

### Axes d'amélioration

> Donnez 3 axes d'amélioration de votre code si vous aviez 1 jour de plus.
