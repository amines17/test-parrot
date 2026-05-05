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

**Backend — FastAPI + aiosqlite**

FastAPI a été retenu pour sa gestion native de l'async, la génération automatique de la doc OpenAPI et la validation de paramètres via les annotations Python (`Annotated`, `Query`). L'accès à SQLite est entièrement asynchrone via `aiosqlite`, ce qui évite de bloquer la boucle d'événements sur les requêtes I/O.

L'architecture est découpée en trois couches strictes :
- **repository** : SQL pur, aucune logique métier, requêtes paramétrées uniquement (pas d'interpolation de chaîne sur les entrées utilisateur). `COUNT(*) OVER()` évite un second round-trip pour le total paginé.
- **service** : transformation des données brutes, détection des anomalies via `EventRaw.to_out()` — les valeurs invalides sont conservées en base et signalées plutôt que rejetées, ce qui préserve l'observabilité.
- **router** : couche HTTP, logging structuré JSON, header `X-Response-Time`.

Les indexes composites `(device, status)` et les indexes simples sur `timestamp` couvrent les filtres courants et le tri.

**Frontend — React 19 + Vite + Recharts**

Les hooks `useEvents` et `useStats` encapsulent tout le cycle fetch/abort/loading/error. `useEvents` expose un paramètre `externalTick` qui permet à `App` de propager le refresh global sans `useEffect` de synchronisation intermédiaire. Le debounce de 300 ms dans `useEvents` limite les requêtes lors de la saisie dans les filtres. Le proxy Vite évite tout problème CORS en développement.

---

### Stratégie de scaling en production

À 100× de volume (~1 M d'événements) les points de friction sont les suivants :

- **Base de données** : SQLite ne supporte pas la concurrence en écriture. La migration vers PostgreSQL s'impose, avec des index partiels sur les colonnes filtrées et un index sur `(device, status, timestamp)` pour couvrir les requêtes les plus fréquentes. Pour du time-series à très fort débit, TimescaleDB ou ClickHouse sont plus adaptés.
- **Pagination** : `OFFSET` devient lent sur de grandes tables (`O(n)` scan). Passer à une pagination par curseur (keyset pagination sur `(timestamp, id)`) maintient des performances constantes quelle que soit la profondeur de page.
- **Agrégations `/stats`** : recalculer `COUNT / AVG` sur 1 M de lignes à chaque requête est coûteux. Mettre en cache ce résultat (Redis, TTL ~30 s) ou le pré-calculer via une vue matérialisée réduit la charge.
- **Scalabilité horizontale** : passer à plusieurs workers (Gunicorn + Uvicorn workers) derrière un load balancer. Avec une base partagée, les connexions poolées (asyncpg + pgBouncer) deviennent nécessaires.
- **Ingest** : si les drones poussent des événements en temps réel, une file de messages (Kafka, SQS) découple l'ingestion de l'interrogation et absorbe les pics de charge.

---

### Question monitoring

Pour détecter une dégradation de `/events` en production :

1. **Métriques RED** (Rate, Errors, Duration) via Prometheus + Grafana : alerter si le p95 de latence dépasse 200 ms ou si le taux d'erreur 5xx monte. Le header `X-Response-Time` déjà en place est exploitable par un scraper.
2. **Logs structurés** : chaque requête logue `elapsed_ms`, les paramètres et `results_count` en JSON. Un pipeline (Loki, Datadog, CloudWatch Insights) permet d'agréger et de corréler les lenteurs avec les valeurs de filtres — utile pour identifier un filtre particulier qui génère un full scan.
3. **Slow query log** côté base : activer le log des requêtes > 50 ms pour détecter un index manquant ou une requête non paramétrée.
4. **Synthétique** : une sonde externe (Blackbird, Checkly) qui appelle l'endpoint toutes les minutes et alerte si le SLA est dépassé, indépendamment de l'observabilité interne.

---

### Axes d'amélioration

1. **Tests** : absence totale de tests automatisés. La priorité serait des tests d'intégration sur les endpoints (`pytest` + `httpx.AsyncClient` + base SQLite in-memory) couvrant les cas nominaux, la pagination, les filtres combinés et les trois événements piège.

2. **Pagination par curseur** : l'`OFFSET` SQL actuel se dégrade linéairement sur de grandes tables. Remplacer par une pagination `WHERE (timestamp, id) < (?, ?)` avec un token opaque côté client garantit des performances constantes et élimine les doublons lors d'insertions concurrentes.

3. **Validation des filtres `device` et `status`** : aujourd'hui ces paramètres acceptent n'importe quelle chaîne et génèrent une requête SQL valide mais potentiellement inutile (ex. `device=inexistant` renvoie 0 résultats sans erreur). Les valider contre un enum connu côté API (`Literal["anafi", "bebop", ...]`) améliore le feedback client et évite des requêtes superflues en base.

## Objectif du test

Ce test vise à évaluer votre capacité à concevoir et implémenter une application full-stack en conditions proches de la production.

Nous portons une attention particulière à :
- la qualité du code
- la structuration
- la gestion des cas réels (edge cases)
- la réflexion autour de la performance et du passage à l’échelle

## Workflow attendu

1. Fork du repository
2. Créer une branche dédiée (ex: feature/telemetry)
3. Développer sur cette branche
4. Ouvrir une Pull Request vers main

Les push directs sur main sont bloqués

La qualité des commits et du workflow Git fait partie de l’évaluation


## Attendus importants

- L’API doit rester performante (<200ms sur 10k+ événements)
- Les données invalides doivent être traitées proprement (validation ou signalement)
- Une structuration claire du code est attendue (pas de code monolithique)
- Le projet n’a pas besoin d’être complet : la qualité prime sur l’exhaustivité

Il est tout à fait acceptable de ne pas tout terminer. Nous privilégions la qualité, la clarté des choix techniques et la capacité d’analyse.
