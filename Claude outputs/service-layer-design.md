# Weather Application - Service Layer Design

**Project**: Weather Application  
**Date**: 2026-09-24  
**Phase**: INCEPTION - Application Design  
**Component**: Service Layer Architecture

---

## Service Layer Overview

The service layer acts as the business logic hub between API routes and data layer, implementing all weather-specific operations, alert calculations, caching strategies, and data transformations.

```
┌─────────────────────────────────────────────────────────────┐
│           API Routes (HTTP Endpoints)                       │
├─────────────────────────────────────────────────────────────┤
│  GET /api/weather/:city                                     │
│  GET /api/forecast/:city                                    │
│  GET /api/history/:city                                     │
│  GET /api/alerts/:city                                      │
│  GET /api/validate-city/:name                               │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬─────────────┬──────────────┐
        ↓                 ↓             ↓              ↓
┌──────────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ WeatherService   │ │ Alert    │ │ Forecast │ │ CacheService │
│                  │ │ Service  │ │ Service  │ │              │
└──────────────────┘ └──────────┘ └──────────┘ └──────────────┘
        │                 │             │              │
        └────────┬────────┴─────────────┴──────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│        Database Access Layer (Query/Mutation)               │
├─────────────────────────────────────────────────────────────┤
│  • QueryBuilder                                             │
│  • TransactionManager                                       │
│  • ConnectionPool                                           │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│        PostgreSQL Database (Neon)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. WeatherService

**File**: `backend/services/weather-service.js`

**Responsibility**: Fetch, cache, store, and transform weather data

### 1.1 Core Methods

```javascript
class WeatherService {
  
  /**
   * Get current weather for a city
   * Priority: Cache → Database → External API
   * 
   * @param {string} city - City name
   * @param {object} options - { forceRefresh: boolean, lang: string }
   * @returns {Promise<WeatherObject>}
   */
  async getCurrentWeather(city, options = {}) {
    // Algorithm:
    // 1. Normalize city name
    // 2. Check memory cache (current session)
    // 3. Check database cache (if not expired)
    // 4. Fetch from external API if needed
    // 5. Evaluate alerts
    // 6. Store in database
    // 7. Return formatted data
  }

  /**
   * Batch fetch weather for multiple cities
   * Used for favorites dashboard
   * 
   * @param {string[]} cities - Array of city names
   * @returns {Promise<WeatherObject[]>}
   */
  async getWeatherBatch(cities) {
    // Optimization: Parallel requests, single DB query
  }

  /**
   * Fetch forecast data for city
   * 
   * @param {string} city - City name
   * @returns {Promise<ForecastObject>}
   */
  async getForecast(city) {
    // 1. Check cache validity
    // 2. Fetch from API if needed (forecasts refresh less frequently)
    // 3. Parse and transform data
    // 4. Store in forecast table
    // 5. Return array of 5 daily forecasts
  }

  /**
   * Get historical weather data for trend analysis
   * 
   * @param {string} city - City name
   * @param {number} days - How many days back (default: 7)
   * @returns {Promise<HistoryObject[]>}
   */
  async getWeatherHistory(city, days = 7) {
    // 1. Query database for last N days
    // 2. Fill gaps with API calls if incomplete
    // 3. Sort chronologically
    // 4. Return array with {date, temp, humidity, wind, condition}
  }

  /**
   * Validate city name and return best match
   * 
   * @param {string} cityName - City name to validate
   * @returns {Promise<{city, country, confidence}>}
   */
  async validateCityName(cityName) {
    // 1. Check internal database of cities
    // 2. Use fuzzy matching for typos
    // 3. Return top match with confidence score
    // 4. Provide alternatives if uncertain
  }

  /**
   * Store weather reading in database
   * Called after each API fetch
   * 
   * @param {WeatherObject} weatherData - Weather object
   * @returns {Promise<id>}
   */
  async storeWeatherReading(weatherData) {
    // 1. Insert into weather_readings table
    // 2. Auto-calculate record timestamp
    // 3. Return inserted row ID
  }

  /**
   * Check if cached data is still valid
   * 
   * @param {string} city - City name
   * @param {number} maxAgeMinutes - Max age threshold (default: 30)
   * @returns {Promise<boolean>}
   */
  async isCacheValid(city, maxAgeMinutes = 30) {
    // 1. Query most recent reading for city
    // 2. Compare timestamp with current time
    // 3. Return true if within threshold
  }

  /**
   * Get cached weather without checking API
   * Used in offline mode
   * 
   * @param {string} city - City name
   * @returns {Promise<WeatherObject|null>}
   */
  async getCachedWeather(city) {
    // 1. Check database for most recent reading
    // 2. Format for frontend display
    // 3. Include cache age in response
    // 4. Return null if no cache exists
  }
}
```

### 1.2 Caching Strategy

```
Cache Layer 1: In-Memory (Session)
├─ Duration: Current request/session
├─ Scope: Recently accessed cities
├─ Use: Reduce database queries
└─ Eviction: LRU (Least Recently Used)

Cache Layer 2: Database (Persistent)
├─ Duration: 30 minutes
├─ Scope: All queried cities
├─ Use: Offline support, quick recovery
└─ Eviction: Time-based (3 hours old readings auto-deleted)

Cache Layer 3: Client-side localStorage
├─ Duration: Session
├─ Scope: Favorites, current weather
├─ Use: Minimize round-trips
└─ Eviction: Manual or 24-hour expiry
```

---

## 2. AlertService

**File**: `backend/services/alert-service.js`

**Responsibility**: Evaluate weather conditions against thresholds and generate alerts

### 2.1 Alert Thresholds

```javascript
const ALERT_THRESHOLDS = {
  COLD: {
    threshold: 0,        // °C
    icon: '❄️',
    color: 'blue',
    severity: 'warning',
    message_en: 'Temperature is freezing',
    message_vi: 'Nhiệt độ lạnh đỏ',
    recommendation_en: 'Wear warm clothes',
    recommendation_vi: 'Mặc quần áo ấm'
  },
  
  HEAT: {
    threshold: 35,       // °C
    icon: '🔥',
    color: 'red',
    severity: 'danger',
    message_en: 'Extreme heat warning',
    message_vi: 'Cảnh báo nắng nóng',
    recommendation_en: 'Stay hydrated, limit outdoor activity',
    recommendation_vi: 'Giữ nước, hạn chế hoạt động ngoài trời'
  },
  
  WIND: {
    threshold: 30,       // km/h
    icon: '💨',
    color: 'orange',
    severity: 'warning',
    message_en: 'Strong wind conditions',
    message_vi: 'Điều kiện gió mạnh',
    recommendation_en: 'Secure outdoor items',
    recommendation_vi: 'Cố định vật dụng ngoài trời'
  },
  
  HUMIDITY: {
    threshold: 80,       // %
    icon: '💧',
    color: 'cyan',
    severity: 'info',
    message_en: 'High humidity levels',
    message_vi: 'Mức độ ẩm độ cao',
    recommendation_en: 'Prepare for moisture',
    recommendation_vi: 'Chuẩn bị cho độ ẩm'
  }
};
```

### 2.2 Core Methods

```javascript
class AlertService {
  
  /**
   * Evaluate all alerts for weather data
   * 
   * @param {WeatherObject} weather - Current weather
   * @param {string} language - "en" or "vi"
   * @returns {Promise<Alert[]>}
   */
  async evaluateAlerts(weather, language = 'en') {
    const alerts = [];
    
    // Evaluate each alert type
    if (this.checkColdAlert(weather.temperature)) {
      alerts.push(this.createAlert('COLD', weather, language));
    }
    if (this.checkHeatAlert(weather.temperature)) {
      alerts.push(this.createAlert('HEAT', weather, language));
    }
    if (this.checkWindAlert(weather.wind_speed)) {
      alerts.push(this.createAlert('WIND', weather, language));
    }
    if (this.checkHumidityAlert(weather.humidity)) {
      alerts.push(this.createAlert('HUMIDITY', weather, language));
    }
    
    return alerts;
  }

  /**
   * Check if temperature triggers cold alert
   * 
   * @param {number} temperature - Temperature in °C
   * @returns {boolean}
   */
  checkColdAlert(temperature) {
    return temperature < ALERT_THRESHOLDS.COLD.threshold;
  }

  /**
   * Check if temperature triggers heat alert
   * 
   * @param {number} temperature - Temperature in °C
   * @returns {boolean}
   */
  checkHeatAlert(temperature) {
    return temperature > ALERT_THRESHOLDS.HEAT.threshold;
  }

  /**
   * Check if wind speed triggers alert
   * 
   * @param {number} windSpeed - Wind speed in km/h
   * @returns {boolean}
   */
  checkWindAlert(windSpeed) {
    return windSpeed > ALERT_THRESHOLDS.WIND.threshold;
  }

  /**
   * Check if humidity triggers alert
   * 
   * @param {number} humidity - Humidity percentage
   * @returns {boolean}
   */
  checkHumidityAlert(humidity) {
    return humidity > ALERT_THRESHOLDS.HUMIDITY.threshold;
  }

  /**
   * Create formatted alert object
   * 
   * @param {string} alertType - "COLD", "HEAT", "WIND", "HUMIDITY"
   * @param {WeatherObject} weather - Current weather
   * @param {string} language - "en" or "vi"
   * @returns {Alert}
   */
  createAlert(alertType, weather, language) {
    const threshold = ALERT_THRESHOLDS[alertType];
    const msgKey = `message_${language}`;
    const recKey = `recommendation_${language}`;
    
    return {
      id: `${alertType}_${Date.now()}`,
      type: alertType,
      severity: threshold.severity,
      icon: threshold.icon,
      color: threshold.color,
      message: threshold[msgKey],
      recommendation: threshold[recKey],
      value: this.getAlertValue(alertType, weather),
      threshold: threshold.threshold,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get the specific metric value for alert
   * 
   * @param {string} alertType - Alert type
   * @param {WeatherObject} weather - Weather object
   * @returns {number|null}
   */
  getAlertValue(alertType, weather) {
    switch(alertType) {
      case 'COLD':
      case 'HEAT':
        return weather.temperature;
      case 'WIND':
        return weather.wind_speed;
      case 'HUMIDITY':
        return weather.humidity;
      default:
        return null;
    }
  }
}
```

### 2.3 Alert Display Logic

**Alert Priority/Severity**:
1. **DANGER** (Red, 🔥 Heat) - Highest priority
2. **WARNING** (Orange, ❄️ Cold, 💨 Wind)
3. **INFO** (Blue, 💧 Humidity) - Lowest priority

**Display Rules**:
- Max 3 alerts shown simultaneously
- DANGER alerts always shown first
- Alerts cleared when threshold no longer exceeded

---

## 3. ForecastService

**File**: `backend/services/forecast-service.js`

**Responsibility**: Parse external forecast data, calculate trends, and format for display

### 3.1 Core Methods

```javascript
class ForecastService {
  
  /**
   * Transform raw API forecast data to application format
   * 
   * @param {object} rawForecast - Raw data from OpenWeatherMap
   * @param {string} language - "en" or "vi"
   * @returns {object} - Formatted 5-day forecast
   */
  transformForecastData(rawForecast, language = 'en') {
    return {
      city: rawForecast.city,
      forecast: rawForecast.list
        .filter((_, i) => i % 8 === 0) // One per day (8 × 3-hour entries)
        .slice(0, 5)                    // 5 days only
        .map(day => this.formatForecastDay(day, language))
    };
  }

  /**
   * Format single forecast day
   * 
   * @param {object} dayData - Raw day data
   * @param {string} language - "en" or "vi"
   * @returns {object}
   */
  formatForecastDay(dayData, language) {
    const date = new Date(dayData.dt * 1000);
    
    return {
      date: this.formatDate(date, language),
      high_temperature: Math.round(dayData.main.temp_max),
      low_temperature: Math.round(dayData.main.temp_min),
      avg_temperature: Math.round(dayData.main.temp),
      condition: dayData.weather[0].main,
      description: dayData.weather[0].description,
      icon: dayData.weather[0].icon,
      humidity: dayData.main.humidity,
      wind_speed: Math.round(dayData.wind.speed * 3.6), // m/s → km/h
      chance_rain: Math.round((dayData.rain?.['3h'] || 0) * 100 / 25), // Probability
      uv_index: dayData.uvi || null,
      trend: null // Will be calculated by trend analyzer
    };
  }

  /**
   * Calculate trend based on forecast sequence
   * Compares day 1, 3, 5 temperatures
   * 
   * @param {object[]} forecast - Array of 5 days forecast
   * @returns {string} - "rising", "falling", or "stable"
   */
  calculateTrend(forecast) {
    if (forecast.length < 3) return 'stable';
    
    const temp1 = forecast[0].avg_temperature;
    const temp3 = forecast[2].avg_temperature;
    const temp5 = forecast[4].avg_temperature;
    
    const trend1to3 = temp3 - temp1;
    const trend3to5 = temp5 - temp3;
    
    const avgTrend = (trend1to3 + trend3to5) / 2;
    
    if (avgTrend > 2) return 'rising';
    if (avgTrend < -2) return 'falling';
    return 'stable';
  }

  /**
   * Format date according to language
   * 
   * @param {Date} date - JavaScript Date object
   * @param {string} language - "en" or "vi"
   * @returns {string} - Formatted date string
   */
  formatDate(date, language = 'en') {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat(
      language === 'vi' ? 'vi-VN' : 'en-US',
      options
    );
    return formatter.format(date);
  }

  /**
   * Get detailed forecast for specific day
   * 
   * @param {object[]} forecast - Full forecast
   * @param {number} dayIndex - 0-4 for 5 days
   * @returns {object}
   */
  getDayDetails(forecast, dayIndex) {
    return {
      ...forecast[dayIndex],
      recommendation: this.getActivityRecommendation(forecast[dayIndex])
    };
  }

  /**
   * Generate activity recommendation based on forecast
   * 
   * @param {object} dayData - Day forecast data
   * @returns {string}
   */
  getActivityRecommendation(dayData) {
    const recommendations = [];
    
    if (dayData.high_temperature > 35) {
      recommendations.push('Indoor activities recommended');
    } else if (dayData.high_temperature > 28) {
      recommendations.push('Stay hydrated if outdoors');
    }
    
    if (dayData.chance_rain > 50) {
      recommendations.push('Bring umbrella');
    }
    
    if (dayData.wind_speed > 30) {
      recommendations.push('Secure outdoor items');
    }
    
    return recommendations.length > 0 
      ? recommendations.join(', ') 
      : 'Good weather for outdoor activities';
  }
}
```

---

## 4. CacheService

**File**: `backend/services/cache-service.js`

**Responsibility**: Manage multi-layer caching, data expiration, and cleanup

### 4.1 Core Methods

```javascript
class CacheService {
  
  /**
   * Query historical weather data
   * Combines database query with cleanup
   * 
   * @param {string} city - City name
   * @param {number} days - Days to retrieve (default: 7)
   * @returns {Promise<object[]>}
   */
  async queryWeatherHistory(city, days = 7) {
    // 1. Query database for last N days
    const sql = `
      SELECT temperature, humidity, wind_speed, condition, timestamp
      FROM weather_readings
      WHERE city = $1 AND timestamp > NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;
    
    const results = await db.query(sql, [city]);
    return results.rows.reverse(); // Chronological order
  }

  /**
   * Store weather reading with auto-timestamp
   * 
   * @param {object} weather - Weather data
   * @returns {Promise<number>} - Inserted row ID
   */
  async storeWeatherReading(weather) {
    const sql = `
      INSERT INTO weather_readings 
      (city, temperature, humidity, wind_speed, condition, description, icon, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;
    
    const result = await db.query(sql, [
      weather.city,
      weather.temperature,
      weather.humidity,
      weather.wind_speed,
      weather.condition,
      weather.description,
      weather.icon
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Cleanup old data to maintain database size
   * Run periodically (e.g., daily)
   * 
   * @param {number} retentionDays - Keep last N days (default: 90)
   * @returns {Promise<object>} - { deleted: count }
   */
  async cleanupOldData(retentionDays = 90) {
    const sql = `
      DELETE FROM weather_readings
      WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'
    `;
    
    const result = await db.query(sql);
    return { deleted: result.rowCount };
  }

  /**
   * Get statistics for a city's weather metrics
   * 
   * @param {string} city - City name
   * @param {string} metric - "temperature", "humidity", "wind_speed"
   * @param {number} days - Period to analyze (default: 7)
   * @returns {Promise<object>}
   */
  async getStatistics(city, metric, days = 7) {
    const validMetrics = ['temperature', 'humidity', 'wind_speed'];
    if (!validMetrics.includes(metric)) throw new Error('Invalid metric');
    
    const sql = `
      SELECT 
        MIN(${metric}) as min_value,
        MAX(${metric}) as max_value,
        AVG(${metric}) as avg_value,
        STDDEV(${metric}) as std_deviation
      FROM weather_readings
      WHERE city = $1 AND timestamp > NOW() - INTERVAL '${days} days'
    `;
    
    const result = await db.query(sql, [city]);
    return result.rows[0];
  }

  /**
   * Get cache age for a city's most recent reading
   * 
   * @param {string} city - City name
   * @returns {Promise<number>} - Age in seconds
   */
  async getCacheAge(city) {
    const sql = `
      SELECT EXTRACT(EPOCH FROM (NOW() - MAX(timestamp))) as age_seconds
      FROM weather_readings
      WHERE city = $1
    `;
    
    const result = await db.query(sql, [city]);
    return result.rows[0]?.age_seconds || null;
  }

  /**
   * Mark readings as verified/synced
   * Used for offline sync tracking
   * 
   * @param {string} city - City name
   * @returns {Promise<void>}
   */
  async markSynced(city) {
    const sql = `
      UPDATE weather_readings
      SET synced = true
      WHERE city = $1 AND synced = false
    `;
    
    await db.query(sql, [city]);
  }
}
```

---

## 5. Data Transformation Pipeline

### Flow Diagram
```
External API Response
├─ Parse JSON
├─ Validate required fields
├─ Convert units (°F → °C, mph → km/h)
├─ Format timestamps
├─ Evaluate alerts
├─ Calculate trends
└─ Return application object

Application Object Structure:
{
  city: string,
  country: string,
  coordinates: { lat, lng },
  current: {
    timestamp: ISO8601,
    temperature: number,
    humidity: number,
    wind_speed: number,
    condition: string,
    description: string,
    icon: string
  },
  alerts: Alert[],
  forecast: ForecastDay[],
  cache_info: {
    source: "live" | "cache",
    age_seconds: number
  }
}
```

---

## 6. Error Handling Strategy

### Error Recovery Hierarchy
```
1. Primary: Live API Call
   └─ On failure → Step 2

2. Secondary: Database Cache
   └─ On miss/failure → Step 3

3. Tertiary: Fallback Response
   └─ Return cached data with old timestamp
   └─ Or empty object with error message
   └─ UI displays "using cached data from X hours ago"

4. User Notification
   └─ If online but API fails: "Unable to refresh, using cache"
   └─ If offline: "Offline mode - data may be outdated"
```

### Error Types & Responses
```
API Timeout (> 5 seconds)
├─ Retry once immediately
├─ If fails, use cache
└─ Return: { source: "cache", error: "api_timeout" }

Invalid City
├─ Return suggestions list
└─ Return: { error: "city_not_found", suggestions: [...] }

Database Connection Failed
├─ Try reconnect (3 attempts with exponential backoff)
├─ If fails, return cache from memory
└─ Return: { source: "memory", error: "db_unavailable" }

Malformed Response
├─ Log error with raw response
├─ Use cache
└─ Return: { source: "cache", error: "malformed_response" }
```

---

## 7. Performance Optimization

### Query Optimization
```
Index Strategy:
├─ weather_readings
│  ├─ INDEX ON (city, timestamp DESC) - For history queries
│  └─ INDEX ON (city) - For current weather lookup
│
└─ forecasts
   ├─ INDEX ON (city, forecast_date) - For daily lookup
   └─ INDEX ON (city) - For city validation
```

### Caching Metrics
```
Target Cache Hit Rates:
├─ Current weather: > 80% (within 30 min window)
├─ Historical data: > 90% (changes rarely)
├─ Forecasts: > 85% (daily update)
└─ Overall: > 85%

Cache Size Limits:
├─ In-memory cache: 100 cities max
├─ Database retention: 90 days
└─ Client localStorage: 10MB max
```

---

## Summary

**Service Layer Components**: 4 main services
- **WeatherService**: Core data fetching and caching
- **AlertService**: Threshold evaluation and alert generation
- **ForecastService**: Data transformation and trend analysis
- **CacheService**: Database operations and cleanup

**Key Design Principles**:
1. **Single Responsibility**: Each service has one primary job
2. **Error Resilience**: Multiple fallback levels
3. **Performance First**: Multi-layer caching strategy
4. **Data Integrity**: Validation at every step
5. **Offline Support**: Cache-first approach when offline

**Status**: ✅ SERVICE LAYER DESIGN COMPLETE

