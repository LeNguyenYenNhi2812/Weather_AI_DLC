# Weather Application - Component Architecture

**Project**: Weather Application  
**Date**: 2026-09-24  
**Phase**: INCEPTION - Application Design  
**Depth Level**: Comprehensive (Greenfield, multiple concurrent components, complex offline strategy)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Browser)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐  │
│  │   UI Components      │  │  Service Worker      │  │  localStorage│  │
│  │  (Search, Forecast   │  │  (Caching, Offline   │  │  (Favorites, │  │
│  │   Favorites, Alerts) │  │   Support)           │  │   Prefs)     │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────┘  │
│           ↓                          ↓                       ↑            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │          Weather Data Manager (State Orchestration)             │  │
│  │  - Manages API calls vs cache                                   │  │
│  │  - Handles offline transitions                                  │  │
│  │  - Coordinates refresh cycles                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│           ↓                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │           API Service Layer (HTTP/HTTPS)                        │  │
│  │  - Backend API communication                                    │  │
│  │  - Request/response formatting                                  │  │
│  │  - Error handling & retries                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│           ↓                                                              │
└─────────────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND/API LAYER (Server)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Express.js API Server                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  ┌────────────────────┐  ┌────────────────────┐                 │  │
│  │  │ Weather Routes     │  │ Alert Routes       │                 │  │
│  │  │ GET /api/weather   │  │ GET /api/alerts    │                 │  │
│  │  │ GET /api/forecast  │  │ GET /api/validate  │                 │  │
│  │  │ GET /api/history   │  │                    │                 │  │
│  │  └────────────────────┘  └────────────────────┘                 │  │
│  │           ↓                         ↓                            │  │
│  │  ┌──────────────────────────────────────────┐                   │  │
│  │  │      Service Layer                       │                   │  │
│  │  ├──────────────────────────────────────────┤                   │  │
│  │  │ • WeatherService (fetch, cache, store)   │                   │  │
│  │  │ • AlertService (evaluate thresholds)     │                   │  │
│  │  │ • ForecastService (parse, transform)     │                   │  │
│  │  │ • DataCacheService (optimize queries)    │                   │  │
│  │  └──────────────────────────────────────────┘                   │  │
│  │           ↓                                                      │  │
│  │  ┌──────────────────────────────────────────┐                   │  │
│  │  │      External API Integration            │                   │  │
│  │  │      (OpenWeatherMap or equivalent)      │                   │  │
│  │  └──────────────────────────────────────────┘                   │  │
│  │                    ↓                                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│           ↓                                                              │
└─────────────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER (Database)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │          PostgreSQL Database (Neon)                             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │  │
│  │  │ weather_readings │  │ forecasts        │  │ user_prefs   │  │  │
│  │  │ ─────────────────│  │ ──────────────── │  │ ────────────│  │  │
│  │  │ • id (PK)        │  │ • id (PK)        │  │ • id (PK)  │  │  │
│  │  │ • city           │  │ • city           │  │ • city     │  │  │
│  │  │ • timestamp      │  │ • date           │  │ • lang     │  │  │
│  │  │ • temperature    │  │ • high_temp      │  │ • alerts_on│  │  │
│  │  │ • humidity       │  │ • low_temp       │  │ • dark_mode│  │  │
│  │  │ • wind_speed     │  │ • condition      │  │ • units    │  │  │
│  │  │ • condition      │  │ • icon           │  │            │  │  │
│  │  │ • description    │  │ • chance_rain    │  │            │  │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘  │  │
│  │           ↑                      ↑                    ↑         │  │
│  │        (Queried frequently)  (Updated daily)    (Per session)  │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy & Responsibilities

### 1. Frontend Layer Components

#### 1.1 UI Components
```
├─ App Container (Main)
│  ├─ SearchComponent
│  │  ├─ SearchInput (auto-suggest)
│  │  └─ SearchResults (weather display)
│  │
│  ├─ FavoritesComponent
│  │  ├─ FavoritesGrid (multi-city dashboard)
│  │  └─ FavoriteCard (individual city card)
│  │
│  ├─ AlertsComponent
│  │  ├─ AlertBadge (visual indicator)
│  │  └─ AlertDetailModal (detailed info)
│  │
│  ├─ HistoryComponent
│  │  ├─ HistoryChart (7-day trend chart)
│  │  └─ DataSwitchTabs (temp/humidity/wind toggle)
│  │
│  ├─ ForecastComponent
│  │  ├─ ForecastGrid (5-day display)
│  │  └─ ForecastCard (individual day forecast)
│  │
│  ├─ OfflineIndicator
│  │  └─ Shows connection status
│  │
│  └─ LanguageSwitcher
│     └─ EN/VI toggle
```

**Responsibility Matrix**:

| Component | Responsibility | Data Input | Data Output |
|-----------|---|---|---|
| SearchComponent | Handle city search, display current weather | City name (string) | Selected city object |
| FavoritesComponent | Display all saved cities, enable comparison | Favorites array | Selected city for detail |
| AlertsComponent | Display active alerts with visual prominence | Current weather object | Alert details viewed |
| HistoryComponent | Visualize 7-day trends, toggle data types | Historical data array | Selected date range |
| ForecastComponent | Show 5-day predictions with trends | Forecast array | Selected day details |
| OfflineIndicator | Show sync status and cache age | Connection state | User awareness |
| LanguageSwitcher | Change UI language between EN/VI | Language selection | Updated all UI text |

#### 1.2 Service Worker Component
- **File**: `service-worker.js`
- **Responsibility**:
  - Cache weather data (static assets, API responses)
  - Enable offline mode when no connectivity
  - Sync data when connection restored
  - Manage cache versioning and cleanup
  - Provide offline UI state

#### 1.3 State Manager Component
- **File**: `weather-data-manager.js`
- **Responsibility**:
  - Orchestrate data flow between components
  - Decide cache vs API (intelligent caching)
  - Manage refresh cycles (30-minute intervals)
  - Handle offline transitions
  - Coordinate localStorage persistence

#### 1.4 API Client Component
- **File**: `api-service.js`
- **Responsibility**:
  - Format API requests to backend
  - Handle response transformations
  - Implement retry logic
  - Provide error messages
  - Manage API rate limiting client-side

#### 1.5 Internationalization Component
- **File**: `i18n.js` + translation files
- **Responsibility**:
  - Load JSON translation files (en.json, vi.json)
  - Replace text placeholders
  - Format dates/times per locale
  - Manage language switching
  - Persist language preference

---

### 2. Backend API Layer Components

#### 2.1 Express Server
- **File**: `server.js`
- **Responsibility**:
  - Initialize Express app
  - Load middleware (CORS, logging, error handling)
  - Register all routes
  - Start listening on port

#### 2.2 Route Handlers
```
Routes:
├─ GET /api/weather/:city
│  └─ Fetch current weather for city
│
├─ GET /api/forecast/:city
│  └─ Fetch 5-day forecast for city
│
├─ GET /api/history/:city?start=DATE&end=DATE
│  └─ Fetch 7-day historical data
│
├─ GET /api/alerts/:city
│  └─ Check and return active alerts
│
└─ GET /api/validate-city/:name
   └─ Validate city name, return closest match
```

#### 2.3 Service Layer
```
Services:
├─ WeatherService
│  ├─ fetchCurrentWeather(city) → Weather object
│  ├─ fetchForecast(city) → Forecast array
│  ├─ cacheWeatherData(city, data)
│  ├─ getCachedWeather(city) → Weather or null
│  └─ isCacheExpired(city) → boolean
│
├─ AlertService
│  ├─ evaluateAlerts(weather) → Alert array
│  ├─ checkColdAlert(temp) → boolean
│  ├─ checkHeatAlert(temp) → boolean
│  ├─ checkWindAlert(wind) → boolean
│  └─ checkHumidityAlert(humidity) → boolean
│
├─ ForecastService
│  ├─ transformForecastData(rawData) → Forecast[]
│  ├─ calculateTrend(forecast[]) → "rising"|"falling"|"stable"
│  └─ formatForecastDate(date, lang) → string
│
└─ CacheService
   ├─ queryWeatherHistory(city, days) → Weather[]
   ├─ storeWeatherReading(weather)
   ├─ cleanupOldData(retentionDays)
   └─ getStatistics(city, metric) → Stats
```

#### 2.4 External API Integration
- **Service**: OpenWeatherMap (or equivalent)
- **Key Methods**:
  - `getCurrentWeather(city, apiKey)`
  - `getForecast(city, apiKey)`
  - City validation and geolocation

---

### 3. Data Layer Components

#### 3.1 Database Schema
```sql
Table: weather_readings
├─ id (INT, PRIMARY KEY)
├─ city (VARCHAR, INDEXED)
├─ timestamp (TIMESTAMP, INDEXED)
├─ temperature (FLOAT)
├─ humidity (INT)
├─ wind_speed (FLOAT)
├─ condition (VARCHAR)
├─ description (TEXT)
└─ icon (VARCHAR)

Table: forecasts
├─ id (INT, PRIMARY KEY)
├─ city (VARCHAR, INDEXED)
├─ forecast_date (DATE, INDEXED)
├─ high_temperature (FLOAT)
├─ low_temperature (FLOAT)
├─ condition (VARCHAR)
├─ icon (VARCHAR)
├─ chance_rain (INT)
└─ confidence (INT)

Table: user_preferences
├─ id (INT, PRIMARY KEY)
├─ city (VARCHAR, INDEXED)
├─ preferred_language (VARCHAR)
├─ alerts_enabled (BOOLEAN)
├─ dark_mode (BOOLEAN)
├─ temperature_unit (VARCHAR)
├─ last_updated (TIMESTAMP)
└─ cache_valid_until (TIMESTAMP)
```

#### 3.2 Database Access Layer
- **Methods**:
  - `getWeatherHistory(city, days)`
  - `storeWeatherReading(weather)`
  - `getForecast(city, date)`
  - `updateUserPreferences(prefs)`
  - `cleanup(retentionDays)`

---

## Component Dependencies & Data Flow

### Data Flow 1: Search for New City (User Journey 1)

```
User Input (City Name)
    ↓
[UI Component] SearchComponent
    ↓
[Manager] Weather Data Manager
├─ Check if city in favorites
├─ Check if cached data valid
│  └─ YES → Use cache
│  └─ NO → Request from API
│
[API Client] API Service
    ↓
[Backend Route] GET /api/weather/:city
    ↓
[Backend Service] WeatherService
├─ Query cache first (CacheService)
├─ If miss, call external API
├─ Store in database
└─ Return formatted data
    ↓
[Database] Query weather_readings
    ↓
[Backend Response] Weather JSON
    ↓
[Frontend UI] Display current conditions
├─ Temperature
├─ Humidity
├─ Wind speed
├─ Alert badges
└─ Save favorite option
```

### Data Flow 2: Display 7-Day Trend (User Journey 3)

```
User Action (View History Chart)
    ↓
[UI Component] HistoryComponent
    ↓
[Manager] Weather Data Manager
├─ Check localStorage cache
├─ If miss, request historical data
│
[API Client] API Service
    ↓
[Backend Route] GET /api/history/:city?start=DATE&end=DATE
    ↓
[Backend Service] ForecastService
├─ Query database (weather_readings table)
├─ Transform data for chart format
├─ Calculate trend (rising/falling/stable)
└─ Return array of {date, temp, humidity, wind}
    ↓
[Database] Query 7 days of readings
    ↓
[Frontend] Chart.js Visualization
├─ Render line graph
├─ Enable data switching (temp → humidity → wind)
└─ Show interactive tooltips
```

### Data Flow 3: Auto-Update Mechanism (30-minute refresh)

```
Every 30 minutes:
    ↓
[Manager] Weather Data Manager
├─ Check if online
├─ For each favorite city:
│  ├─ Request fresh data from API
│  ├─ Store in database
│  ├─ Update localStorage
│  └─ Notify UI to re-render
│
[Backend] WeatherService
├─ Fetch from external API
├─ Calculate new alerts
├─ Store reading in database
└─ Return updated data
    ↓
[Frontend] Update UI silently
├─ Update current weather display
├─ Trigger alert notifications
└─ Update timestamps
```

### Data Flow 4: Offline Mode Transition

```
Connection Lost:
    ↓
[Service Worker] Detects offline
    ↓
[Manager] Weather Data Manager
├─ Switch to offline mode
├─ Use cached data from localStorage
├─ Stop API requests
├─ Show "Offline Mode" indicator
│
User opens app while offline:
    ↓
[Service Worker] Intercepts API requests
├─ Serve from cache instead
├─ Show cache timestamp ("Last updated: 2 hours ago")
│
Connection Restored:
    ↓
[Service Worker] Queues pending updates
├─ Fetch all changed data
├─ Merge with local cache
├─ Update database
└─ Refresh UI
```

---

## Component Interaction Matrix

| Component A | Component B | Interaction | Frequency | Data Volume |
|---|---|---|---|---|
| SearchComponent | Weather Data Manager | Request current weather | On user search | Small (1 city) |
| FavoritesComponent | Weather Data Manager | Display 2-6 cities | On app load | Medium (multi-city) |
| AlertService | FavoritesComponent | Highlight active alerts | Real-time | Small (alert meta) |
| HistoryComponent | Database | Query 7-day data | On user view | Medium (large arrays) |
| ForecastComponent | API Service | Get 5-day predictions | Daily/on-demand | Medium (forecast data) |
| LanguageSwitcher | All Components | Update text labels | On language change | Large (full UI update) |
| Service Worker | API Service | Intercept requests | Always | Depends on request |
| Weather Data Manager | localStorage | Persist favorites | On add/remove | Small (meta) |
| Weather Data Manager | Service Worker | Trigger sync | Every 30 min | Large (weather data) |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              GitHub Repository                  │
│  (Source control, CI/CD trigger)               │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ (Push triggers)
┌─────────────────────────────────────────────────┐
│            Vercel Deployment                    │
│  ┌───────────────────────────────────────────┐  │
│  │  Frontend (Static + Service Worker)       │  │
│  │  - HTML/CSS/JavaScript bundled           │  │
│  │  - service-worker.js registered          │  │
│  │  - Auto-HTTPS enabled                    │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Backend API (Serverless Functions)      │  │
│  │  - Express.js bundled as functions       │  │
│  │  - Environment variables configured     │  │
│  │  - API routes deployed                  │  │
│  └───────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ↓                     ↓
┌──────────────┐    ┌──────────────────┐
│ OpenWeatherMap   │    │  Neon PostgreSQL│
│ (Weather Data)   │    │  (Database)      │
└──────────────┘    └──────────────────┘
```

---

## API Contract Specification

### Current Weather Endpoint
```
GET /api/weather/:city

Request:
  - city (string): City name or coordinates
  - lang (optional): "en" or "vi" (default: "en")

Response (200 OK):
{
  "city": "Ho Chi Minh City",
  "country": "VN",
  "coordinates": { "lat": 10.8164, "lng": 106.6626 },
  "current": {
    "timestamp": "2026-09-24T14:30:00Z",
    "temperature": 28.5,
    "humidity": 75,
    "wind_speed": 8.5,
    "condition": "Partly Cloudy",
    "icon": "02d",
    "description": "Partly cloudy skies"
  },
  "alerts": [
    {
      "type": "humidity",
      "severity": "low",
      "message": "Humidity is high (75%)",
      "recommendation": "Stay hydrated"
    }
  ],
  "cache_info": {
    "source": "live" | "cache",
    "age_seconds": 0
  }
}

Error (404 Not Found):
{
  "error": "City not found",
  "suggestions": ["Ho Chi Minh City", "Da Nang"]
}
```

### Forecast Endpoint
```
GET /api/forecast/:city

Response (200 OK):
{
  "city": "Ho Chi Minh City",
  "forecast": [
    {
      "date": "2026-09-25",
      "high_temperature": 30.2,
      "low_temperature": 24.8,
      "condition": "Sunny",
      "icon": "01d",
      "chance_rain": 10,
      "wind_speed": 9.2,
      "humidity": 70,
      "trend": "stable"
    },
    ... (4 more days)
  ]
}
```

### History Endpoint
```
GET /api/history/:city?start=YYYY-MM-DD&end=YYYY-MM-DD

Response (200 OK):
{
  "city": "Ho Chi Minh City",
  "period": {
    "start": "2026-09-18",
    "end": "2026-09-24"
  },
  "data": [
    {
      "date": "2026-09-18",
      "temperature": 27.5,
      "humidity": 72,
      "wind_speed": 7.8,
      "condition": "Partly Cloudy"
    },
    ... (6 more days)
  ]
}
```

---

## Offline-First Strategy

### Service Worker Caching Strategy
```
Cache Hierarchy:
1. Network First (API calls)
   - Try network
   - Fall back to cache if fails
   - Appropriate for live data

2. Cache First (Static assets)
   - Use cached CSS/JS
   - Network update in background
   - Appropriate for UI resources

3. Stale While Revalidate (Weather data)
   - Serve cached data immediately
   - Update from network in background
   - Show timestamp to user

Caching Rules:
├─ Static Assets (index.html, CSS, JS)
│  ├─ Cache Name: "weather-app-v1"
│  ├─ Strategy: Cache First
│  └─ Max Size: 10MB
│
├─ API Responses (Weather data)
│  ├─ Cache Name: "weather-cache-v1"
│  ├─ Strategy: Stale While Revalidate
│  ├─ TTL: 30 minutes
│  └─ Max entries: 100 cities
│
└─ Images/Icons
   ├─ Cache Name: "weather-icons-v1"
   ├─ Strategy: Cache First
   └─ Max Size: 5MB
```

### Data Synchronization
```
When Offline:
├─ Use localStorage for current session data
├─ Use IndexedDB for larger datasets (7-day history)
├─ Show UI indicator: "Offline Mode - Using Cached Data"
└─ Disable refresh, alert enable/disable

When Coming Online:
├─ Service Worker detects connectivity
├─ Queue all pending updates
├─ Sync weather data for all favorites
├─ Merge with local cache (latest timestamp wins)
├─ Update UI with fresh data
└─ Clear offline indicator
```

---

## Summary

**Total Components**: 15+ logical components  
**Component Types**:
- UI Components: 7
- Service Components: 5
- Infrastructure Components: 3

**Key Design Principles**:
1. **Separation of Concerns**: UI, Logic, Data clearly separated
2. **Progressive Enhancement**: Works offline, enhances online
3. **Service-Oriented**: Each service has single responsibility
4. **Caching Strategy**: Multi-layer caching for performance
5. **Internationalization**: Language switching without data loss
6. **Real-time Updates**: Auto-refresh without blocking UI
7. **Error Resilience**: Graceful fallbacks for failures

**Status**: ✅ COMPONENT ARCHITECTURE COMPLETE

