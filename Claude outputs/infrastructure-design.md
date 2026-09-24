# Infrastructure Design Document

**Project**: Weather Application  
**Phase**: CONSTRUCTION - Infrastructure Design  
**Date**: 2026-09-24  
**Author**: Claude Haiku 4.5  
**Language**: EN / VI

---

## Executive Summary

This document specifies the complete infrastructure architecture for deploying and operating the Weather Application. It covers five key dimensions: **Deployment Platform (Vercel)**, **Database (Neon PostgreSQL)**, **Version Control & CI/CD (GitHub Actions)**, **API Specifications**, and **Infrastructure Monitoring**.

The infrastructure is designed for serverless deployment with automatic scaling, ensuring high availability and cost efficiency while supporting 50,000+ concurrent users.

---

## 1. VERCEL DEPLOYMENT INFRASTRUCTURE

### 1.1 Vercel Project Configuration

#### 1.1.1 vercel.json Configuration File
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
  "installCommand": "npm install",
  "framework": "vanilla",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30,
      "runtime": "nodejs20.x"
    }
  },
  "regions": [
    "sfo1",
    "iad1",
    "hnd1"
  ],
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=60, stale-while-revalidate=300"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    },
    {
      "source": "/static/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Configuration Explanation**:
- **Runtime**: Node.js 20.x (latest LTS)
- **Memory**: 1024 MB per function (sufficient for API processing)
- **Max Duration**: 30 seconds (reasonable timeout for weather API calls)
- **Regions**: US (sfo1), Asia (hnd1) for global distribution
- **Cache Control**: 60 sec for API (+ 300 sec stale), 1 year for static assets

#### 1.1.2 Environment Variables

**Required Vercel Secrets** (configure in Vercel dashboard):

| Variable | Example | Purpose |
|----------|---------|---------|
| `OPENWEATHER_API_KEY` | `sk_weather_abc123...` | OpenWeatherMap API authentication |
| `DATABASE_URL` | `postgresql://user:pass@host/dbname` | Neon PostgreSQL connection string |
| `NODE_ENV` | `production` | Runtime environment indicator |
| `LOG_LEVEL` | `info` | Logging verbosity (debug, info, warn, error) |
| `GITHUB_TOKEN` | `ghp_...` | GitHub Actions integration (optional) |

**Local Development** (.env.local — never commit):
```
OPENWEATHER_API_KEY=test_key_here
DATABASE_URL=postgresql://localhost/weather_dev
NODE_ENV=development
LOG_LEVEL=debug
```

#### 1.1.3 Build and Deployment Process

```
┌─────────────────────────────────────────────────────┐
│ GitHub Push (main or feature branch)                │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │ GitHub Actions CI │
         │ (Tests & Build)   │
         └─────────┬─────────┘
                   │
        ┌──────────▼──────────┐
        │ Vercel Auto-Deploy  │
        │ (on main push)      │
        └─────────┬────────────┘
                  │
      ┌───────────▼───────────┐
      │ Production Deployment │
      │ - DNS routing         │
      │ - Cache invalidation  │
      │ - Health checks       │
      └───────────────────────┘
```

**Build Steps**:
1. `npm install` — Install dependencies
2. `npm run lint` — Code quality check
3. `npm run test` — Run test suite
4. `npm run build` — Bundle frontend + backend
5. Deploy to Vercel (automatic on main branch)
6. Health check verification (GET /health endpoint)

#### 1.1.4 Deployment Environments

**Production** (main branch → weather-app.vercel.app)
- Auto-deploy on every push
- Health checks every 60 seconds
- Automatic rollback on failed health check

**Preview Deployments** (pull requests)
- Auto-deploy on PR creation
- Unique URL: `https://<pr-number>-weather-app.vercel.app`
- Allows testing before merging

**Development** (local machine)
- `npm run dev` — Local server on http://localhost:3000
- Hot reload on file changes
- Direct database access for testing

### 1.2 Performance Optimization in Vercel

#### 1.2.1 Edge Caching Strategy

```javascript
// Vercel automatically serves via CDN (edge locations globally)
// Cache-Control headers determine TTL:

// 1. API Responses (Weather data)
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
// - Edge cache: 60 seconds
// - Serve stale: up to 300 seconds while revalidating
// - Benefit: Cache popular cities (London, NYC, Tokyo) at edge

// 2. Static Assets (HTML, CSS, JS)
Cache-Control: public, max-age=31536000, immutable
// - Browser cache: 1 year (immutable = version-locked)
// - Never re-requested (unless explicitly cleared)
// - Benefit: Instant repeat visits

// 3. HTML Page
Cache-Control: public, max-age=3600
// - HTML can change (new features, bug fixes)
// - 1-hour browser cache prevents stale HTML
// - Vercel edge serves fresh HTML every hour
```

#### 1.2.2 Regional Distribution

**Vercel Regions Configured**:
```
sfo1 (San Francisco)  → Americas
iad1 (Virginia)       → Americas East, Europe
hnd1 (Tokyo)          → Asia-Pacific
```

**Latency Expectations**:
- Americas users: < 50ms to sfo1 or iad1
- Europe users: < 30ms to iad1
- Asia users: < 50ms to hnd1
- Global average: < 100ms edge response

---

## 2. NEON POSTGRESQL DATABASE DESIGN

### 2.1 Database Schema

#### 2.1.1 Connection String & Pooling Configuration

```
Primary Connection String:
postgresql://user:password@ep-xxx.neon.tech/weather?sslmode=require

Connection Pool Settings:
- Pool size: 15 connections
- Min idle: 5 connections
- Max client connections: 1000
- Idle timeout: 5 minutes
- Statement timeout: 10 seconds
- Connection timeout: 10 seconds
```

#### 2.1.2 Database Tables

**Table 1: weather_readings**
```sql
CREATE TABLE weather_readings (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  temperature DECIMAL(5, 2) NOT NULL,        -- -50 to +60°C
  feels_like DECIMAL(5, 2),
  humidity INT CHECK (humidity >= 0 AND humidity <= 100),
  wind_speed DECIMAL(5, 2),                  -- km/h
  wind_direction INT CHECK (wind_direction >= 0 AND wind_direction < 360),
  pressure INT,                               -- hPa
  cloudiness INT CHECK (cloudiness >= 0 AND cloudiness <= 100),
  visibility INT,                             -- meters
  condition VARCHAR(50),                      -- "Cloudy", "Rainy", etc.
  icon_id VARCHAR(10),                        -- OpenWeather icon code
  description TEXT,
  rain_probability DECIMAL(3, 2),             -- 0.00 to 1.00
  rain_amount DECIMAL(5, 2),                  -- mm
  sunrise TIMESTAMP,
  sunset TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_city_time UNIQUE (city, created_at)
);

-- Indexes for performance
CREATE INDEX idx_weather_city_timestamp 
  ON weather_readings(city, created_at DESC);
CREATE INDEX idx_weather_created_at 
  ON weather_readings(created_at DESC);

-- Retention: Keep 90 days of data
-- Automatic cleanup query (run nightly):
-- DELETE FROM weather_readings WHERE created_at < NOW() - INTERVAL '90 days';
```

**Table 2: forecasts**
```sql
CREATE TABLE forecasts (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  forecast_date DATE NOT NULL,                -- Date of forecast
  forecast_time TIMESTAMP NOT NULL,           -- Specific time
  temperature_high DECIMAL(5, 2),
  temperature_low DECIMAL(5, 2),
  temperature_avg DECIMAL(5, 2),
  condition VARCHAR(50),
  icon_id VARCHAR(10),
  description TEXT,
  humidity INT,
  wind_speed DECIMAL(5, 2),
  rain_probability DECIMAL(3, 2),             -- 0.00 to 1.00
  rain_amount DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_forecast UNIQUE (city, forecast_date, forecast_time)
);

-- Index for fast retrieval
CREATE INDEX idx_forecasts_city_date 
  ON forecasts(city, forecast_date);
CREATE INDEX idx_forecasts_created_at 
  ON forecasts(created_at DESC);

-- Retention: Keep forecasts for 10 days
-- Automatic cleanup (run nightly):
-- DELETE FROM forecasts WHERE forecast_date < CURRENT_DATE - INTERVAL '10 days';
```

**Table 3: user_preferences**
```sql
CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) UNIQUE NOT NULL,      -- localStorage-based client ID
  favorite_cities TEXT[],                    -- Array of cities
  language VARCHAR(10) DEFAULT 'en',         -- 'en' or 'vi'
  temperature_unit VARCHAR(5) DEFAULT 'C',   -- 'C' or 'F'
  wind_unit VARCHAR(10) DEFAULT 'kmh',       -- 'kmh' or 'mph'
  notification_enabled BOOLEAN DEFAULT TRUE,
  notification_frequency INT DEFAULT 30,      -- minutes
  theme VARCHAR(20) DEFAULT 'auto',          -- 'light', 'dark', 'auto'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user lookups
CREATE INDEX idx_user_preferences_id 
  ON user_preferences(user_id);

-- Retention: Indefinite (user settings)
-- Cleanup stale entries (no updates for 1 year):
-- DELETE FROM user_preferences WHERE updated_at < NOW() - INTERVAL '1 year';
```

#### 2.1.3 Database Partitioning Strategy (for scale)

**When to implement** (>100 million rows):
```sql
-- Create partitioned table by month
CREATE TABLE weather_readings_partitioned (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  temperature DECIMAL(5, 2) NOT NULL,
  -- ... other columns ...
  created_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE weather_readings_202609 PARTITION OF weather_readings_partitioned
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE weather_readings_202610 PARTITION OF weather_readings_partitioned
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

-- Benefits:
-- - Query planner prunes irrelevant partitions
-- - Old partitions can be archived or deleted
-- - Parallel scans across partitions
-- - Improves performance for large tables
```

**Current Plan**: No partitioning needed at launch (90-day retention = ~32M rows max). Implement when:
- Database size exceeds 50GB
- Query times degrade > 500ms
- Estimated 6+ months into production with 50,000+ users

### 2.2 Database Backup & Disaster Recovery

#### 2.2.1 Neon Automated Backups
```
Backup Strategy:
- Type: WAL-based continuous archiving (point-in-time recovery)
- Frequency: Continuous (real-time replication)
- Retention: 7 days of backups
- Recovery window: Can restore to any point in last 7 days
- Manual snapshots: Enabled (one-click backup)

Backup Storage:
- Location: Neon managed (AWS S3-backed)
- Redundancy: 3x replication
- Encryption: AES-256 at rest, TLS in transit
```

#### 2.2.2 Disaster Recovery Procedure
```
Scenario: Database corruption or accidental data loss

Recovery Steps:
1. Neon console → Backups tab
2. Select backup from 7-day history
3. Click "Restore from backup"
4. Choose restore point (or specific timestamp)
5. Neon creates new database instance with restored data
6. Update DATABASE_URL in Vercel environment
7. Restart functions (automatic)
8. Verify health check: GET /health

Expected downtime: < 5 minutes
Data loss: None (can restore to specific second)

Alternative: Maintain read-only replica for failover
```

### 2.3 Database Connection & Performance

#### 2.3.1 Node.js Connection Pool Configuration
```javascript
// Using 'pg' (node-postgres) library
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool settings
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // 30 sec idle timeout
  connectionTimeoutMillis: 10000, // 10 sec connect timeout
  
  // Performance tuning
  statement_timeout: 10000,   // Query timeout (ms)
  application_name: 'weather-app-api',
  
  // SSL configuration (required for Neon)
  ssl: {
    rejectUnauthorized: false // Neon certificate validation
  }
});

// Health check: test connection
pool.query('SELECT 1')
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection failed:', err));
```

#### 2.3.2 Query Optimization Examples

**Slow Query (N+1 problem)**:
```javascript
// ❌ SLOW: Fetches history, then loops to get extra data
const readings = await pool.query(
  'SELECT * FROM weather_readings WHERE city = $1 ORDER BY created_at DESC LIMIT 7',
  [city]
);
for (const reading of readings.rows) {
  const alerts = await pool.query(
    'SELECT * FROM alerts WHERE reading_id = $1',
    [reading.id]
  ); // N additional queries!
}
```

**Optimized Query**:
```javascript
// ✅ FAST: Single query with JOIN
const result = await pool.query(
  `SELECT 
     r.*, 
     json_agg(a.*) as alerts
   FROM weather_readings r
   LEFT JOIN alerts a ON r.id = a.reading_id
   WHERE r.city = $1
   GROUP BY r.id
   ORDER BY r.created_at DESC
   LIMIT 7`,
  [city]
);
```

**Efficient Aggregation Query**:
```javascript
// Calculate statistics for 7-day trend
const stats = await pool.query(
  `SELECT 
     MIN(temperature) as min_temp,
     MAX(temperature) as max_temp,
     AVG(temperature) as avg_temp,
     STDDEV(temperature) as std_temp,
     COUNT(*) as sample_count
   FROM weather_readings
   WHERE city = $1 
   AND created_at > NOW() - INTERVAL '7 days'`,
  [city]
);
```

---

## 3. GITHUB & CI/CD INFRASTRUCTURE

### 3.1 Repository Structure

```
weather-app/
├── .github/
│   ├── workflows/
│   │   ├── tests.yml           # Run tests on every push
│   │   ├── deploy.yml          # Deploy to Vercel on main
│   │   └── lint.yml            # Code quality checks
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md
├── api/
│   ├── weather.js              # GET /api/weather/:city
│   ├── forecast.js             # GET /api/forecast/:city
│   ├── history.js              # GET /api/history/:city
│   ├── alerts.js               # GET /api/alerts/:city
│   └── validate-city.js        # POST /api/validate-city
├── src/
│   ├── components/             # UI components
│   ├── services/               # Client-side logic
│   ├── styles/                 # CSS files
│   ├── i18n/                   # Translation files
│   │   ├── en.json
│   │   └── vi.json
│   └── index.html              # Entry point
├── public/
│   ├── manifest.json           # PWA metadata
│   ├── service-worker.js       # Offline support
│   └── icons/                  # Weather icons
├── tests/
│   ├── api/                    # API tests
│   ├── components/             # Component tests
│   └── e2e/                    # End-to-end tests
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies & scripts
├── vercel.json                 # Vercel config
├── README.md                   # Documentation
└── CLAUDE.md                   # AI-DLC workflow rules
```

### 3.2 GitHub Actions CI/CD Workflows

#### 3.2.1 tests.yml — Run Tests on Every Push
```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: weather_test
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost/weather_test
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

#### 3.2.2 deploy.yml — Deploy to Vercel on Main
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

#### 3.2.3 lint.yml — Code Quality Checks
```yaml
name: Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: ESLint
        run: npm run lint:js
      
      - name: Prettier (code formatting)
        run: npm run format:check
      
      - name: Security audit
        run: npm audit --audit-level=moderate
```

### 3.3 Git Workflow & Branching Strategy

#### 3.3.1 Branch Structure
```
main                  ← Production deployment
  ↑
  ├─ develop        ← Integration branch
  │   ↑
  │   ├─ feature/weather-service
  │   ├─ feature/offline-support
  │   ├─ feature/alerts
  │   └─ feature/i18n
  │
  └─ hotfix/         ← Emergency production fixes
```

#### 3.3.2 Commit Convention
```
Format: <type>(<scope>): <subject>

Types:
  feat:     New feature
  fix:      Bug fix
  docs:     Documentation
  style:    Code style (no logic change)
  refactor: Code refactoring
  test:     Test additions
  chore:    Build, deps, tooling
  perf:     Performance improvement

Examples:
  feat(weather): implement caching layer
  fix(offline): correct sync merge logic
  docs(api): add weather endpoint spec
  test(alerts): add alert threshold tests
```

#### 3.3.3 Pull Request Process
```
1. Create feature branch: git checkout -b feature/xyz
2. Make changes & commit with convention
3. Push to GitHub: git push origin feature/xyz
4. Create Pull Request with description
5. GitHub Actions runs tests automatically
6. Code review (requires 1 approval)
7. Merge to develop when approved
8. Develop branch deployed to preview env
9. When ready, merge develop → main
10. Main branch auto-deploys to production
```

---

## 4. API SPECIFICATIONS

### 4.1 RESTful API Contract

#### 4.1.1 GET /api/weather/:city
**Get current weather for a city**

```
Request:
  GET /api/weather/London
  Headers:
    Content-Type: application/json

Response (200 OK):
{
  "success": true,
  "data": {
    "city": "London",
    "country": "GB",
    "temperature": 15.2,
    "feels_like": 14.8,
    "humidity": 65,
    "wind_speed": 12.5,
    "wind_direction": 230,
    "condition": "Cloudy",
    "icon_id": "04d",
    "description": "overcast clouds",
    "pressure": 1013,
    "cloudiness": 90,
    "visibility": 10000,
    "sunrise": "2026-09-24T06:30:00Z",
    "sunset": "2026-09-24T18:45:00Z"
  },
  "cache": {
    "source": "memory",        // "memory", "cache", "database", "api"
    "age_seconds": 45,         // Cache age
    "ttl_seconds": 1800        // Time to live remaining
  },
  "alerts": [
    {
      "type": "wind",
      "severity": "high",
      "message": "High wind alert: 12.5 km/h",
      "recommendation": "Secure loose outdoor items"
    }
  ],
  "timestamp": "2026-09-24T10:30:00Z"
}

Response (404 Not Found):
{
  "success": false,
  "error": "City not found",
  "code": "CITY_NOT_FOUND",
  "suggestions": ["London, UK", "London, Canada"]
}

Response (500 Internal Server Error):
{
  "success": false,
  "error": "External API unavailable",
  "code": "API_ERROR",
  "cached_fallback": { ... }  // Last known data if available
}
```

**Query Parameters**:
- `units` (optional): "metric" (default) or "imperial"
- `lang` (optional): "en" or "vi"

**Response Time**: < 1 second (from cache) or < 2 seconds (with external API)

#### 4.1.2 GET /api/forecast/:city
**Get 5-day forecast**

```
Request:
  GET /api/forecast/London?lang=en

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "date": "2026-09-25",
      "day_name": "Friday",
      "temp_high": 18,
      "temp_low": 12,
      "temp_avg": 15,
      "condition": "Partly Cloudy",
      "icon_id": "02d",
      "humidity": 60,
      "wind_speed": 10,
      "rain_probability": 0.2,
      "rain_amount": 1.2,
      "trend": "rising"  // rising, stable, falling
    },
    // ... 4 more days
  ],
  "timestamp": "2026-09-24T10:30:00Z"
}
```

#### 4.1.3 GET /api/history/:city
**Get 7-day historical data**

```
Request:
  GET /api/history/London?days=7

Response (200 OK):
{
  "success": true,
  "city": "London",
  "data": [
    {
      "date": "2026-09-24",
      "timestamp": "2026-09-24T00:00:00Z",
      "temperature": 14.5,
      "humidity": 68,
      "wind_speed": 11.2,
      "condition": "Cloudy"
    },
    // ... 6 more days
  ],
  "statistics": {
    "temp_min": 10.2,
    "temp_max": 18.5,
    "temp_avg": 14.8,
    "temp_stddev": 2.1,
    "humidity_avg": 65,
    "wind_avg": 10.5
  }
}
```

#### 4.1.4 GET /api/alerts/:city
**Get active alerts for a city**

```
Request:
  GET /api/alerts/London?lang=vi

Response (200 OK):
{
  "success": true,
  "alerts": [
    {
      "type": "wind",
      "severity": "high",
      "icon": "💨",
      "message_en": "High wind alert",
      "message_vi": "Cảnh báo gió mạnh",
      "current_value": 35.2,
      "threshold": 30,
      "recommendation_en": "Secure outdoor items",
      "recommendation_vi": "Giữ an toàn cho đồ vật ngoài trời"
    }
  ]
}

Response (200 OK - No alerts):
{
  "success": true,
  "alerts": []  // Empty array
}
```

**Alert Types**:
- `cold`: temperature < 0°C
- `heat`: temperature > 35°C
- `wind`: wind_speed > 30 km/h
- `humidity`: humidity > 80%

#### 4.1.5 POST /api/validate-city
**Validate city name and get suggestions**

```
Request:
  POST /api/validate-city
  Content-Type: application/json
  
  {
    "city": "Lond"
  }

Response (200 OK):
{
  "success": true,
  "valid": false,
  "suggestions": [
    "London, UK",
    "London, Canada",
    "Londonderry, UK"
  ]
}

Response (200 OK):
{
  "success": true,
  "valid": true,
  "city": "London",
  "country": "United Kingdom",
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

### 4.2 Rate Limiting Headers

**All API Responses Include**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1695534000
X-RateLimit-Window: 900  // 15 minutes
```

**Rate Limits**:
- 100 requests per 15-minute window
- Per IP address (not per user, no auth required)
- Reset at minute boundary

---

## 5. INFRASTRUCTURE MONITORING

### 5.1 Health Check Endpoint

#### 5.1.1 GET /health
**System status check**

```
Request:
  GET /health

Response (200 OK):
{
  "status": "ok",
  "timestamp": "2026-09-24T10:30:00Z",
  "uptime_seconds": 3600,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "ok",
      "latency_ms": 12,
      "connections": 8
    },
    "external_api": {
      "status": "ok",
      "latency_ms": 450,
      "last_error": null
    },
    "cache": {
      "status": "ok",
      "hit_rate": 0.96,
      "items": 1250
    }
  },
  "checks": {
    "memory_usage_percent": 42.5,
    "cpu_usage_percent": 15.2,
    "disk_free_gb": 45.3
  }
}

Response (503 Service Unavailable):
{
  "status": "degraded",
  "timestamp": "2026-09-24T10:30:00Z",
  "services": {
    "database": {
      "status": "error",
      "error": "Connection timeout"
    }
  }
}
```

### 5.2 Logging Infrastructure

#### 5.2.1 Log Levels & Format
```javascript
// Winston logger configuration
{
  timestamp: '2026-09-24T10:30:00Z',
  level: 'info',              // debug, info, warn, error
  service: 'weather-api',
  function: 'GET /api/weather/:city',
  message: 'Weather request processed',
  city: 'London',
  response_time_ms: 245,
  status: 200,
  cache_source: 'memory',
  user_agent: 'Mozilla/5.0...',
  ip_address: '192.0.2.1',
  request_id: 'req-abc123xyz'
}
```

**Log Destinations**:
1. **Console** (development) — Real-time debugging
2. **Vercel Logs** (production) — Searchable, time-windowed
3. **Error Tracking** (Sentry optional) — Production errors

#### 5.2.2 Alert Triggers
```
1. ERROR log entries → Email alert to admin
2. 3+ failures in 1 minute → Slack notification
3. Database latency > 1000ms → Investigation log
4. External API error rate > 5% → Fallback triggered
5. Memory usage > 80% → Vercel auto-scales (if needed)
```

---

## 6. DEPLOYMENT CHECKLIST

### 6.1 Pre-Deployment Steps

- [ ] All tests passing (GitHub Actions: ✅ green)
- [ ] Code review completed (PR approved)
- [ ] Environment variables configured in Vercel
- [ ] Database backup created
- [ ] API health check endpoint tested locally
- [ ] Cache configuration verified
- [ ] Security headers enabled in vercel.json
- [ ] Rate limiting rules verified
- [ ] Error tracking (Sentry) configured (optional)

### 6.2 Deployment Process

1. **Merge PR to main**: `git merge feature/xyz`
2. **GitHub Actions**: Automatically runs tests
3. **Vercel Auto-Deploy**: Main branch triggers deployment
4. **Health Checks**: Vercel monitors /health endpoint
5. **DNS Verification**: weather-app.vercel.app resolves
6. **Smoke Tests**: Manual verification of key flows

### 6.3 Post-Deployment Verification

- [ ] Application loads (https://weather-app.vercel.app)
- [ ] Search works (returns weather data < 3 sec)
- [ ] Cache working (subsequent searches < 1 sec)
- [ ] Offline mode functions (Service Worker active)
- [ ] Alerts display correctly
- [ ] Dark mode toggles
- [ ] Language switching works (EN/VI)
- [ ] Forecast chart renders
- [ ] History data displays
- [ ] Favorites persist
- [ ] No console errors in browser DevTools

---

## 7. INFRASTRUCTURE SCALING ROADMAP

### 7.1 Current (Launch)
```
Users: 100-500/day
Database: Single instance (Neon)
Deployment: Vercel serverless
Cache: In-process + localStorage + Service Worker
```

### 7.2 Phase 2 (500-5,000 users/day)
```
Users: 500-5,000/day (estimated month 3)
Database: Add read replica for analytics
Cache: Implement Redis (if needed)
Deployment: Same (Vercel scales automatically)
Regions: Keep current (sfo1, iad1, hnd1)
```

### 7.3 Phase 3 (5,000-50,000+ users/day)
```
Users: 5,000-50,000+/day (estimated month 6+)
Database: Add connection pooling optimization
  → Implement PgBouncer if Neon doesn't handle
Cache: Distributed Redis cluster
Deployment: Same (Vercel handles auto-scaling)
Regions: Add more regions (eu-west-1, ap-south-1)
CDN: Vercel edge locations (included)
```

---

## Implementation Timeline

| Phase | Duration | Key Tasks | Status |
|-------|----------|-----------|--------|
| Setup | Day 1 | Vercel project, GitHub repo, Neon DB | Pending |
| Config | Day 1 | Environment variables, CI/CD workflows | Pending |
| Database | Days 2-3 | Schema creation, indexes, migrations | Pending |
| API | Days 4-6 | Implement 5 endpoints, error handling | Pending |
| Testing | Days 7-8 | Unit tests, integration tests, E2E | Pending |
| Deploy | Day 9 | Production deployment, monitoring setup | Pending |

---

**Document Version**: 1.0  
**Last Updated**: 2026-09-24  
**Next Phase**: Code Planning (CONSTRUCTION)
