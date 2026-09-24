# Kế Hoạch Lập Trình (Code Planning)

**Dự Án**: Ứng Dụng Thời Tiết  
**Giai Đoạn**: CONSTRUCTION - Code Planning  
**Ngày**: 2026-09-24  
**Tác Giả**: Claude Haiku 4.5  
**Ngôn Ngữ**: EN / VI

---

## Tóm Tắt Điều Hành

Tài liệu này xác định chiến lược lập trình chi tiết cho dự án Ứng Dụng Thời Tiết. Nó tổ chức 24 câu chuyện người dùng vào 3 sprint với 26 unit thực hiện, định rõ phụ thuộc, ước tính nỗ lực, và tiêu chí hoàn thành.

**Mục Tiêu**:
- Tổ chức 24 user stories thành 3 sprint (3 tuần)
- Xác định các phụ thuộc giữa 26 implementation units
- Cung cấp hướng dẫn lập trình chi tiết cho từng sprint
- Định nghĩa tiêu chí chấp nhận rõ ràng
- Xác định rủi ro và chiến lược giảm thiểu

---

## 1. TỔNG QUAN LẬP TRÌNH

### 1.1 Nguyên Tắc Lập Trình

**Tiêu Chí Chấp Nhận User Story**:
```
1. Code viết sạch và theo chuẩn
2. Tất cả unit tests viết (coverage ≥ 80%)
3. Không có console warnings hoặc errors
4. Performance targets đạt được
5. Accessibility (WCAG 2.1 AA) tuân theo
6. Code review được chấp nhận
7. Merged vào develop branch
```

**Quy Tắc Lập Trình**:
- Commit nhỏ, thường xuyên (mỗi feature < 500 dòng)
- Viết test trước (TDD approach khi có thể)
- Code review bắt buộc trước merge
- Refactor khi cần thiết (không delay)
- Performance profiling trước deploy

### 1.2 Cấu Trúc Sprint

**Sprint = 1 tuần (5 ngày làm việc)**
- Thứ 2-3: Phát triển (Development)
- Thứ 4: Integration & Testing
- Thứ 5: Polish & Deployment

**Definition of Done (DoD)**:
- [ ] Code hoàn thành
- [ ] Unit tests viết xong (≥80% coverage)
- [ ] Code review passed
- [ ] Documentation cập nhật
- [ ] Performance tested
- [ ] Merged vào develop
- [ ] No blocking issues

---

## 2. SPRINT 1 (TUẦN 1) - FOUNDATION & CORE SERVICES

### 2.1 Sprint 1 Overview

**Thời Gian**: Ngày 1-5  
**Mục Tiêu**: Thiết lập cơ sở hạ tầng, database, và backend core services  
**User Stories**: US-001, US-002, US-003, US-004, US-005, US-006 (6 stories)  
**Implementation Units**: DB-001, DB-002, BE-001 to BE-008, INF-001, INF-002, INF-003 (15 units)  
**Nỗ Lực Tổng**: ~60 giờ  

### 2.2 Chi Tiết Unit & Dependencies

**DAY 1: Chuẩn Bị & Database**

| Unit | Tên | Nỗ Lực | Phụ Thuộc | Trạng Thái |
|------|------|--------|-----------|-----------|
| INF-001 | Vercel Setup | 4h | None | Ready |
| DB-001 | Schema Design | 4h | INF-001 | Ready |
| INF-002 | GitHub Setup | 3h | None | Ready |
| INF-003 | Database Connection | 3h | DB-001 | Ready |

**DAY 2-3: Backend Services**

| Unit | Tên | Nỗ Lực | Phụ Thuộc | Story |
|------|------|--------|-----------|--------|
| BE-001 | Express Server | 3h | INF-001 | US-001 |
| BE-002 | Weather Service | 10h | DB-001, BE-001 | US-002 |
| BE-003 | Alert Service | 6h | BE-002 | US-003 |
| BE-004 | Forecast Service | 8h | BE-002 | US-004 |
| BE-005 | Cache Service | 8h | DB-001 | US-005 |
| DB-002 | Data Validation | 6h | BE-002 | US-006 |

**DAY 4: Integration**

- [ ] Tất cả database migrations chạy thành công
- [ ] API endpoints phản hồi (curl tests)
- [ ] Cache layer hoạt động
- [ ] Health check endpoint ready

**DAY 5: Testing & Polish**

- [ ] Unit tests cho tất cả services (≥80%)
- [ ] Integration tests cho API
- [ ] Performance profiling (response time < 100ms)
- [ ] Code review hoàn thành

### 2.3 Hướng Dẫn Lập Trình Sprint 1

#### 2.3.1 BE-002: Weather Service (10 giờ)

**Phương Pháp Lập Trình**:

```javascript
// Step 1: Setup WeatherService class với các methods chủ yếu
class WeatherService {
  constructor(cacheService, apiClient) {
    this.cache = cacheService;
    this.api = apiClient;
  }

  async getCurrentWeather(city, options = {}) {
    // Step 2: Implement caching logic (L1-L4)
    // 1. Check memory cache (1-2 min TTL)
    // 2. Check localStorage (30 min TTL)
    // 3. Check database (30 min TTL)
    // 4. Fetch from external API (OpenWeatherMap)
    // 5. Store in all layers
    
    const cached = await this.cache.getMemory(city);
    if (cached && this.isValidCache(cached)) {
      return cached;
    }
    
    try {
      const weather = await this.api.fetchWeather(city);
      await this.cache.storeMultiLayer(city, weather);
      return weather;
    } catch (error) {
      // Fallback to stale cache
      return await this.cache.getDatabase(city) || null;
    }
  }

  async validateCityName(cityName) {
    // Fuzzy matching logic
    // Return suggestions if not exact match
  }

  async storeWeatherReading(weatherData) {
    // Insert vào database
  }
}
```

**Acceptance Criteria**:
- [x] Tất cả 8 methods được implement
- [x] Caching logic hoạt động đúng (test)
- [x] External API integration thành công
- [x] Error handling & fallback hoạt động
- [x] Response time < 100ms từ cache
- [x] ≥80% code coverage

#### 2.3.2 BE-003: Alert Service (6 giờ)

**Alert Types & Thresholds**:
```javascript
const ALERT_CONFIG = {
  cold: {
    threshold: 0,
    operator: '<',
    icon: '❄️',
    message_en: 'Cold Alert',
    message_vi: 'Cảnh báo lạnh'
  },
  heat: {
    threshold: 35,
    operator: '>',
    icon: '🔥',
    message_en: 'Heat Alert',
    message_vi: 'Cảnh báo nóng'
  },
  wind: {
    threshold: 30,
    operator: '>',
    icon: '💨',
    message_en: 'Wind Alert',
    message_vi: 'Cảnh báo gió'
  },
  humidity: {
    threshold: 80,
    operator: '>',
    icon: '💧',
    message_en: 'Humidity Alert',
    message_vi: 'Cảnh báo độ ẩm'
  }
};
```

**Implementation Approach**:
1. Implement evaluateAlerts() method
2. Check từng threshold
3. Tạo alert objects với icon & message
4. Support bilingual messages (EN/VI)
5. Unit tests cho tất cả 4 alert types

#### 2.3.3 DB-001: Schema Design (4 giờ)

**Implementation Steps**:
```sql
-- Step 1: Create weather_readings table
CREATE TABLE weather_readings (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  temperature DECIMAL(5, 2) NOT NULL,
  -- ... other columns ...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes
CREATE INDEX idx_weather_city_timestamp 
  ON weather_readings(city, created_at DESC);

-- Step 3: Create forecasts table
CREATE TABLE forecasts ( ... );

-- Step 4: Create user_preferences table
CREATE TABLE user_preferences ( ... );

-- Step 5: Create migration file
-- migrations/001_create_tables.js
```

**Testing**:
- [x] Connect tới test database
- [x] Run migrations thành công
- [x] Tables được tạo với correct schema
- [x] Indexes được tạo
- [x] Queries nhanh < 50ms

### 2.4 User Stories - Sprint 1

**US-001: Search Weather by City**
```
Title: Tìm kiếm thời tiết theo thành phố
Acceptance Criteria:
  - User nhập tên thành phố
  - System gọi /api/weather/:city
  - Dữ liệu thời tiết hiển thị < 3 giây
  - Invalid city shows suggestions
```

**US-002: Cache & Performance**
```
Title: Lưu trữ dữ liệu & tối ưu hiệu năng
Acceptance Criteria:
  - Cache hit rate > 95%
  - Search repeat < 1 giây
  - Memory usage < 50MB
```

**US-003 to US-006**: [Similar format]

---

## 3. SPRINT 2 (TUẦN 2) - FRONTEND CORE & UI

### 3.1 Sprint 2 Overview

**Thời Gian**: Ngày 6-10  
**Mục Tiêu**: Xây dựng frontend core components và UI  
**User Stories**: US-007 to US-016 (10 stories)  
**Implementation Units**: FE-001 to FE-010 (10 units)  
**Nỗ Lực Tổng**: ~70 giờ  

### 3.2 Chi Tiết Unit & Dependencies

**DAY 6: HTML & CSS Foundation**

| Unit | Tên | Nỗ Lực | Phụ Thuộc |
|------|------|--------|-----------|
| FE-001 | HTML Structure | 6h | INF-002 |
| FE-002 | CSS & Bootstrap | 8h | FE-001 |

**DAY 7-8: Core Components**

| Unit | Tên | Nỗ Lực | Phụ Thuộc |
|------|------|--------|-----------|
| FE-003 | Search Component | 7h | FE-001, BE-002 |
| FE-004 | Weather Display | 6h | FE-003, BE-002 |
| FE-005 | Favorites | 8h | FE-004 |
| FE-006 | Alerts Component | 6h | FE-004, BE-003 |
| FE-007 | History Chart | 8h | BE-005, FE-002 |
| FE-008 | Forecast Display | 6h | FE-004, BE-004 |

**DAY 9: Advanced Features**

| Unit | Tên | Nỗ Lực | Phụ Thuộc |
|------|------|--------|-----------|
| FE-009 | Offline Indicator | 5h | FE-004, SW-001 |
| FE-010 | Language Switcher | 6h | FE-001 |

**DAY 10: Integration & Testing**

- [ ] Tất cả components render đúng
- [ ] Navigation giữa pages hoạt động
- [ ] Data flow từ API tới UI đúng
- [ ] Responsive design tested (mobile, tablet, desktop)

### 3.3 Hướng Dẫn Lập Trình Sprint 2

#### 3.3.1 FE-001: HTML Structure (6 giờ)

**Semantic HTML5**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Weather App</title>
  <link rel="manifest" href="/manifest.json">
</head>
<body>
  <header>
    <nav>
      <h1>Weather App</h1>
      <button id="lang-switcher">EN/VI</button>
      <button id="theme-toggle">🌙/☀️</button>
    </nav>
  </header>

  <main>
    <section id="search">
      <input id="city-input" placeholder="Enter city...">
      <button id="search-btn">Search</button>
      <div id="search-suggestions"></div>
    </section>

    <section id="current-weather"></section>
    <section id="alerts"></section>
    <section id="forecast"></section>
    <section id="history"></section>
    <section id="favorites"></section>
  </main>

  <footer>
    <p>Data from OpenWeatherMap</p>
  </footer>

  <script src="/index.js"></script>
</body>
</html>
```

**Accessibility (WCAG 2.1 AA)**:
- [x] Semantic HTML tags
- [x] ARIA labels cho interactive elements
- [x] Color contrast ≥ 4.5:1
- [x] Keyboard navigation support

#### 3.3.2 FE-003: Search Component (7 giờ)

**Implementation**:
```javascript
class SearchComponent {
  constructor(apiClient) {
    this.api = apiClient;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Debounce input (wait 300ms after typing stops)
    const input = document.getElementById('city-input');
    input.addEventListener('input', debounce((e) => {
      this.showSuggestions(e.target.value);
    }, 300));

    // Enter key or button click
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.search(input.value);
    });
    document.getElementById('search-btn').onclick = () => {
      this.search(input.value);
    };
  }

  async showSuggestions(query) {
    if (query.length < 2) return;
    
    try {
      const suggestions = await this.api.validateCity(query);
      this.renderSuggestions(suggestions);
    } catch (error) {
      console.error('Suggestion error:', error);
    }
  }

  async search(city) {
    try {
      const weather = await this.api.getWeather(city);
      this.emit('weather-selected', weather);
    } catch (error) {
      this.showError('City not found');
    }
  }

  renderSuggestions(suggestions) {
    // Render dropdown list
  }
}
```

**Acceptance Criteria**:
- [x] Suggestions appear sau 2 ký tự
- [x] Debounce API calls (max 1 request mỗi 300ms)
- [x] Fuzzy matching hoạt động
- [x] Keyboard navigation (arrow up/down, enter)
- [x] Click suggestion triggers search

#### 3.3.3 FE-007: History Chart (8 giờ)

**Chart.js Implementation**:
```javascript
class HistoryChart {
  constructor() {
    this.chart = null;
  }

  async loadData(city, days = 7) {
    const data = await api.getHistory(city, days);
    this.renderChart(data);
  }

  renderChart(data) {
    const ctx = document.getElementById('history-canvas').getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Temperature (°C)',
            data: data.map(d => d.temperature),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          },
          {
            label: 'Humidity (%)',
            data: data.map(d => d.humidity),
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { title: { display: true, text: 'Temperature (°C)' } },
          y1: { 
            position: 'right',
            title: { display: true, text: 'Humidity (%)' }
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        }
      }
    });
  }
}
```

**Acceptance Criteria**:
- [x] Chart renders từ 7-day data
- [x] Responsive (scales to container width)
- [x] Hover tooltips show exact values
- [x] Render time < 2 giây
- [x] Multiple metrics (temp, humidity, wind)

### 3.4 User Stories - Sprint 2

**US-007: Display Current Weather**
- User thấy nhiệt độ, điều kiện, độ ẩm, tốc độ gió

**US-008: View 7-Day History**
- User xem biểu đồ xu hướng 7 ngày

**US-009: View 5-Day Forecast**
- User xem dự báo 5 ngày tới

**US-010 to US-016**: [Similar user stories]

---

## 4. SPRINT 3 (TUẦN 3) - OFFLINE & ADVANCED FEATURES

### 4.1 Sprint 3 Overview

**Thời Gian**: Ngày 11-15  
**Mục Tiêu**: Offline support, advanced features, optimization  
**User Stories**: US-017 to US-024 (8 stories)  
**Implementation Units**: SW-001, SW-002, BE-006, BE-007, BE-008 (5 units)  
**Nỗ Lực Tổng**: ~30 giờ  

### 4.2 Chi Tiết Unit & Dependencies

| Unit | Tên | Nỗ Lực | Phụ Thuộc |
|------|------|--------|-----------|
| SW-001 | Service Worker | 8h | FE-001, BE-001 |
| SW-002 | i18n System | 5h | FE-001 |
| BE-006 | API Routes | 6h | BE-002/003/004/005 |
| BE-007 | Security | 4h | BE-001 |
| BE-008 | Error Handling | 5h | BE-001 |

### 4.3 Hướng Dẫn Lập Trình Sprint 3

#### 4.3.1 SW-001: Service Worker (8 giờ)

**Service Worker Pattern**:
```javascript
// public/service-worker.js

const CACHE_NAME = 'weather-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/index.js',
  '/manifest.json'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch - stale-while-revalidate for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    // API requests: stale-while-revalidate
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
          .catch(() => cached);
        return cached || fetched;
      })
    );
  } else {
    // Static assets: cache-first
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
  }
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

**Acceptance Criteria**:
- [x] Service Worker registers successfully
- [x] Offline mode works (cache-first for static)
- [x] API cache updates in background
- [x] Cache size < 50MB
- [x] Old caches cleaned up

#### 4.3.2 SW-002: i18n System (5 giờ)

**Translation Files**:
```json
// src/i18n/en.json
{
  "app.title": "Weather App",
  "search.placeholder": "Enter city name...",
  "weather.temperature": "Temperature",
  "weather.humidity": "Humidity",
  "weather.wind": "Wind Speed",
  "alert.cold": "Cold Alert",
  "alert.heat": "Heat Alert",
  "alert.wind": "Wind Alert",
  "alert.humidity": "Humidity Alert"
}

// src/i18n/vi.json
{
  "app.title": "Ứng Dụng Thời Tiết",
  "search.placeholder": "Nhập tên thành phố...",
  "weather.temperature": "Nhiệt độ",
  "weather.humidity": "Độ ẩm",
  "weather.wind": "Tốc độ gió",
  "alert.cold": "Cảnh báo lạnh",
  "alert.heat": "Cảnh báo nóng",
  "alert.wind": "Cảnh báo gió",
  "alert.humidity": "Cảnh báo độ ẩm"
}
```

**i18n Implementation**:
```javascript
class i18n {
  constructor() {
    this.locale = localStorage.getItem('locale') || 'en';
    this.messages = {};
  }

  async load(locale) {
    const response = await fetch(`/i18n/${locale}.json`);
    this.messages = await response.json();
    this.locale = locale;
    localStorage.setItem('locale', locale);
  }

  t(key) {
    return this.messages[key] || key;
  }

  setLocale(locale) {
    return this.load(locale).then(() => {
      this.updateDOM();
    });
  }

  updateDOM() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });
  }
}
```

**Acceptance Criteria**:
- [x] EN/VI translations complete
- [x] Language switcher updates all text
- [x] Selection persists (localStorage)
- [x] Date formatting lokalized (Intl API)

#### 4.3.3 BE-007: Security Implementation (4 giờ)

**Security Measures**:
```javascript
// middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const securityMiddleware = [
  // Helmet: Security headers
  helmet(),

  // CORS: Restrict origins
  cors({
    origin: ['https://weather-app.vercel.app', 'http://localhost:3000'],
    credentials: false,
    methods: ['GET', 'POST']
  }),

  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests'
  })
];

module.exports = securityMiddleware;
```

**Acceptance Criteria**:
- [x] Helmet headers configured
- [x] CORS whitelist applied
- [x] Rate limiting active
- [x] API key never exposed
- [x] Input validation working

### 4.4 User Stories - Sprint 3

**US-017: Offline Mode**
- User can view cached weather offline
- Data refreshes when reconnected

**US-018: Language Support (EN/VI)**
- User switches language
- All content translates

**US-019 to US-024**: [Additional features]

---

## 5. PHỤ THUỘC & SEQUENCING

### 5.1 Critical Path (Đường dẫn tới tiêu chuẩn)

```
INF-001 (Vercel Setup)
    ↓
DB-001 (Schema Design)
    ↓ & ↓
BE-001 (Express) & INF-003 (DB Connection)
    ↓
BE-002 (Weather Service)
    ↓ & ↓
BE-003/004/005 (Alert/Forecast/Cache)
    ↓
BE-006 (API Routes) → Sprint 3
    ↓
FE-003 (Search Component) → depends on BE-002
    ↓
FE-004/005/006/007/008 (Other Components)
    ↓
SW-001 (Service Worker)
    ↓
DEPLOYMENT
```

### 5.2 Parallel Work Opportunities

**Sprint 1**:
- INF-001, INF-002, DB-001 → Song song (0 phụ thuộc)
- BE-002, BE-003, BE-004, BE-005 → Song song (cùng phụ thuộc)

**Sprint 2**:
- FE-003, FE-004, FE-005, FE-006, FE-007, FE-008 → Song song (cùng deps)

**Sprint 3**:
- SW-001, SW-002, BE-006, BE-007, BE-008 → Hầu hết song song

---

## 6. TIÊU CHÍ CHẤP NHẬN (SPRINT-LEVEL)

### 6.1 Sprint Completion Criteria

**Code Quality**:
- [ ] ≥80% code coverage (unit tests)
- [ ] 0 ESLint errors, <10 warnings
- [ ] 0 security vulnerabilities
- [ ] All code reviewed & approved

**Performance**:
- [ ] Page load: <3 seconds
- [ ] Search: <1 second (cache)
- [ ] Chart render: <2 seconds
- [ ] Memory usage: <50MB

**Functionality**:
- [ ] All sprint user stories implemented
- [ ] All acceptance criteria met
- [ ] Integration tests passing
- [ ] Manual testing completed

**Documentation**:
- [ ] Code comments added
- [ ] API docs updated
- [ ] User manual updated
- [ ] Migration guide (if needed)

---

## 7. RỦI RO & GIẢM THIỂU

### 7.1 Rủi Ro Chính

| Rủi Ro | Xác Suất | Tác Động | Giảm Thiểu |
|--------|----------|----------|-----------|
| External API rate limits | Medium | High | Cache aggressively, fallback |
| Database connection issues | Low | Critical | Connection pooling, health checks |
| Service Worker bugs (offline) | Medium | High | Comprehensive testing, monitoring |
| i18n translation incomplete | Low | Medium | External translator, review process |
| Performance degradation | Medium | High | Profiling, optimization reserve time |

### 7.2 Kế Hoạch Dự Phòng

**If external API fails**:
- Use cached data (30-day retention)
- Show "data may be outdated" warning
- Retry with exponential backoff

**If database becomes slow**:
- Implement query caching
- Add read-only replica
- Optimize indexes further

**If offline mode breaks**:
- Clear Service Worker cache
- Force re-download
- Provide fallback (basic view only)

---

## 8. ĐỊNH NGHĨA DONE (DoD) CHI TIẾT

### 8.1 Code

```
- [ ] Feature implemented per acceptance criteria
- [ ] No console.error or console.warn (except intentional)
- [ ] No commented-out code
- [ ] Follows naming conventions (camelCase, PascalCase)
- [ ] DRY principle applied
- [ ] Comments for complex logic
- [ ] Constants extracted (no magic numbers)
```

### 8.2 Testing

```
- [ ] Unit tests written (≥80% coverage)
- [ ] Tests passing locally & in CI
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Manual testing completed
- [ ] Responsive design tested (3+ screen sizes)
```

### 8.3 Review & Integration

```
- [ ] Code review approved (1+ reviewers)
- [ ] Feedback addressed
- [ ] Branch rebased onto develop
- [ ] No merge conflicts
- [ ] Merged via Pull Request (not force-push)
```

### 8.4 Documentation

```
- [ ] README updated (if needed)
- [ ] API docs updated (if needed)
- [ ] Inline comments added
- [ ] Git commit messages clear
- [ ] No debug console.logs remaining
```

---

## 9. TIMELINE TỔNG HỢPDP

| Phase | Tuần | Ngày | Sự Kiện | Status |
|-------|------|------|--------|--------|
| Sprint 1 | 1 | 1-5 | Backend, Database, Infra | Ready |
| Checkpoint | 1 | 5 | Sprint 1 Review | |
| Sprint 2 | 2 | 6-10 | Frontend Core, UI | |
| Checkpoint | 2 | 10 | Sprint 2 Review | |
| Sprint 3 | 3 | 11-15 | Offline, i18n, Deploy | |
| Checkpoint | 3 | 15 | Sprint 3 Review | |
| Stabilization | 3-4 | 16-18 | Bug fixes, optimization | |
| Production Deploy | 4 | 19 | Live deployment | |

---

## 10. METRICS & REPORTING

### 10.1 Sprint Metrics

**Burn-Down Chart**:
- Estimated hours vs. Completed hours (daily update)
- Target: Straight line từ ~60h → 0h (Sprint 1)

**Velocity**:
- Completed story points / Sprint duration
- Sprint 1: ~15 points / 5 days = 3 points/day

**Code Coverage**:
- Target: ≥80% per sprint
- Tracked by CI/CD (codecov)

### 10.2 Quality Gates

**Before Merge to Develop**:
- [ ] CI tests passing
- [ ] Code coverage ≥80%
- [ ] No critical security issues
- [ ] 1+ code review approvals

**Before Sprint Release**:
- [ ] All sprint stories "Done"
- [ ] Regression tests passing
- [ ] Performance targets met
- [ ] Documentation updated

---

**Phiên Bản Tài Liệu**: 1.0  
**Cập Nhật Lần Cuối**: 2026-09-24  
**Giai Đoạn Tiếp Theo**: Code Generation (CONSTRUCTION)
