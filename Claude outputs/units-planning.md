# Units Planning Document

**Project**: Weather Application  
**Date**: 2026-09-24  
**Phase**: INCEPTION - Units Planning  
**Purpose**: Decompose application design into implementation units and detailed specifications

---

## Overview

This document breaks down the Weather Application into concrete implementation units, each with:
- **Responsibility**: What it does
- **Dependencies**: What it requires
- **Acceptance Criteria**: How to verify completion
- **Estimated Effort**: Development time
- **Implementation Order**: Sequencing for parallel work

**Total Implementation Units**: 24 units organized in 3 categories
- **Backend Units**: 8 units
- **Frontend Units**: 10 units  
- **Infrastructure Units**: 6 units

---

## Part 1: Database Units

### Database Unit 1: Schema Design & Migrations

**Unit ID**: DB-001  
**Responsibility**: Design PostgreSQL schema with tables, indexes, constraints

**Deliverables**:
```sql
-- Table 1: weather_readings (Core historical data)
CREATE TABLE weather_readings (
  id SERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  temperature FLOAT NOT NULL,
  humidity INT NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
  wind_speed FLOAT NOT NULL,
  condition VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weather_city_timestamp ON weather_readings(city, timestamp DESC);
CREATE INDEX idx_weather_city ON weather_readings(city);
CREATE INDEX idx_weather_timestamp ON weather_readings(timestamp);

-- Table 2: forecasts (5-day predictions)
CREATE TABLE forecasts (
  id SERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  forecast_date DATE NOT NULL,
  high_temperature FLOAT,
  low_temperature FLOAT,
  avg_temperature FLOAT,
  condition VARCHAR(100),
  description TEXT,
  icon VARCHAR(10),
  humidity INT,
  wind_speed FLOAT,
  chance_rain INT,
  uv_index FLOAT,
  trend VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forecasts_city_date ON forecasts(city, forecast_date);
CREATE INDEX idx_forecasts_city ON forecasts(city);

-- Table 3: user_preferences (Per-user settings)
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  preferred_language VARCHAR(5) DEFAULT 'en',
  temperature_unit VARCHAR(1) DEFAULT 'C',
  alerts_enabled BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  favorite_cities TEXT[], -- JSON array: ["Ho Chi Minh", "Da Nang"]
  alert_thresholds JSONB DEFAULT '{"cold": 0, "heat": 35, "wind": 30, "humidity": 80}',
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_preferences_session ON user_preferences(session_id);
```

**Acceptance Criteria**:
- ✅ All 3 tables created in PostgreSQL
- ✅ All indexes created for performance
- ✅ Constraints enforced (humidity 0-100, etc.)
- ✅ Foreign key relationships established (if needed)
- ✅ Migration script tested

**Effort**: 4 hours  
**Dependencies**: Neon database access configured

---

### Database Unit 2: Data Validation Layer

**Unit ID**: DB-002  
**Responsibility**: Input validation, data sanitization, error handling

**Deliverables**:
- City name validation (alphanumeric + spaces)
- Temperature range validation (-50 to +60°C)
- Humidity validation (0-100%)
- Wind speed validation (0-200 km/h)
- Date format validation (ISO 8601)
- SQL injection prevention

**Code Location**: `backend/middleware/validators.js`

**Acceptance Criteria**:
- ✅ All input fields validated
- ✅ Error messages returned for invalid data
- ✅ No SQL injection possible
- ✅ Database constraints enforced
- ✅ Unit tests for edge cases

**Effort**: 6 hours  
**Dependencies**: DB-001 (schema)

---

## Part 2: Backend API Units

### Backend Unit 3: Express Server Setup

**Unit ID**: BE-001  
**Responsibility**: Initialize Express.js app with middleware, routing, error handling

**Deliverables**:
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/weather', require('./routes/weather'));
app.use('/api/forecast', require('./routes/forecast'));
app.use('/api/history', require('./routes/history'));
app.use('/api/alerts', require('./routes/alerts'));

// Error handling
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Configuration**:
- CORS enabled for frontend domain
- Helmet.js for security headers
- Request logging middleware
- Global error handler
- Environment variables for secrets

**Acceptance Criteria**:
- ✅ Server starts without errors
- ✅ All routes registered
- ✅ Middleware chain working
- ✅ CORS headers correct
- ✅ Error handler catches all exceptions

**Effort**: 3 hours  
**Dependencies**: None (foundational)

---

### Backend Unit 4: Weather Service Implementation

**Unit ID**: BE-002  
**Responsibility**: Implement WeatherService class with caching logic

**Methods to Implement**:
```javascript
class WeatherService {
  async getCurrentWeather(city, options = {}) {
    // 1. Normalize city name
    // 2. Check memory cache
    // 3. Check database (if fresh < 30 min)
    // 4. Call external API if needed
    // 5. Evaluate alerts
    // 6. Store in database
    // 7. Return formatted response
  }
  
  async getWeatherBatch(cities) {
    // Parallel requests for multiple cities
  }
  
  async getForecast(city) {
    // Fetch and transform 5-day forecast
  }
  
  async getWeatherHistory(city, days = 7) {
    // Query historical data from database
  }
  
  async validateCityName(cityName) {
    // Fuzzy matching and suggestions
  }
  
  async storeWeatherReading(weatherData) {
    // Insert into database
  }
  
  async isCacheValid(city, maxAgeMinutes = 30) {
    // Check cache freshness
  }
  
  async getCachedWeather(city) {
    // For offline mode
  }
}
```

**External API Integration**:
- Provider: OpenWeatherMap (or equivalent)
- Endpoint: `/data/2.5/weather?q={city}&appid={key}`
- Fallback: Use cached data on failure
- Rate limiting: Implement to avoid quota exhaustion

**Acceptance Criteria**:
- ✅ All 8 methods implemented
- ✅ Caching logic working correctly
- ✅ API calls succeed and fail gracefully
- ✅ Database persistence working
- ✅ Unit tests covering all paths

**Effort**: 10 hours  
**Dependencies**: BE-001 (server), DB-001 (schema), DB-002 (validation)

---

### Backend Unit 5: Alert Service Implementation

**Unit ID**: BE-003  
**Responsibility**: Implement AlertService with threshold evaluation

**Methods**:
```javascript
class AlertService {
  async evaluateAlerts(weather, language = 'en') {
    // Check all 4 alert types
    // Return array of active alerts
  }
  
  checkColdAlert(temperature) {
    // return temperature < 0
  }
  
  checkHeatAlert(temperature) {
    // return temperature > 35
  }
  
  checkWindAlert(windSpeed) {
    // return windSpeed > 30
  }
  
  checkHumidityAlert(humidity) {
    // return humidity > 80
  }
  
  createAlert(alertType, weather, language) {
    // Format alert object with icon, message, recommendation
  }
  
  getAlertValue(alertType, weather) {
    // Extract relevant metric for alert
  }
}
```

**Alert Thresholds**:
- Cold: < 0°C (❄️ blue)
- Heat: > 35°C (🔥 red)
- Wind: > 30 km/h (💨 orange)
- Humidity: > 80% (💧 cyan)

**Multilingual Support**:
- English: "Temperature is freezing"
- Vietnamese: "Nhiệt độ lạnh đỏ"

**Acceptance Criteria**:
- ✅ All 4 alert types evaluate correctly
- ✅ Bilingual messages (EN/VI)
- ✅ Icons and colors assigned
- ✅ Recommendations provided
- ✅ Unit tests for edge cases

**Effort**: 6 hours  
**Dependencies**: BE-001 (server)

---

### Backend Unit 6: Forecast Service Implementation

**Unit ID**: BE-004  
**Responsibility**: Transform forecast data and calculate trends

**Methods**:
```javascript
class ForecastService {
  transformForecastData(rawForecast, language = 'en') {
    // Parse 40 data points (5 days × 8 per day)
    // Return 5 formatted day objects
  }
  
  formatForecastDay(dayData, language) {
    // Format single day: date, temps, condition, icon, etc.
  }
  
  calculateTrend(forecast) {
    // Compare temps: day1 vs day3 vs day5
    // Return "rising", "falling", or "stable"
  }
  
  formatDate(date, language = 'en') {
    // Using Intl.DateTimeFormat for localization
  }
  
  getDayDetails(forecast, dayIndex) {
    // Get detailed view for specific day
  }
  
  getActivityRecommendation(dayData) {
    // Generate activity suggestion based on weather
  }
}
```

**Data Transformation**:
- Input: Raw API JSON (40 entries)
- Output: 5 formatted forecast days
- Include: High/low temps, condition, icon, trend

**Acceptance Criteria**:
- ✅ Raw API data parsed correctly
- ✅ 5 days extracted from 40 data points
- ✅ Dates formatted per language
- ✅ Trends calculated accurately
- ✅ Unit tests for calculations

**Effort**: 8 hours  
**Dependencies**: BE-001 (server)

---

### Backend Unit 7: Cache Service Implementation

**Unit ID**: BE-005  
**Responsibility**: Database operations, cleanup, statistics

**Methods**:
```javascript
class CacheService {
  async queryWeatherHistory(city, days = 7) {
    // SELECT from weather_readings for last N days
  }
  
  async storeWeatherReading(weather) {
    // INSERT new reading with timestamp
  }
  
  async cleanupOldData(retentionDays = 90) {
    // DELETE readings older than retention period
  }
  
  async getStatistics(city, metric, days = 7) {
    // Calculate min/max/avg/stddev for metric
  }
  
  async getCacheAge(city) {
    // How old is most recent reading?
  }
  
  async markSynced(city) {
    // Mark readings as synced (for offline)
  }
}
```

**Performance Optimization**:
- Connection pooling for database
- Query optimization with indexes
- Batch operations where possible
- Cleanup scheduled (e.g., nightly)

**Acceptance Criteria**:
- ✅ All database operations working
- ✅ Indexes optimizing queries (< 100ms)
- ✅ Cleanup running automatically
- ✅ Statistics calculations accurate
- ✅ Connection pool managing correctly

**Effort**: 8 hours  
**Dependencies**: DB-001 (schema), DB-002 (validation)

---

### Backend Unit 8: API Routes Implementation

**Unit ID**: BE-006  
**Responsibility**: Implement all 5 REST API endpoints

**Endpoints**:
```javascript
// GET /api/weather/:city
// - Current weather with alerts
// - Cache-aware response

// GET /api/forecast/:city
// - 5-day forecast with trends
// - Bilingual support

// GET /api/history/:city?start=DATE&end=DATE
// - 7-day (or custom) historical data
// - For trend visualization

// GET /api/alerts/:city
// - Validate city and return alert list
// - Pre-calculated alert data

// GET /api/validate-city/:name
// - Fuzzy match city names
// - Return suggestions
```

**Response Format**:
- Success: HTTP 200 with JSON data
- Not Found: HTTP 404 with suggestions
- Error: HTTP 500 with error message
- Cache: Include cache metadata

**Acceptance Criteria**:
- ✅ All 5 endpoints responding
- ✅ Correct HTTP status codes
- ✅ JSON response format correct
- ✅ Error handling comprehensive
- ✅ Integration tests passing

**Effort**: 6 hours  
**Dependencies**: BE-001 through BE-005

---

### Backend Unit 9: Authentication & Security

**Unit ID**: BE-007  
**Responsibility**: API key management, rate limiting, input validation

**Implementation**:
- API key in environment variables
- CORS configuration for frontend domain
- Rate limiting middleware (basic)
- HTTPS enforcement on Vercel
- Input validation on all endpoints

**Security Headers**:
- Helmet.js for standard headers
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

**Acceptance Criteria**:
- ✅ API key not exposed in code
- ✅ Rate limiting working
- ✅ Input validation on all endpoints
- ✅ HTTPS enforced
- ✅ Security audit passing

**Effort**: 4 hours  
**Dependencies**: BE-001 (server)

---

### Backend Unit 10: Error Handling & Logging

**Unit ID**: BE-008  
**Responsibility**: Comprehensive error handling and request logging

**Error Types Handled**:
- API timeout (fallback to cache)
- Invalid city (return suggestions)
- Database connection failure
- Malformed response
- Rate limit exceeded

**Logging**:
- Request/response logging
- Error stack traces
- Performance metrics
- Cache hit/miss rates

**Acceptance Criteria**:
- ✅ All error paths handled
- ✅ Logs capturing essential info
- ✅ No sensitive data in logs
- ✅ Error messages user-friendly
- ✅ Performance metrics tracked

**Effort**: 5 hours  
**Dependencies**: BE-001 (server)

---

## Part 3: Frontend Units

### Frontend Unit 11: HTML Structure & Layout

**Unit ID**: FE-001  
**Responsibility**: Create semantic HTML and responsive layout

**Page Structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather App</title>
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header id="header">
      <nav class="navbar">
        <div class="search-container">
          <!-- Search component -->
        </div>
        <div class="controls">
          <!-- Language switcher, offline indicator -->
        </div>
      </nav>
    </header>

    <!-- Main content -->
    <main id="content">
      <!-- Current weather display -->
      <!-- Favorites dashboard -->
      <!-- Alerts display -->
      <!-- 7-day chart -->
      <!-- 5-day forecast -->
    </main>

    <!-- Footer -->
    <footer id="footer">
      <!-- Attribution, links -->
    </footer>
  </div>

  <!-- Service Worker registration -->
  <script src="app.js"></script>
</body>
</html>
```

**Responsive Design**:
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Bootstrap 5 grid system
- Touch-friendly buttons (48px minimum)

**Accessibility**:
- Semantic HTML (header, main, footer)
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast ratios > 4.5:1

**Acceptance Criteria**:
- ✅ Valid HTML5
- ✅ Responsive on all breakpoints
- ✅ WCAG 2.1 AA accessibility
- ✅ SEO metadata present
- ✅ Loads without JavaScript (graceful degradation)

**Effort**: 6 hours  
**Dependencies**: None (foundational)

---

### Frontend Unit 12: CSS Styling & Bootstrap Integration

**Unit ID**: FE-002  
**Responsibility**: Apply Bootstrap 5 styling and custom CSS

**Components Styled**:
- Navigation bar
- Search input with suggestions
- Weather cards
- Alert badges with colors
- Chart containers
- Forecast cards
- Dark mode support

**Color Scheme**:
- Primary: Bootstrap blue
- Alerts: Red (heat), Blue (cold), Orange (wind), Cyan (humidity)
- Background: Light/dark theme
- Text: High contrast

**CSS Features**:
- Custom properties for theming
- Responsive grid layout
- Smooth transitions
- Animation for alerts
- Print-friendly styles

**Acceptance Criteria**:
- ✅ Bootstrap classes used correctly
- ✅ Custom CSS for Weather-specific styling
- ✅ Dark mode toggleable
- ✅ All components styled
- ✅ Mobile-responsive verified

**Effort**: 8 hours  
**Dependencies**: FE-001 (HTML structure)

---

### Frontend Unit 13: Search Component

**Unit ID**: FE-003  
**Responsibility**: City search with auto-suggestions

**Features**:
```javascript
class SearchComponent {
  constructor() {
    this.searchInput = document.getElementById('search-input');
    this.suggestionsList = document.getElementById('suggestions');
  }
  
  async onInputChange(cityName) {
    // Debounce input (300ms)
    // Call API validate-city endpoint
    // Show top 5 suggestions
    // Highlight matching characters
  }
  
  async onSuggestionClick(city) {
    // Call getCurrentWeather API
    // Update weather display
    // Optionally add to favorites
  }
  
  showLoading() {
    // Show spinner during API call
  }
  
  showError(message) {
    // Display error message
  }
}
```

**User Experience**:
- Auto-suggest after 2 characters typed
- Fuzzy matching for typos
- Show top 5 matches
- Keyboard navigation (arrow keys)
- Enter key to select

**Acceptance Criteria**:
- ✅ Auto-suggest working
- ✅ API integration functional
- ✅ Error messages displayed
- ✅ Debouncing preventing excessive calls
- ✅ Mobile touch-friendly

**Effort**: 7 hours  
**Dependencies**: FE-001 (HTML), FE-002 (CSS)

---

### Frontend Unit 14: Current Weather Display

**Unit ID**: FE-004  
**Responsibility**: Show current conditions prominently

**Display Elements**:
- Large temperature (28°C)
- Weather icon/emoji (☀️)
- Condition description ("Partly Cloudy")
- Humidity (75%)
- Wind speed (12 km/h)
- Last updated timestamp
- Save to favorites button

**API Integration**:
```javascript
async function displayCurrentWeather(city) {
  const response = await fetch(`/api/weather/${city}`);
  const data = await response.json();
  
  updateTemperature(data.current.temperature);
  updateIcon(data.current.icon);
  updateAlerts(data.alerts);
  updateTimestamp(data.cache_info.age_seconds);
  
  if (data.cache_info.source === 'cache') {
    showCacheNotification();
  }
}
```

**Features**:
- Real-time updates on refresh
- Show "using cache" if offline
- Alert badges highlighted
- Favorite heart toggleable
- Smooth transitions between updates

**Acceptance Criteria**:
- ✅ All data displayed correctly
- ✅ Icons rendering (emoji or SVG)
- ✅ Favorite button working
- ✅ Cache age shown
- ✅ Offline mode indicated

**Effort**: 6 hours  
**Dependencies**: FE-001 (HTML), FE-002 (CSS), API (BE)

---

### Frontend Unit 15: Favorites Dashboard

**Unit ID**: FE-005  
**Responsibility**: Multi-city comparison view

**Features**:
```javascript
class FavoritesComponent {
  constructor() {
    this.favorites = this.loadFromLocalStorage();
  }
  
  async loadFavorites() {
    // Fetch weather for all favorite cities
    // Display as grid of cards
  }
  
  async addFavorite(city) {
    // Add to localStorage
    // Fetch and display weather
  }
  
  async removeFavorite(city) {
    // Remove from localStorage
    // Update display
  }
  
  compareWeather() {
    // Show comparison view
    // Highlight best/worst conditions
  }
}
```

**Display**:
- Grid of 2-6 city cards
- Quick-scan format (current + alerts)
- Click to see detailed view
- Remove (X) button on each card
- "Add new city" button

**Data Persistence**:
- Stored in localStorage
- Persists across sessions
- Max 10 favorite cities

**Acceptance Criteria**:
- ✅ Add/remove working
- ✅ localStorage persisting
- ✅ All cards loading
- ✅ Responsive grid
- ✅ Click to detail view

**Effort**: 8 hours  
**Dependencies**: FE-001 (HTML), FE-002 (CSS), API (BE)

---

### Frontend Unit 16: Alerts Component

**Unit ID**: FE-006  
**Responsibility**: Display and manage weather alerts

**Alert Display**:
```javascript
class AlertsComponent {
  displayAlerts(alerts) {
    // Group by severity (danger, warning, info)
    // Show icon + message + recommendation
    // Color-coded background
  }
  
  onAlertHover(alert) {
    // Show tooltip with full details
    // Explain threshold and current value
  }
  
  dismissAlert(alertId) {
    // Remove from display
    // Don't show again until condition changes
  }
}
```

**Visual Design**:
- Alert badges on weather card
- Detailed modal on click
- Icons: ❄️ 🔥 💨 💧
- Colors: Blue Red Orange Cyan
- Smooth animations

**Acceptance Criteria**:
- ✅ All 4 alert types displaying
- ✅ Icons and colors correct
- ✅ Tooltips showing details
- ✅ Bilingual messages
- ✅ Dismiss/re-enable working

**Effort**: 6 hours  
**Dependencies**: FE-001 (HTML), FE-002 (CSS)

---

### Frontend Unit 17: History Chart (7-Day Trends)

**Unit ID**: FE-007  
**Responsibility**: Chart.js visualization of historical data

**Features**:
```javascript
class HistoryChartComponent {
  async displayChart(city) {
    // Fetch 7-day history
    // Initialize Chart.js with line graph
    // X-axis: Dates (Sep 18-24)
    // Y-axis: Temperature (25-30°C)
    // Interactive tooltips on hover
  }
  
  switchDataType(metric) {
    // Switch between temperature, humidity, wind
    // Smooth transition
    // Update Y-axis label
  }
  
  showTrend(trend) {
    // Display trend annotation
    // "↑ Warming" "↓ Cooling" "→ Stable"
  }
}
```

**Chart Configuration**:
- Type: Line chart
- Data: 7 points (daily)
- Responsive: Adapt to container size
- Interactive: Hover for details
- Colors: Theme-aware

**Acceptance Criteria**:
- ✅ Chart rendering with data
- ✅ Data type switching working
- ✅ Tooltips showing values
- ✅ Responsive sizing
- ✅ Mobile touch support

**Effort**: 8 hours  
**Dependencies**: FE-001 (HTML), FE-002 (CSS), Chart.js library

---

### Frontend Unit 18: Forecast Display (5-Day)

**Unit ID**: FE-008  
**Responsibility**: 5-day forecast with trend indicators

**Card Layout**:
```
┌─────────────────────┐
│ Fri, Oct 24         │
│ 28°C / 22°C         │
│ ☀️ Sunny            │
│ ↑ Warming Trend     │
│ 10% Rain probability│
└─────────────────────┘
```

**Features**:
- 5 cards in row (horizontal scroll on mobile)
- High/low temps
- Condition icon
- Trend arrow (↑ ↓ →)
- Rain probability
- Hover for hourly details (if available)

**Acceptance Criteria**:
- ✅ All 5 days displaying
- ✅ Responsive layout
- ✅ Icons rendering
- ✅ Trend arrows showing
- ✅ Click for detail view

**Effort**: 6 hours  
**Dependencies**: FE-001 (HTML), FE-002 (CSS), API (BE)

---

### Frontend Unit 19: Offline Indicator & Sync

**Unit ID**: FE-009  
**Responsibility**: Show offline status and sync state

**Display**:
```
┌──────────────────────────────┐
│ 📡 Offline Mode              │
│ Using cached data from 2h ago│
│ [Retry] [Details]            │
└──────────────────────────────┘
```

**Features**:
- Detect online/offline status
- Show cache age when offline
- "Retry" button to attempt reconnection
- Auto-sync when reconnected
- Show "Syncing..." during update

**Implementation**:
```javascript
window.addEventListener('online', () => {
  // Trigger sync
});

window.addEventListener('offline', () => {
  // Show offline indicator
});
```

**Acceptance Criteria**:
- ✅ Online/offline detection working
- ✅ Cache age showing correctly
- ✅ Auto-sync on reconnect
- ✅ Sync status visible
- ✅ Retry button functional

**Effort**: 5 hours  
**Dependencies**: FE-001 (HTML), Service Worker (SW-001)

---

### Frontend Unit 20: Language Switcher

**Unit ID**: FE-010  
**Responsibility**: Toggle between English and Vietnamese

**Features**:
```javascript
class LanguageSwitcher {
  async switchLanguage(lang) {
    // Load translations (en.json or vi.json)
    // Replace all text on page
    // Update localStorage preference
    // Reload API calls with new language
  }
}
```

**Translations**:
- All UI text in both languages
- Date/time formatting per locale
- Alert messages localized
- Recommendations translated

**Storage**:
- Preference saved in localStorage
- Default: Browser language or EN
- Persist across sessions

**Acceptance Criteria**:
- ✅ Language switching working
- ✅ All text translated
- ✅ Dates formatted per locale
- ✅ Preference persisted
- ✅ API calls with correct language

**Effort**: 6 hours  
**Dependencies**: FE-001 (HTML), i18n system

---

## Part 4: Infrastructure Units

### Infrastructure Unit 21: Service Worker & Offline Support

**Unit ID**: SW-001  
**Responsibility**: Service Worker for caching and offline functionality

**Features**:
```javascript
// service-worker.js
const CACHE_NAME = 'weather-app-v1';
const RUNTIME_CACHE = 'weather-runtime-v1';

self.addEventListener('install', (event) => {
  // Cache static assets
});

self.addEventListener('fetch', (event) => {
  // Network first for API calls
  // Cache first for assets
  // Serve cached data when offline
});

self.addEventListener('activate', (event) => {
  // Clean up old cache versions
});
```

**Caching Strategy**:
- Static assets: Cache-first
- API responses: Stale-while-revalidate
- Max cache size: 10MB
- 30-minute TTL for dynamic data

**Acceptance Criteria**:
- ✅ Service Worker registering
- ✅ Offline mode working
- ✅ Cache updates
- ✅ Background sync functional
- ✅ No redundant caches

**Effort**: 8 hours  
**Dependencies**: FE-001 (HTML)

---

### Infrastructure Unit 22: Internationalization System

**Unit ID**: SW-002  
**Responsibility**: i18n for English and Vietnamese

**Translation Files**:
```json
// i18n/en.json
{
  "app_title": "Weather App",
  "search_placeholder": "Enter city name",
  "current_weather": "Current Weather",
  "temperature": "Temperature",
  "humidity": "Humidity",
  "alerts": {
    "cold": "Temperature is freezing",
    "heat": "Extreme heat warning",
    ...
  }
}

// i18n/vi.json
{
  "app_title": "Ứng dụng Thời tiết",
  "search_placeholder": "Nhập tên thành phố",
  ...
}
```

**Date/Time Formatting**:
```javascript
const dateFormatter = new Intl.DateTimeFormat(lang, {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});
```

**Acceptance Criteria**:
- ✅ All text translated (EN/VI)
- ✅ Dates formatted correctly
- ✅ Language switching smooth
- ✅ No untranslated strings
- ✅ RTL-ready (if needed)

**Effort**: 5 hours  
**Dependencies**: FE-001 (HTML), BE-001 (API)

---

### Infrastructure Unit 23: Vercel Deployment Configuration

**Unit ID**: INF-001  
**Responsibility**: Deploy frontend and backend to Vercel

**Files**:
```
vercel.json:
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**": {
      "memory": 512,
      "timeout": 30
    }
  },
  "env": {
    "WEATHER_API_KEY": "@weather_api_key",
    "DATABASE_URL": "@neon_db_url"
  }
}

.env.example:
WEATHER_API_KEY=your_key_here
DATABASE_URL=postgresql://...
NODE_ENV=production
```

**Features**:
- Auto-deploy on GitHub push
- Preview deployments for PRs
- Environment variables secured
- Serverless function optimization
- Edge caching enabled

**Acceptance Criteria**:
- ✅ Deploy successful
- ✅ Frontend accessible
- ✅ API endpoints working
- ✅ Environment variables loaded
- ✅ HTTPS enabled

**Effort**: 4 hours  
**Dependencies**: BE-006 (API), FE-001 (Frontend)

---

### Infrastructure Unit 24: GitHub Integration & CI/CD

**Unit ID**: INF-002  
**Responsibility**: Repository setup, workflows, deployment automation

**GitHub Actions Workflow**:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

**Repository Structure**:
```
/
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── service-worker.js
├── backend/
│   ├── server.js
│   ├── services/
│   ├── routes/
│   └── middleware/
├── tests/
├── package.json
├── vercel.json
└── .github/workflows/
```

**Acceptance Criteria**:
- ✅ Repository initialized
- ✅ CI/CD workflow running
- ✅ Tests executing on push
- ✅ Auto-deploy to Vercel
- ✅ Failed builds blocking merge

**Effort**: 3 hours  
**Dependencies**: None (foundational)

---

### Infrastructure Unit 25: Database Connection & Migrations

**Unit ID**: INF-003  
**Responsibility**: Neon PostgreSQL setup and migration management

**Connection Configuration**:
```javascript
// backend/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

**Migration Script**:
```bash
npm run migrate:up    # Apply migrations
npm run migrate:down  # Rollback
npm run migrate:status # Check status
```

**Acceptance Criteria**:
- ✅ Connection pooling working
- ✅ Migrations applying without error
- ✅ Database accessible from Vercel
- ✅ Connection timeout configured
- ✅ Backup strategy documented

**Effort**: 3 hours  
**Dependencies**: DB-001 (schema)

---

## Implementation Sequencing

### Phase 1: Foundational Setup (Days 1-2)
**Can run in parallel**:
- BE-001: Express server setup
- FE-001: HTML structure
- FE-002: CSS styling
- INF-002: GitHub CI/CD setup
- INF-001: Vercel configuration

**Duration**: 2 days  
**Blocker Resolution**: None (foundational)

### Phase 2: Backend Services (Days 3-4)
**Sequential dependency**:
1. DB-001: Database schema ← Required by all BE units
2. DB-002: Validation layer
3. Parallel:
   - BE-002: Weather service
   - BE-003: Alert service
   - BE-004: Forecast service
   - BE-005: Cache service
4. BE-006: API routes (depends on all services)

**Duration**: 2 days  
**Critical Path**: DB-001 → BE-002/003/004/005 → BE-006

### Phase 3: Frontend Components (Days 5-6)
**Parallel implementation**:
- FE-003: Search component
- FE-004: Current weather display
- FE-005: Favorites dashboard
- FE-006: Alerts display
- FE-007: History chart
- FE-008: Forecast display

**Integration**: All tie into FE-001/FE-002 framework

**Duration**: 2 days

### Phase 4: Advanced Features (Days 7-8)
**Implementation**:
- FE-009: Offline indicator & sync
- FE-010: Language switcher
- SW-001: Service Worker
- SW-002: i18n system
- INF-003: Database connection

**Duration**: 2 days

### Phase 5: Testing & Deployment (Days 9-10)
- Unit tests for all services
- Integration tests for APIs
- E2E tests for user journeys
- Performance testing
- Deploy to Vercel
- Verify all features working

**Duration**: 2 days

---

## Unit Dependencies Graph

```
Start
  ├─→ BE-001 (Server) → BE-002,3,4,5 → BE-006 (Routes)
  ├─→ DB-001 (Schema) → DB-002 (Validation) → BE-002,3,4,5
  ├─→ FE-001 (HTML) → FE-002 (CSS) → FE-003,4,5,6,7,8
  ├─→ INF-002 (CI/CD setup) ◄─ INF-001 (Vercel config)
  ├─→ FE-009 (Offline) ← SW-001 (Service Worker)
  └─→ FE-010 (Language) ← SW-002 (i18n)
        ↓
    BE-006 (API) ← All frontend components
        ↓
    INF-003 (Database)
        ↓
    All tests
        ↓
    Vercel Deployment
        ↓
    🎉 Done!
```

---

## Effort Summary

| Category | Units | Hours | Days |
|----------|-------|-------|------|
| Database | 2 | 10 | 1.25 |
| Backend | 8 | 47 | 5.9 |
| Frontend | 10 | 70 | 8.75 |
| Infrastructure | 6 | 23 | 2.9 |
| **TOTAL** | **26** | **150** | **19** |

**Estimated Project Duration**: 10 working days (2 weeks) assuming 8-hour days

---

## Quality Gates

Before moving to CONSTRUCTION phase, verify:
- ✅ All units designed and scoped
- ✅ Dependencies identified
- ✅ Effort estimated for each unit
- ✅ Implementation sequence defined
- ✅ Risk areas identified
- ✅ Performance targets achievable

---

**Status**: ✅ UNITS PLANNING COMPLETE

**Next Phase**: NFR Implementation & Code Planning

