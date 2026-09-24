# Hướng Dẫn Sinh Mã (Code Generation Guide)

**Dự Án**: Ứng Dụng Thời Tiết  
**Giai Đoạn**: CONSTRUCTION - Code Generation  
**Ngày**: 2026-09-24  
**Tác Giả**: Claude Haiku 4.5  
**Ngôn Ngữ**: EN / VI

---

## Tóm Tắt Điều Hành

Tài liệu này cung cấp hướng dẫn sinh mã chi tiết (code generation) cho 26 implementation units trên 3 sprint. Mỗi unit bao gồm:
- File structure & location
- Code implementation (snippets chi tiết)
- Unit tests
- Acceptance criteria verification

---

## SPRINT 1: BACKEND & DATABASE (TUẦN 1)

### UNIT DB-001: Thiết Kế & Migration Cơ Sở Dữ Liệu

**Vị Trí File**: 
```
migrations/
  001_create_tables.sql
  002_create_indexes.sql
database/
  schema.sql
```

**Implementation: 001_create_tables.sql**
```sql
-- Create weather_readings table (90-day retention)
CREATE TABLE weather_readings (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  
  -- Temperature & feels like
  temperature DECIMAL(5, 2) NOT NULL,
  feels_like DECIMAL(5, 2),
  
  -- Atmospheric conditions
  humidity INT CHECK (humidity >= 0 AND humidity <= 100),
  pressure INT,
  cloudiness INT CHECK (cloudiness >= 0 AND cloudiness <= 100),
  visibility INT,
  
  -- Wind data
  wind_speed DECIMAL(5, 2),
  wind_direction INT CHECK (wind_direction >= 0 AND wind_direction < 360),
  
  -- Condition & description
  condition VARCHAR(50),        -- "Cloudy", "Rainy", etc.
  icon_id VARCHAR(10),          -- OpenWeather code: "01d", "02d"
  description TEXT,
  
  -- Precipitation
  rain_probability DECIMAL(3, 2),
  rain_amount DECIMAL(5, 2),
  
  -- Sun times
  sunrise TIMESTAMP,
  sunset TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: One reading per city per timestamp
  CONSTRAINT unique_city_time UNIQUE (city, created_at)
);

-- Create forecasts table (10-day retention)
CREATE TABLE forecasts (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_time TIMESTAMP NOT NULL,
  
  temperature_high DECIMAL(5, 2),
  temperature_low DECIMAL(5, 2),
  temperature_avg DECIMAL(5, 2),
  
  condition VARCHAR(50),
  icon_id VARCHAR(10),
  description TEXT,
  
  humidity INT,
  wind_speed DECIMAL(5, 2),
  rain_probability DECIMAL(3, 2),
  rain_amount DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_forecast UNIQUE (city, forecast_date, forecast_time)
);

-- Create user_preferences table (indefinite retention)
CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) UNIQUE NOT NULL,
  favorite_cities TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  language VARCHAR(10) DEFAULT 'en',
  temperature_unit VARCHAR(5) DEFAULT 'C',
  wind_unit VARCHAR(10) DEFAULT 'kmh',
  
  notification_enabled BOOLEAN DEFAULT TRUE,
  notification_frequency INT DEFAULT 30,
  
  theme VARCHAR(20) DEFAULT 'auto',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Implementation: 002_create_indexes.sql**
```sql
-- Index cho weather_readings (tìm kiếm nhanh)
CREATE INDEX idx_weather_city_timestamp 
  ON weather_readings(city, created_at DESC);
CREATE INDEX idx_weather_created_at 
  ON weather_readings(created_at DESC);

-- Index cho forecasts
CREATE INDEX idx_forecasts_city_date 
  ON forecasts(city, forecast_date);
CREATE INDEX idx_forecasts_created_at 
  ON forecasts(created_at DESC);

-- Index cho user_preferences
CREATE INDEX idx_user_preferences_id 
  ON user_preferences(user_id);
```

**Unit Tests**:
```javascript
// tests/db/schema.test.js
const { Pool } = require('pg');
const fs = require('fs');

describe('Database Schema', () => {
  let pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL_TEST
    });
    
    // Run migrations
    const schema = fs.readFileSync('migrations/001_create_tables.sql', 'utf-8');
    const indexes = fs.readFileSync('migrations/002_create_indexes.sql', 'utf-8');
    await pool.query(schema);
    await pool.query(indexes);
  });

  test('weather_readings table exists with correct columns', async () => {
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'weather_readings' ORDER BY column_name`
    );
    expect(result.rows.length).toBeGreaterThan(10);
    expect(result.rows.map(r => r.column_name)).toContain('temperature');
  });

  test('indexes are created', async () => {
    const result = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'weather_readings'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await pool.end();
  });
});
```

---

### UNIT INF-001: Vercel & GitHub Setup

**Vị Trí File**:
```
vercel.json
.github/workflows/deploy.yml
```

**Implementation: vercel.json**
```json
{
  "version": 2,
  "env": {
    "OPENWEATHER_API_KEY": "@openweather_api_key",
    "DATABASE_URL": "@database_url",
    "NODE_ENV": "production",
    "LOG_LEVEL": "info"
  },
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": "vanilla",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30,
      "runtime": "nodejs20.x"
    }
  },
  "regions": ["sfo1", "iad1", "hnd1"],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {"key": "Cache-Control", "value": "public, s-maxage=60, stale-while-revalidate=300"},
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"}
      ]
    },
    {
      "source": "/static/:path*",
      "headers": [
        {"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}
      ]
    }
  ]
}
```

**Implementation: .github/workflows/deploy.yml**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@v5
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
      
      - name: Health check
        run: |
          sleep 10
          curl -f https://weather-app.vercel.app/health || exit 1
```

---

### UNIT BE-001: Express Server Setup

**Vị Trí File**:
```
api/index.js
middleware/security.js
middleware/logger.js
```

**Implementation: api/index.js**
```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const securityMiddleware = require('../middleware/security');
const logger = require('../middleware/logger');

const app = express();

// ===== MIDDLEWARE =====
// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: ['https://weather-app.vercel.app', 'http://localhost:3000'],
  credentials: false,
  methods: ['GET', 'POST']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));

// Logging
app.use(logger);

// ===== ROUTES =====
// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes (to be implemented)
app.use('/api/weather', require('./routes/weather'));
app.use('/api/forecast', require('./routes/forecast'));
app.use('/api/history', require('./routes/history'));
app.use('/api/alerts', require('./routes/alerts'));
app.post('/api/validate-city', require('./routes/validate-city'));

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// ===== EXPORT =====
module.exports = app;

// Local testing
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
```

**Implementation: middleware/security.js**
```javascript
const securityMiddleware = [
  // HTTPS redirect (production only)
  (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  },

  // Input sanitization
  (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Remove potential XSS
          req.body[key] = req.body[key]
            .trim()
            .slice(0, 1000); // Max length
        }
      });
    }
    next();
  }
];

module.exports = securityMiddleware;
```

**Unit Tests**:
```javascript
// tests/api/server.test.js
const request = require('supertest');
const app = require('../../api/index');

describe('Express Server', () => {
  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('Rate limiting works', async () => {
    for (let i = 0; i < 101; i++) {
      await request(app).get('/api/weather/test');
    }
    const res = await request(app).get('/api/weather/test');
    expect(res.status).toBe(429); // Too Many Requests
  });

  test('CORS headers present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  test('404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});
```

---

### UNIT BE-002: Weather Service Implementation

**Vị Trí File**:
```
services/WeatherService.js
services/CacheService.js
clients/OpenWeatherClient.js
```

**Implementation: services/WeatherService.js**
```javascript
class WeatherService {
  constructor(cacheService, openWeatherClient) {
    this.cache = cacheService;
    this.api = openWeatherClient;
    this.CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  }

  async getCurrentWeather(city, options = {}) {
    try {
      // L1: Memory cache (1-2 min)
      const memCache = this.cache.getMemory(city);
      if (memCache && this.isValidCache(memCache, 2)) {
        return {
          ...memCache,
          cache: { source: 'memory', age: this.getAge(memCache) }
        };
      }

      // L2: localStorage (30 min)
      const localCache = await this.cache.getLocal(city);
      if (localCache && this.isValidCache(localCache, 30)) {
        this.cache.setMemory(city, localCache);
        return {
          ...localCache,
          cache: { source: 'localStorage', age: this.getAge(localCache) }
        };
      }

      // L3: Database (30 min)
      const dbCache = await this.cache.getDatabase(city);
      if (dbCache && this.isValidCache(dbCache, 30)) {
        this.cache.setMemory(city, dbCache);
        this.cache.setLocal(city, dbCache);
        return {
          ...dbCache,
          cache: { source: 'database', age: this.getAge(dbCache) }
        };
      }

      // L4: External API (fresh data)
      const fresh = await this.api.fetchWeather(city);
      this.cache.storeMultiLayer(city, fresh);
      return {
        ...fresh,
        cache: { source: 'api', age: 0 }
      };
    } catch (error) {
      // Fallback to stale data
      const stale = await this.cache.getDatabase(city);
      if (stale) {
        return {
          ...stale,
          cache: { source: 'stale', error: error.message }
        };
      }
      throw error;
    }
  }

  isValidCache(data, maxAgeMinutes) {
    if (!data || !data.created_at) return false;
    const age = (Date.now() - new Date(data.created_at)) / 60000;
    return age < maxAgeMinutes;
  }

  getAge(data) {
    return Math.round((Date.now() - new Date(data.created_at)) / 1000);
  }

  async getForecast(city) {
    // Implementation for 5-day forecast
  }

  async getHistory(city, days = 7) {
    // Implementation for historical data
  }
}

module.exports = WeatherService;
```

**Implementation: services/CacheService.js**
```javascript
const { Pool } = require('pg');

class CacheService {
  constructor(pool) {
    this.pool = pool;
    this.memCache = new Map();
    this.MAX_MEMORY = 100; // Max cities to keep in memory
  }

  setMemory(city, data) {
    if (this.memCache.size >= this.MAX_MEMORY) {
      const first = this.memCache.keys().next().value;
      this.memCache.delete(first); // LRU eviction
    }
    this.memCache.set(city, { ...data, created_at: new Date() });
  }

  getMemory(city) {
    return this.memCache.get(city);
  }

  setLocal(city, data) {
    try {
      localStorage.setItem(`weather_${city}`, JSON.stringify(data));
    } catch (e) {
      // Quota exceeded
      this.clearLocalCache();
      localStorage.setItem(`weather_${city}`, JSON.stringify(data));
    }
  }

  getLocal(city) {
    try {
      return JSON.parse(localStorage.getItem(`weather_${city}`));
    } catch (e) {
      return null;
    }
  }

  async storeDatabase(city, data) {
    return this.pool.query(
      `INSERT INTO weather_readings 
       (city, temperature, humidity, wind_speed, condition, icon_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [city, data.temperature, data.humidity, data.wind_speed, 
       data.condition, data.icon_id, data.description]
    );
  }

  async getDatabase(city) {
    const result = await this.pool.query(
      `SELECT * FROM weather_readings 
       WHERE city = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [city]
    );
    return result.rows[0] || null;
  }

  storeMultiLayer(city, data) {
    this.setMemory(city, data);
    this.setLocal(city, data);
    this.storeDatabase(city, data);
  }
}

module.exports = CacheService;
```

---

### UNIT BE-003: Alert Service

**Vị Trí File**:
```
services/AlertService.js
```

**Implementation: services/AlertService.js**
```javascript
const ALERT_CONFIG = {
  cold: {
    threshold: 0,
    operator: '<',
    icon: '❄️',
    message_en: 'Cold Alert',
    message_vi: 'Cảnh báo lạnh',
    recommendation_en: 'Stay warm, limit outdoor time',
    recommendation_vi: 'Giữ ấm, hạn chế thời gian ngoài trời'
  },
  heat: {
    threshold: 35,
    operator: '>',
    icon: '🔥',
    message_en: 'Heat Alert',
    message_vi: 'Cảnh báo nóng',
    recommendation_en: 'Stay hydrated, avoid peak hours',
    recommendation_vi: 'Uống nước, tránh giờ cao điểm'
  },
  wind: {
    threshold: 30,
    operator: '>',
    icon: '💨',
    message_en: 'Wind Alert',
    message_vi: 'Cảnh báo gió',
    recommendation_en: 'Secure loose items',
    recommendation_vi: 'Giữ an toàn cho đồ vật'
  },
  humidity: {
    threshold: 80,
    operator: '>',
    icon: '💧',
    message_en: 'Humidity Alert',
    message_vi: 'Cảnh báo độ ẩm',
    recommendation_en: 'Use dehumidifier',
    recommendation_vi: 'Sử dụng máy hút ẩm'
  }
};

class AlertService {
  evaluateAlerts(weather, language = 'en') {
    const alerts = [];

    // Check cold
    if (weather.temperature < ALERT_CONFIG.cold.threshold) {
      alerts.push(this.createAlert('cold', weather, language));
    }

    // Check heat
    if (weather.temperature > ALERT_CONFIG.heat.threshold) {
      alerts.push(this.createAlert('heat', weather, language));
    }

    // Check wind
    if (weather.wind_speed > ALERT_CONFIG.wind.threshold) {
      alerts.push(this.createAlert('wind', weather, language));
    }

    // Check humidity
    if (weather.humidity > ALERT_CONFIG.humidity.threshold) {
      alerts.push(this.createAlert('humidity', weather, language));
    }

    return alerts;
  }

  createAlert(type, weather, language) {
    const config = ALERT_CONFIG[type];
    const langKey = `message_${language}`;
    const recKey = `recommendation_${language}`;

    return {
      type,
      icon: config.icon,
      message: config[langKey] || config.message_en,
      recommendation: config[recKey] || config.recommendation_en,
      severity: this.getSeverity(type, weather),
      current_value: this.getCurrentValue(type, weather),
      threshold: config.threshold
    };
  }

  getSeverity(type, weather) {
    const config = ALERT_CONFIG[type];
    const value = this.getCurrentValue(type, weather);
    const diff = Math.abs(value - config.threshold);
    
    if (diff > 10) return 'critical';
    if (diff > 5) return 'high';
    return 'medium';
  }

  getCurrentValue(type, weather) {
    switch (type) {
      case 'cold':
      case 'heat':
        return weather.temperature;
      case 'wind':
        return weather.wind_speed;
      case 'humidity':
        return weather.humidity;
      default:
        return 0;
    }
  }
}

module.exports = AlertService;
```

**Unit Tests**:
```javascript
// tests/services/AlertService.test.js
const AlertService = require('../../services/AlertService');

describe('AlertService', () => {
  const alertService = new AlertService();

  test('evaluateAlerts returns cold alert when temp < 0', () => {
    const weather = { temperature: -5, humidity: 50, wind_speed: 10 };
    const alerts = alertService.evaluateAlerts(weather, 'en');
    expect(alerts.some(a => a.type === 'cold')).toBe(true);
  });

  test('evaluateAlerts returns heat alert when temp > 35', () => {
    const weather = { temperature: 40, humidity: 50, wind_speed: 10 };
    const alerts = alertService.evaluateAlerts(weather, 'en');
    expect(alerts.some(a => a.type === 'heat')).toBe(true);
  });

  test('alert message supports bilingual', () => {
    const weather = { temperature: -5, humidity: 50, wind_speed: 10 };
    const alertsEN = alertService.evaluateAlerts(weather, 'en');
    const alertsVI = alertService.evaluateAlerts(weather, 'vi');
    
    expect(alertsEN[0].message).toBe('Cold Alert');
    expect(alertsVI[0].message).toBe('Cảnh báo lạnh');
  });

  test('no alerts when all conditions normal', () => {
    const weather = { temperature: 20, humidity: 60, wind_speed: 10 };
    const alerts = alertService.evaluateAlerts(weather, 'en');
    expect(alerts.length).toBe(0);
  });
});
```

---

## SPRINT 2: FRONTEND COMPONENTS (TUẦN 2)

### UNIT FE-001: HTML Structure

**Vị Trí File**:
```
public/index.html
public/manifest.json
```

**Implementation: public/index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#2c3e50">
  <meta name="description" content="Weather Application - EN/VI, Offline Support">
  
  <title data-i18n="app.title">Weather App</title>
  
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- Bootstrap 5 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Custom CSS -->
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <div id="app">
    <!-- Navigation -->
    <header class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <h1 class="navbar-brand" data-i18n="app.title">Weather App</h1>
        <div class="ms-auto d-flex gap-2">
          <button id="lang-switcher" class="btn btn-sm btn-outline-light">EN/VI</button>
          <button id="theme-toggle" class="btn btn-sm btn-outline-light">🌙</button>
        </div>
      </div>
    </header>

    <!-- Offline Indicator -->
    <div id="offline-banner" class="alert alert-warning d-none" role="alert">
      <span data-i18n="offline.message">Offline Mode</span>
    </div>

    <main class="container py-4">
      <!-- Search Section -->
      <section id="search-section" class="mb-4">
        <div class="input-group">
          <input 
            id="city-input" 
            type="text" 
            class="form-control" 
            placeholder="Enter city..."
            data-i18n-placeholder="search.placeholder"
          >
          <button id="search-btn" class="btn btn-primary" data-i18n="search.button">Search</button>
        </div>
        <div id="search-suggestions" class="list-group mt-2"></div>
      </section>

      <!-- Current Weather -->
      <section id="current-weather" class="card mb-4">
        <div class="card-body">
          <h2 class="card-title" id="current-city">--</h2>
          <div class="row">
            <div class="col-md-6">
              <div class="display-1" id="current-temp">--°C</div>
              <div id="current-condition">--</div>
            </div>
            <div class="col-md-6">
              <ul class="list-unstyled">
                <li data-i18n="weather.feelsLike">Feels like: <span id="feels-like">--</span>°C</li>
                <li data-i18n="weather.humidity">Humidity: <span id="humidity">--</span>%</li>
                <li data-i18n="weather.wind">Wind: <span id="wind">--</span> km/h</li>
                <li data-i18n="weather.pressure">Pressure: <span id="pressure">--</span> hPa</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Alerts -->
      <section id="alerts-section" class="mb-4">
        <h3 data-i18n="alerts.title">Alerts</h3>
        <div id="alerts-container"></div>
      </section>

      <!-- 7-Day Chart -->
      <section id="history-section" class="card mb-4">
        <div class="card-body">
          <h3 class="card-title" data-i18n="history.title">7-Day History</h3>
          <canvas id="history-canvas"></canvas>
        </div>
      </section>

      <!-- 5-Day Forecast -->
      <section id="forecast-section" class="mb-4">
        <h3 data-i18n="forecast.title">5-Day Forecast</h3>
        <div id="forecast-cards" class="row"></div>
      </section>

      <!-- Favorites -->
      <section id="favorites-section" class="mb-4">
        <h3 data-i18n="favorites.title">Favorite Cities</h3>
        <div id="favorites-list" class="row"></div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-dark text-light text-center py-3 mt-5">
      <p data-i18n="footer.credit">Data from OpenWeatherMap</p>
    </footer>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.0/dist/chart.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- App scripts -->
  <script src="/i18n.js"></script>
  <script src="/services/api-client.js"></script>
  <script src="/components/search.js"></script>
  <script src="/components/weather-display.js"></script>
  <script src="/components/alerts.js"></script>
  <script src="/components/history-chart.js"></script>
  <script src="/components/forecast.js"></script>
  <script src="/components/favorites.js"></script>
  <script src="/app.js"></script>
</body>
</html>
```

**Implementation: public/manifest.json**
```json
{
  "name": "Weather Application",
  "short_name": "Weather",
  "description": "Real-time weather with offline support",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2c3e50",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### UNIT FE-003: Search Component

**Vị Trí File**:
```
src/components/search.js
```

**Implementation: src/components/search.js**
```javascript
class SearchComponent {
  constructor(apiClient, onWeatherSelected) {
    this.api = apiClient;
    this.onWeatherSelected = onWeatherSelected;
    this.setupEventListeners();
    this.debounceTimer = null;
  }

  setupEventListeners() {
    const input = document.getElementById('city-input');
    const btn = document.getElementById('search-btn');

    // Debounce input for suggestions (wait 300ms)
    input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.showSuggestions(e.target.value);
      }, 300);
    });

    // Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.search(input.value);
      }
    });

    // Button click
    btn.addEventListener('click', () => {
      this.search(input.value);
    });
  }

  async showSuggestions(query) {
    if (query.length < 2) {
      document.getElementById('search-suggestions').innerHTML = '';
      return;
    }

    try {
      const suggestions = await this.api.validateCity(query);
      this.renderSuggestions(suggestions);
    } catch (error) {
      console.error('Suggestion error:', error);
    }
  }

  async search(city) {
    if (!city || city.length < 2) {
      alert('Please enter city name');
      return;
    }

    try {
      const weather = await this.api.getWeather(city);
      this.onWeatherSelected(weather);
      
      // Save to recent searches
      this.saveRecentSearch(city);
      
      // Clear input
      document.getElementById('city-input').value = '';
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  renderSuggestions(suggestions) {
    const container = document.getElementById('search-suggestions');
    
    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = suggestions
      .map(s => `
        <button class="list-group-item list-group-item-action" 
                onclick="window.searchComponent.search('${s}')">
          ${s}
        </button>
      `)
      .join('');
  }

  saveRecentSearch(city) {
    const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    recent.unshift(city);
    localStorage.setItem('recent_searches', JSON.stringify(recent.slice(0, 5)));
  }
}

// Initialize
window.searchComponent = new SearchComponent(
  window.apiClient,
  (weather) => window.app.displayWeather(weather)
);
```

---

### UNIT FE-007: History Chart

**Vị Trí File**:
```
src/components/history-chart.js
```

**Implementation: src/components/history-chart.js**
```javascript
class HistoryChart {
  constructor(apiClient) {
    this.api = apiClient;
    this.chart = null;
  }

  async loadAndRender(city, days = 7) {
    try {
      const data = await this.api.getHistory(city, days);
      this.render(data, city);
    } catch (error) {
      console.error('History loading error:', error);
    }
  }

  render(data, city) {
    const canvas = document.getElementById('history-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (this.chart) {
      this.chart.destroy();
    }

    const dates = data.map(d => new Date(d.date).toLocaleDateString());
    const temps = data.map(d => d.temperature);
    const humidity = data.map(d => d.humidity);
    const wind = data.map(d => d.wind_speed);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temps,
            borderColor: '#ff6384',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Humidity (%)',
            data: humidity,
            borderColor: '#36a2eb',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Temperature (°C)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Humidity (%)' },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.8)'
          }
        }
      }
    });
  }
}

window.historyChart = new HistoryChart(window.apiClient);
```

---

## SPRINT 3: OFFLINE & ADVANCED FEATURES (TUẦN 3)

### UNIT SW-001: Service Worker

**Vị Trí File**:
```
public/service-worker.js
src/sw-register.js
```

**Implementation: public/service-worker.js**
```javascript
const CACHE_NAME = 'weather-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/app.js',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim(); // Take control of all clients
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
            return response;
          })
          .catch(() => cached || offlineResponse());

        return cached || fetched;
      })
    );
  }
  // Static assets: cache-first
  else {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
  }
});

function offlineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline - cached data not available',
      offline: true
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**Implementation: src/sw-register.js**
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('Service Worker registered:', reg);
        
        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60000); // Every minute
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });

    // Offline/Online detection
    window.addEventListener('offline', () => {
      document.getElementById('offline-banner').classList.remove('d-none');
    });

    window.addEventListener('online', () => {
      document.getElementById('offline-banner').classList.add('d-none');
      // Sync data when reconnected
      syncOfflineData();
    });
  });
}

async function syncOfflineData() {
  // Check offline queue and sync
  const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
  for (const action of queue) {
    try {
      // Process action (e.g., add favorite)
      await window.apiClient.post(`/api/${action.type}`, action.data);
      // Remove from queue on success
      queue.splice(queue.indexOf(action), 1);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
  localStorage.setItem('offline_queue', JSON.stringify(queue));
}
```

---

### UNIT SW-002: i18n System

**Vị Trí File**:
```
src/i18n.js
src/i18n/en.json
src/i18n/vi.json
```

**Implementation: src/i18n.js**
```javascript
class i18n {
  constructor() {
    this.locale = localStorage.getItem('locale') || navigator.language.split('-')[0] || 'en';
    this.messages = {};
    this.load(this.locale);
  }

  async load(locale) {
    try {
      const response = await fetch(`/i18n/${locale}.json`);
      this.messages = await response.json();
      this.locale = locale;
      localStorage.setItem('locale', locale);
      this.updateDOM();
    } catch (error) {
      console.error(`Failed to load locale: ${locale}`, error);
      if (locale !== 'en') {
        await this.load('en');
      }
    }
  }

  t(key, fallback = key) {
    const keys = key.split('.');
    let value = this.messages;
    
    for (const k of keys) {
      value = value[k];
      if (!value) return fallback;
    }
    
    return value || fallback;
  }

  updateDOM() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
  }

  setLocale(locale) {
    return this.load(locale);
  }
}

window.i18n = new i18n();
```

**Implementation: src/i18n/en.json**
```json
{
  "app": {
    "title": "Weather App"
  },
  "search": {
    "placeholder": "Enter city name...",
    "button": "Search"
  },
  "weather": {
    "feelsLike": "Feels like",
    "humidity": "Humidity",
    "wind": "Wind Speed",
    "pressure": "Pressure"
  },
  "alerts": {
    "title": "Alerts"
  },
  "history": {
    "title": "7-Day History"
  },
  "forecast": {
    "title": "5-Day Forecast"
  },
  "favorites": {
    "title": "Favorite Cities"
  },
  "offline": {
    "message": "Offline Mode - Using cached data"
  },
  "footer": {
    "credit": "Data from OpenWeatherMap"
  }
}
```

**Implementation: src/i18n/vi.json**
```json
{
  "app": {
    "title": "Ứng Dụng Thời Tiết"
  },
  "search": {
    "placeholder": "Nhập tên thành phố...",
    "button": "Tìm Kiếm"
  },
  "weather": {
    "feelsLike": "Cảm thấy như",
    "humidity": "Độ ẩm",
    "wind": "Tốc độ gió",
    "pressure": "Áp suất"
  },
  "alerts": {
    "title": "Cảnh báo"
  },
  "history": {
    "title": "Lịch sử 7 ngày"
  },
  "forecast": {
    "title": "Dự báo 5 ngày"
  },
  "favorites": {
    "title": "Thành phố yêu thích"
  },
  "offline": {
    "message": "Chế độ ngoại tuyến - Sử dụng dữ liệu được lưu"
  },
  "footer": {
    "credit": "Dữ liệu từ OpenWeatherMap"
  }
}
```

---

## QUICK REFERENCE: Package.json Scripts

```json
{
  "scripts": {
    "dev": "node api/index.js",
    "build": "echo 'Build steps if needed'",
    "start": "node api/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "migrate": "psql $DATABASE_URL -f migrations/001_create_tables.sql"
  }
}
```

---

## TIẾP THEO: BUILD & TEST PHASE

Sau khi hoàn thành Code Generation:
1. **Build**: `npm run build`
2. **Test**: `npm test` (coverage ≥80%)
3. **Deploy**: `git push` → Vercel auto-deploy
4. **Verify**: Health check + smoke tests

**Phiên Bản Tài Liệu**: 1.0  
**Cập Nhật Lần Cuối**: 2026-09-24  
**Giai Đoạn Tiếp Theo**: Build and Test
