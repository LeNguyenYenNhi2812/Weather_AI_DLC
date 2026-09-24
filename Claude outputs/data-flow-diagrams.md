# Weather Application - Data Flow Diagrams

**Project**: Weather Application  
**Date**: 2026-09-24  
**Phase**: INCEPTION - Application Design  
**Component**: Data Flow & API Contracts

---

## Diagram 1: User Journey 1 - Search for New City

**Scenario**: User enters city name to check current weather (Alex - 30 seconds)

```
FLOW: "Search New City"

┌─────────────────┐
│   User Input    │
│  "Ho Chi Minh"  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│  Frontend: SearchComponent   │
│  - Detect input              │
│  - Trigger auto-suggest      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  API Request                             │
│  GET /api/weather/ho-chi-minh-city       │
│  Headers: { lang: "en" }                 │
└────────┬─────────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Backend: API Route Handler    │
│  - Parse city parameter        │
│  - Call WeatherService         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Service: WeatherService         │
│                                  │
│  1. Check in-memory cache        │──NO──┐
│  2. If miss, check database      │      │
│  3. If miss, call external API   │◄─────┘
│  4. Evaluate alerts              │
│  5. Store in database            │
│  6. Format response              │
└────────┬──────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Database Write                     │
│  INSERT INTO weather_readings       │
│  (city, temp, humidity, ...)        │
│  VALUES ('Ho Chi Minh', 28.5, ...)  │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  API Response (200 OK)               │
│  {                                   │
│    "city": "Ho Chi Minh City",       │
│    "current": {                      │
│      "temperature": 28.5,            │
│      "humidity": 75,                 │
│      "wind_speed": 8.5,              │
│      "condition": "Partly Cloudy"    │
│    },                                │
│    "alerts": [                       │
│      {                               │
│        "type": "humidity",           │
│        "message": "High humidity"    │
│      }                               │
│    ],                                │
│    "cache_info": {                   │
│      "source": "live",               │
│      "age_seconds": 0                │
│    }                                 │
│  }                                   │
└────────┬──────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Frontend: Update Display           │
│  - Show temperature + icon          │
│  - Highlight active alerts          │
│  - Enable "Save Favorite" button     │
│  - Update timestamp                 │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  User Sees Weather     │
│  (< 30 seconds total)  │
└────────────────────────┘
```

**Performance Targets**:
- API response: < 2 seconds
- Frontend render: < 1 second
- Total: < 3 seconds ✓

**Failure Points & Mitigation**:
| Point | Failure | Mitigation |
|-------|---------|-----------|
| API Call | Timeout | Use database cache, show "using cache" |
| Invalid City | 404 | Return suggestions list |
| No Cache | No Data | Return empty state with instructions |

---

## Diagram 2: User Journey 3 - Planning with 7-Day Chart

**Scenario**: Sam wants to analyze weather trends for planning (3-5 minutes)

```
FLOW: "Analyze 7-Day Trends"

┌──────────────────────┐
│  User Action         │
│  "View HistoryChart" │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Frontend: HistoryComponent     │
│  - Check localStorage cache     │
│  - If valid (< 30 min), use it  │◄─────NO──────┐
│  - If invalid, request API      │              │
└──────┬────────────────────────────┘             │
       │                                          │
       │                                          │
    YES│                                          │
       ▼                                          │
┌──────────────────────┐            ┌─────────────────────────────┐
│ Use Cached Data      │            │ API Request                 │
│ From localStorage    │            │ GET /api/history/city       │
│                      │            │   ?start=2026-09-17         │
│                      │            │   &end=2026-09-24           │
│                      │            │   &lang=en                  │
│                      │            └────────┬────────────────────┘
│                      │                     │
│                      │                     ▼
│                      │            ┌──────────────────────────┐
│                      │            │ Backend: HistoryRoute   │
│                      │            │ - Parse date parameters │
│                      │            │ - Call ForecastService  │
│                      │            └────────┬─────────────────┘
│                      │                     │
└──────┬───────────────┴─────────────────────┼──────┐
       │                                     │      │
       ▼                                     ▼      │
┌────────────────────────────────────────────────┐  │
│ Service: ForecastService                       │  │
│ 1. Query database for last 7 days              │  │
│    SELECT * FROM weather_readings              │  │
│    WHERE city = $1 AND timestamp > NOW()-7d    │  │
│                                                │  │
│ 2. Sort data chronologically                   │  │
│ 3. Format for chart:                           │  │
│    [                                           │  │
│      { date: "Sep 18", temp: 27.5, h: 72 },   │  │
│      { date: "Sep 19", temp: 28.2, h: 75 },   │  │
│      ... 5 more days                           │  │
│    ]                                           │  │
│ 4. Return formatted array                      │  │
└────────┬─────────────────────────────────────────┘  │
         │                                           │
         ▼                                           │
┌──────────────────────────────────────┐             │
│ Database Query                       │             │
│ SELECT temperature, humidity,        │             │
│        wind_speed, timestamp         │             │
│ FROM weather_readings                │             │
│ WHERE city = 'Ho Chi Minh City'      │             │
│   AND timestamp > (NOW() - '7 days') │             │
│ ORDER BY timestamp ASC               │             │
└────────┬─────────────────────────────┘             │
         │                                           │
         ▼                                           │
┌──────────────────────────────────────┐             │
│ API Response (200 OK)                │             │
│ {                                    │             │
│   "city": "Ho Chi Minh City",        │             │
│   "period": {                        │             │
│     "start": "2026-09-18",           │             │
│     "end": "2026-09-24"              │             │
│   },                                 │             │
│   "data": [                          │             │
│     {                                │             │
│       "date": "Sep 18",              │             │
│       "temperature": 27.5,           │             │
│       "humidity": 72,                │             │
│       "wind_speed": 7.8              │             │
│     },                               │             │
│     ... 6 more days                  │             │
│   ]                                  │             │
│ }                                    │             │
└────────┬─────────────────────────────┘             │
         │                                           │
         ▼                                           │
┌──────────────────────────────────────┐             │
│ Frontend: Render Chart               │             │
│ - Initialize Chart.js                │             │
│ - X-axis: Dates (Sep 18-24)          │             │
│ - Y-axis: Temperature (25-30°C)      │             │
│ - Plot data points                   │             │
│ - Draw line connecting points        │             │
│ - Add hover tooltips                 │             │
│ - Store in localStorage (30 min TTL) │◄────YES────┘
└────────┬───────────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ User Analyzes Chart      │
│ Sees warming trend       │
│ Plans activity for peak  │
│ day (Sep 22: 28.2°C)    │
│ Confidence: HIGH         │
└──────────────────────────┘
```

**Data Transformation**:
```
Database Row:
{
  city: 'Ho Chi Minh City',
  timestamp: 2026-09-18T14:30:00Z,
  temperature: 27.5,
  humidity: 72,
  wind_speed: 7.8
}

↓ (ForecastService transformation)

Chart Format:
{
  date: 'Sep 18',
  temperature: 27.5,
  humidity: 72,
  wind_speed: 7.8
}

↓ (Chart.js rendering)

Visual Output:
  Temp (°C)
  30 |
  29 |        ●
  28 |    ●       ●
  27 | ●
  26 |___________
     Sep18 19 20 21 22 23 24
```

**Performance Targets**:
- Database query: < 500ms
- Chart render: < 1.5 seconds
- Total: < 2 seconds ✓

---

## Diagram 3: Auto-Update Mechanism (30-Minute Refresh)

**Scenario**: Background refresh of all favorite cities' weather

```
FLOW: "Auto-Update Cycle"

┌──────────────────────────────┐
│  Timer: 30 minutes elapsed   │
│  (Scheduled refresh)         │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Frontend: Weather Data Manager          │
│  - Check if online                       │
│  - Iterate through favorites: [city1,    │
│    city2, city3, ...]                    │
└──────────┬───────────────────────────────┘
           │
           ▼
  ┌────────────────────┐
  │ For Each Favorite  │
  │ city loop          │
  └────────┬───────────┘
           │
     ┌─────┴─────────────────────────────┐
     │                                   │
     ▼                                   ▼
┌─────────────────────┐      ┌──────────────────────┐
│ Request Weather     │      │ Next City            │
│ GET /api/weather/   │      │ (until list done)    │
│   city1             │      └──────────┬───────────┘
└────────┬────────────┘                 ▲
         │                              │
         ▼                              │
┌──────────────────────────────────┐    │
│ Backend Processing               │    │
│ - Check database cache           │    │
│ - If expired (> 30 min):         │    │
│   • Call external API            │    │
│   • Store new reading            │    │
│   • Update timestamp             │    │
│ - Evaluate alerts                │    │
│ - Return formatted response      │    │
└────────┬─────────────────────────┘    │
         │                              │
         ▼                              │
┌──────────────────────────────────┐    │
│ API Response                     │    │
│ {                                │    │
│   "city": "city1",               │    │
│   "current": {...},              │    │
│   "alerts": [...],               │    │
│   "cache_info": {...}            │    │
│ }                                │    │
└────────┬─────────────────────────┘    │
         │                              │
         ▼                              │
┌──────────────────────────────────┐    │
│ Frontend: Update UI (Silent)     │    │
│ - Update temperature display     │    │
│ - Refresh alert badges           │    │
│ - Update "Last updated" timestamp│    │
│ - No modal/popup                 │    │
│ - Persist to localStorage        │    │
└────────┬─────────────────────────┘    │
         │                              │
         └──────────────────────────────┘

┌──────────────────────────────────┐
│ Cycle Complete                   │
│ All favorites updated             │
│ Next refresh: 30 min later        │
└──────────────────────────────────┘
```

**Network Optimization**:
```
Parallel Requests:
- Request 3 cities simultaneously (not sequential)
- Connection pooling (HTTP keep-alive)
- Response compression (gzip)
- Target: All 3-4 cities within 2 seconds

Bandwidth Optimization:
- Payload per city: ~500 bytes
- 4 cities × 500 bytes = 2 KB
- Refresh every 30 min = 2 KB/30 min = minimal data usage

Battery Impact (Mobile):
- Background update: 2-3 seconds active per cycle
- 30-min interval: 48 cycles/day ≈ 2 minutes total per day
- With caching: Minimal battery drain
```

---

## Diagram 4: Offline Mode Transition & Sync

**Scenario**: User loses connectivity, then regains it

```
FLOW: "Offline Detection & Sync"

PHASE 1: ONLINE → OFFLINE TRANSITION
─────────────────────────────────────

┌──────────────────────────┐
│  Connection Lost         │
│  (Network disconnects)   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Service Worker Detects Offline      │
│  (fetch event fails)                 │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Frontend: Weather Data Manager      │
│  - Switch to OFFLINE mode            │
│  - Stop API refresh cycle            │
│  - Show "Offline Mode" indicator     │
│  - Disable manual refresh button     │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Service Worker Cache Strategy       │
│  - Intercept all fetch() requests    │
│  - Check cache for matching URL      │
│  - If cached: Serve from cache       │
│  - If not cached: Show error msg     │
│  - Queue pending updates             │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  UI State                            │
│  - Display cached data               │
│  - Show "Last updated: 45 min ago"   │
│  - Show "Offline Mode - Using Cache" │
│  - Favorites still browsable         │
│  - Alerts still visible              │
└──────────────────────────────────────┘


PHASE 2: OFFLINE → ONLINE TRANSITION
─────────────────────────────────────

┌──────────────────────────┐
│  Connection Restored     │
│  (Network reconnects)    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Service Worker Detects Online       │
│  (fetch succeeds)                    │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Sync Manager                        │
│  - Detect pending updates queue      │
│  - Fetch all favorite cities         │
│  - Get latest forecast data          │
│  - Merge with local cache            │
│    (Conflict resolution:             │
│     Newer timestamp = authoritative) │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Data Merge Process                  │
│                                      │
│  For each favorite city:             │
│                                      │
│  Local Cache:          Server:       │
│  Temp: 28.2, time:1    Temp: 28.5,   │
│  Sync: 1.5h ago        time: 5min    │
│                                      │
│  Result: Use server data (fresher)   │
│                                      │
│  Store merged data in:               │
│  - localStorage                      │
│  - IndexedDB (large datasets)        │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Backend: Database Update            │
│  UPDATE weather_readings             │
│  SET synced = true                   │
│  WHERE city IN (favorites)           │
│    AND synced = false                │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Frontend: Update UI                 │
│  - Remove "Offline Mode" indicator   │
│  - Show fresh data with new times    │
│  - Re-enable refresh button          │
│  - Resume 30-min auto-update cycle   │
│  - Show toast: "Data synchronized"   │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  System: Back to Normal              │
│  - Online mode                       │
│  - Auto-refresh active               │
│  - Cache fresh                       │
└──────────────────────────────────────┘
```

**Data Conflict Resolution**:
```
Scenario: Offline cache differs from server

Local Cache (30 min old):
  Temperature: 27.8°C
  Humidity: 72%
  Last update: 2026-09-24 14:00:00

Server (Current):
  Temperature: 28.5°C
  Humidity: 75%
  Last update: 2026-09-24 14:30:00

Conflict Resolution:
  → Use server data (4 hours is fresher)
  → Update local cache
  → Display new values
  → Show sync notification

Edge case: Server is older
  Server (Stale):        Current Cache:
  Time: 2026-09-24 14:00  Time: 2026-09-24 14:20

  Resolution:
  → Keep local cache
  → Log warning
  → Don't overwrite newer data
```

---

## Diagram 5: API Contract - Weather Endpoint

**Endpoint**: `GET /api/weather/:city`

**Request Flow**:
```
┌─────────────────────────────────┐
│ HTTP Request                    │
├─────────────────────────────────┤
│ GET /api/weather/ho-chi-minh    │
│ HTTP/1.1                        │
│ Host: weather-app.vercel.app    │
│ Accept: application/json        │
│ User-Agent: Mozilla/5.0 ...     │
│ Query Params: lang=en           │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Backend Parsing                 │
├─────────────────────────────────┤
│ city = "ho-chi-minh"            │
│ lang = "en"                     │
│ Validation:                     │
│ ✓ City: alphanumeric + hyphens  │
│ ✓ Lang: "en" or "vi"            │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Service Processing              │
├─────────────────────────────────┤
│ 1. Cache check (30 min)         │
│ 2. If miss: API call            │
│ 3. Alert evaluation             │
│ 4. Data formatting              │
│ 5. Response generation          │
└─────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│ HTTP Response (Success)              │
├──────────────────────────────────────┤
│ HTTP/1.1 200 OK                      │
│ Content-Type: application/json       │
│ Cache-Control: max-age=300           │
│ X-Cache: HIT (from database)         │
│                                      │
│ {                                    │
│   "city": "Ho Chi Minh City",        │
│   "country": "Vietnam",              │
│   "coordinates": {                   │
│     "lat": 10.8164,                  │
│     "lng": 106.6626                  │
│   },                                 │
│   "current": {                       │
│     "timestamp": "2026-09-24T14:30" │
│     "temperature": 28.5,             │
│     "humidity": 75,                  │
│     "wind_speed": 8.5,               │
│     "condition": "Partly Cloudy",    │
│     "icon": "02d",                   │
│     "description": "Partly cloudy"   │
│   },                                 │
│   "alerts": [                        │
│     {                                │
│       "type": "humidity",            │
│       "severity": "info",            │
│       "message": "High humidity",    │
│       "icon": "💧"                   │
│     }                                │
│   ],                                 │
│   "cache_info": {                    │
│     "source": "database",            │
│     "age_seconds": 145               │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ HTTP Response (Error: City not found)│
├──────────────────────────────────────┤
│ HTTP/1.1 404 Not Found               │
│ Content-Type: application/json       │
│                                      │
│ {                                    │
│   "error": "City not found",         │
│   "requested": "xyz-123",            │
│   "suggestions": [                   │
│     {                                │
│       "city": "Ho Chi Minh City",    │
│       "country": "Vietnam",          │
│       "match_score": 0.92            │
│     },                               │
│     {                                │
│       "city": "Da Nang",             │
│       "country": "Vietnam",          │
│       "match_score": 0.45            │
│     }                                │
│   ]                                  │
│ }                                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ HTTP Response (Error: API Timeout)   │
├──────────────────────────────────────┤
│ HTTP/1.1 200 OK (with fallback)      │
│                                      │
│ {                                    │
│   "city": "Ho Chi Minh City",        │
│   "error": "api_timeout",            │
│   "message": "Unable to fetch",      │
│   "using_cache": true,               │
│   "cache_age_hours": 2.5,            │
│   "cached_data": {                   │
│     "temperature": 27.8,             │
│     "humidity": 72,                  │
│     ...                              │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
```

---

## Summary Table: Data Flows

| Flow | Trigger | Duration | Cache | Data Size | Frequency |
|------|---------|----------|-------|-----------|-----------|
| Search City | User input | < 3 sec | 30 min | Small (1 city) | On-demand |
| 7-Day Chart | View history | < 2 sec | 30 min | Medium (7 entries) | Per session |
| Auto-Update | Timer (30 min) | < 2 sec | New | Medium (all favorites) | Every 30 min |
| Offline Sync | Reconnect | < 5 sec | Merge | Medium (multi-city) | On reconnect |
| 5-Day Forecast | View forecast | < 2 sec | Daily | Medium (5 days) | Per session |

---

**Status**: ✅ DATA FLOW DIAGRAMS COMPLETE

**Application Design Phase Deliverables**:
- ✅ Component Architecture
- ✅ Service Layer Design
- ✅ Data Flow Diagrams
- ✅ API Contracts

