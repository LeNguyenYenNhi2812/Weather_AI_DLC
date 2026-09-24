# Weather Application 🌦️

Real-time weather application with offline support, bilingual interface (English/Vietnamese), and comprehensive alert system.

## Features

✅ **Real-time Weather Data** - Current conditions, forecasts, and historical data  
✅ **Offline Support** - Service Worker with stale-while-revalidate caching strategy  
✅ **Bilingual Interface** - English and Vietnamese with full i18n support  
✅ **Weather Alerts** - 4 severity levels (Cold, Heat, Wind, Humidity)  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Dark Mode** - Theme toggle for comfortable viewing  
✅ **Multi-layer Caching** - Memory, localStorage, database, and external API  
✅ **Performance Optimized** - <3s page load, <100ms cache response time  

## Project Structure

```
weather-app/
├── sql/                          # Database schema
│   └── 01-schema.sql            # PostgreSQL DDL
├── src/
│   ├── server.js                # Express server setup
│   ├── api/                     # API route handlers
│   │   ├── weather.js           # Weather endpoints
│   │   ├── forecast.js          # Forecast endpoints
│   │   ├── alerts.js            # Alert endpoints
│   │   ├── history.js           # History endpoints
│   │   ├── validate-city.js     # City validation
│   │   └── preferences.js       # User preferences
│   └── services/                # Business logic
│       ├── CacheService.js      # 4-layer caching
│       ├── WeatherService.js    # Weather data fetching
│       ├── AlertService.js      # Alert evaluation
│       └── ForecastService.js   # Forecast handling
├── public/
│   ├── index.html               # Main HTML
│   ├── sw.js                    # Service Worker
│   ├── manifest.json            # PWA manifest
│   ├── styles/
│   │   ├── main.css             # Main styles
│   │   └── responsive.css       # Responsive design
│   └── js/
│       ├── i18n.js              # Internationalization
│       ├── api-client.js        # API communication
│       └── app.js               # Main app logic
├── tests/                       # Test files
├── package.json                 # Dependencies
├── vercel.json                  # Vercel deployment config
└── .env.example                 # Environment template
```

## Technology Stack

**Backend:**
- Node.js 20.x
- Express.js 4.18
- PostgreSQL (Neon)
- Helmet (Security)
- CORS & Rate Limiting

**Frontend:**
- HTML5 Semantic Markup
- Bootstrap 5.3
- Chart.js (Data Visualization)
- Service Worker (Offline Support)
- Vanilla JavaScript (No frameworks)

**Deployment:**
- Vercel (Serverless)
- GitHub Actions (CI/CD)
- PostgreSQL Backups (WAL)

## Setup & Installation

### Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 14
- npm or yarn

### Local Development

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd weather-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Setup database**
   ```bash
   npm run db:migrate
   npm run db:seed  # Optional: seed sample data
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Building for Production

```bash
# Build
npm run build

# Lint check
npm run lint

# Preview production build
npm start
```

## API Endpoints

### Weather Endpoints

**Get Current Weather**
```
GET /api/weather?city=HoChiMinh&units=metric&lang=vi
```

**Get Forecast**
```
GET /api/forecast?city=HoChiMinh&units=metric&lang=vi
```

**Get Alerts**
```
GET /api/alerts?city=HoChiMinh&lang=vi
```

**Get Weather History**
```
GET /api/history?city=HoChiMinh&days=7
GET /api/history/aggregate?city=HoChiMinh&period=daily
```

**Validate City**
```
GET /api/validate-city?q=ho%20chi%20minh
POST /api/validate-city/bulk
GET /api/validate-city/coordinates?lat=10.77&lon=106.70
```

**User Preferences**
```
GET /api/preferences/:userId
PUT /api/preferences/:userId
POST /api/preferences/:userId/favorite-cities
DELETE /api/preferences/:userId/favorite-cities/:city
```

## Performance Targets

- **Page Load:** < 3 seconds
- **Cache Hit Response:** < 100ms
- **API Response:** < 2 seconds
- **Cache Hit Rate:** > 95%
- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy automatically on push

### Database Setup (Neon)

1. Create PostgreSQL database on Neon
2. Run migrations: `npm run db:migrate`
3. Update DATABASE_URL in Vercel

## Security Features

✅ Helmet.js for HTTP headers  
✅ CORS configuration  
✅ Rate limiting (100 req/15 min)  
✅ SQL injection prevention (parameterized queries)  
✅ API key management via backend proxy  
✅ HTTPS/TLS enforcement  
✅ CSP headers  

## Offline Support

The app includes a Service Worker that implements:
- **Cache-first** for static assets (CSS, JS, fonts)
- **Stale-while-revalidate** for API responses
- **Network-first** for HTML documents
- Automatic cleanup of expired cache entries

Works completely offline after first visit!

## Bilingual Support

Complete i18n system with:
- English (EN) and Vietnamese (VI)
- Locale-aware date/time formatting
- Local storage persistence
- RTL support ready

Switch languages via the language toggle in the navbar.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Create feature branch
2. Make changes with tests
3. Ensure 80%+ test coverage
4. Submit pull request
5. Code review required before merge

## License

MIT License - See LICENSE file for details

## Support & Contact

- Issues: Use GitHub Issues
- Email: support@weather-app.dev
- Docs: See `/docs` folder

## Changelog

### v1.0.0 (2026-09-24)
- Initial release
- Complete weather API
- Offline support
- Bilingual interface
- Progressive Web App ready

---

Built with ❤️ using AI-DLC (AI-Driven Development Lifecycle)  
Powered by OpenWeatherMap API
