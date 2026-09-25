# 🌤️ Weather App - AI-DLC Project

**Multi-language Weather Application with Real-time Data** | Powered by Node.js + Express + PostgreSQL

---

## 📋 Overview

Modern weather application providing real-time weather data, 5-day forecasts, weather alerts, and historical data. Features include:

- 🌍 **Real-time Weather** - Current conditions by city using OpenWeather API
- 📅 **5-Day Forecast** - Detailed weather predictions
- ⚠️ **Weather Alerts** - Automatic detection of extreme conditions
- 📊 **Historical Data** - 7-day weather history with trends
- 💾 **User Preferences** - Personalized settings (units, themes, locations)
- 🌐 **Bilingual UI** - English & Korean language support
- 📱 **PWA Ready** - Progressive Web App with offline support
- 🚀 **Serverless Deployment** - Vercel with auto-scaling

---

## 🎯 Key Features

| Feature | Details |
|---------|---------|
| **API** | REST endpoints with caching |
| **Database** | PostgreSQL for user data & history |
| **Frontend** | Vanilla JS + Bootstrap 5 (responsive) |
| **Performance** | Multi-layer caching (memory + DB) |
| **Security** | Helmet.js headers, CORS, rate limiting |
| **Monitoring** | Sentry error tracking, Pino logging |

---

## 📁 Project Structure

```
Wether-AIDLC/                          ← Root folder (GitHub)
├── vercel.json                        ← Vercel deployment config ✨
├── .gitignore                         ← Git ignore rules
├── README.md                          ← This file
├── CLAUDE.md                          ← Claude Code settings
│
├── claude-weather-app/                ← Main application folder
│   ├── package.json                   ← Dependencies
│   ├── src/
│   │   ├── server.js                  ← Express server entry point
│   │   ├── api/                       ← API endpoints
│   │   │   ├── weather.js             ← Current weather endpoint
│   │   │   ├── forecast.js            ← 5-day forecast
│   │   │   ├── alerts.js              ← Weather alerts
│   │   │   ├── history.js             ← Historical data
│   │   │   ├── preferences.js         ← User preferences
│   │   │   └── validate-city.js       ← City validation
│   │   ├── services/                  ← Business logic
│   │   │   ├── WeatherService.js      ← OpenWeather API integration
│   │   │   ├── ForecastService.js     ← Forecast processing
│   │   │   ├── AlertService.js        ← Alert detection
│   │   │   └── CacheService.js        ← Caching layer
│   │   └── middleware/                ← Custom middleware
│   │
│   ├── public/                        ← Frontend files
│   │   ├── index.html                 ← Main HTML
│   │   ├── js/
│   │   │   ├── app.js                 ← Main application logic
│   │   │   ├── api-client.js          ← API communication
│   │   │   ├── i18n.js                ← Internationalization (EN/KO)
│   │   │   └── sw.js                  ← Service Worker
│   │   ├── styles/
│   │   │   ├── main.css               ← Main styles
│   │   │   └── responsive.css         ← Mobile responsive
│   │   └── manifest.json              ← PWA manifest
│   │
│   ├── tests/                         ← Test files
│   └── .env.example                   ← Environment variables template
│
├── requirements/
│   └── requirements-en.md             ← Project requirements
│
└── Claude outputs/                    ← Claude-generated files (ignored)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or later
- npm or yarn
- PostgreSQL 12+
- OpenWeather API key

### 1️⃣ Installation

```bash
# Clone repository
git clone https://github.com/nhii/Wether-AIDLC.git
cd Wether-AIDLC/claude-weather-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### 2️⃣ Environment Variables

Create `.env` file in `claude-weather-app/`:

```env
# OpenWeather API
OPENWEATHER_API_KEY=your_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/weather_db

# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Optional
SENTRY_DSN=your_sentry_dsn
CACHE_TTL=3600
```

### 3️⃣ Local Development

```bash
# Start development server (with auto-reload)
npm run dev

# Run tests
npm run test

# Run linter
npm run lint

# Full build (lint + test)
npm run build
```

The app will be available at `http://localhost:3000`

---

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Returns server status and database connectivity.

### Weather Endpoints

**Get Current Weather**
```http
GET /api/weather?city=HoChiMinh
```

**Get 5-Day Forecast**
```http
GET /api/forecast?city=Seoul
```

**Get Weather Alerts**
```http
GET /api/alerts?city=Bangkok
```

**Get Historical Data**
```http
GET /api/history?city=Tokyo&days=7
```

**Get/Set User Preferences**
```http
GET /api/preferences/:userId
POST /api/preferences/:userId
```

**Validate City**
```http
GET /api/validate-city?city=London
```

---

## 🌐 Features & Usage

### Language Support
- English (EN)
- Korean (한국어 / KO)

Toggle in UI via language selector (top-right corner).

### Caching Strategy
- **Memory Cache**: 3600s (1 hour)
- **Database Cache**: Persistent for historical data
- **Service Worker**: Offline capability

### Bilingual Support
UI automatically detects browser language or uses user preference.

Files:
- `public/js/i18n.js` - Translation logic
- `public/i18n/` - Language JSON files

---

## 🔧 Deployment

### Deploy to Vercel

**Step 1: Push to GitHub**
```bash
git add .
git commit -m "feat: Weather app deployment"
git push origin main
```

**Step 2: Vercel Auto-Deploy**
Vercel automatically detects changes on GitHub and triggers deployment.

**Step 3: Set Environment Variables**
1. Go to https://vercel.com/dashboard
2. Select `weather-app` project
3. Settings → Environment Variables
4. Add:
   ```
   OPENWEATHER_API_KEY = your_api_key
   DATABASE_URL = your_database_url
   NODE_ENV = production
   LOG_LEVEL = info
   PORT = 3000
   ```

**Step 4: Verify Deployment**
```bash
# Health check
curl https://your-app.vercel.app/health

# API test
curl "https://your-app.vercel.app/api/weather?city=HoChiMinh"
```

### Vercel Configuration

File: `vercel.json` (at project root)

Key settings:
- **buildCommand**: `cd claude-weather-app && npm install && npm run build`
- **Regions**: San Francisco, Iowa, Tokyo
- **Runtime**: Node.js 20.x
- **Serverless Functions**: Memory 1024MB, Timeout 30s

---

## 🧪 Testing

### Local Testing
```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

### API Testing
```bash
# Health endpoint
curl http://localhost:3000/health

# Weather endpoint
curl "http://localhost:3000/api/weather?city=HoChiMinh"

# Frontend
Open http://localhost:3000 in browser
```

### Testing Checklist
- [ ] Frontend loads at root path
- [ ] Language switcher works (EN/KO)
- [ ] Weather API returns data
- [ ] Alerts trigger correctly
- [ ] User preferences save
- [ ] Service Worker enables offline mode
- [ ] Responsive design works on mobile

---

## 🔍 Troubleshooting

### Issue: "Cannot find module 'express'"
**Solution**: Ensure dependencies are installed
```bash
cd claude-weather-app
npm install
```

### Issue: Database connection fails
**Solution**: Verify DATABASE_URL
```bash
# Test connection locally
psql $DATABASE_URL
```

### Issue: API returns 502 Bad Gateway (on Vercel)
**Solution**: Check environment variables in Vercel dashboard
- Verify `OPENWEATHER_API_KEY` is set
- Verify `DATABASE_URL` is valid
- Check build logs for errors

### Issue: Frontend shows 404
**Solution**: Verify Vercel rewrites configuration in `vercel.json`
```json
"rewrites": [
  {"source": "/api/:path*", "destination": "/api/:path*"},
  {"source": "/:path*", "destination": "/index.html"}
]
```

### Issue: CORS errors
**Solution**: Check CORS middleware in `src/server.js`
Should include:
```javascript
const cors = require('cors');
app.use(cors());
```

---

## 📊 Performance Tips

1. **Caching**: API responses cached for 1 hour
2. **Database**: Use connection pooling for Vercel
3. **Frontend**: Service Worker caches static assets
4. **Monitoring**: Sentry tracks errors in production

---

## 🔐 Security

- **Helmet.js**: Security headers
- **CORS**: Controlled cross-origin access
- **Rate Limiting**: Prevents API abuse
- **Environment Variables**: Sensitive data protected
- **Input Validation**: City name validation
- **HTTPS**: Required for production (Vercel default)

---

## 📚 Documentation

- **Requirements**: See `requirements/requirements-en.md`
- **API Details**: See endpoint examples in "API Endpoints" section above
- **Database Schema**: Check PostgreSQL initialization scripts
- **Frontend Code**: Comments in `public/js/app.js`

---

## 🛠️ Development Workflow

### Making Changes
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes in `claude-weather-app/src/`
3. Test locally: `npm run dev`
4. Run tests: `npm run test`
5. Commit: `git commit -m "feat: your feature"`
6. Push: `git push origin feature/your-feature`
7. Create Pull Request on GitHub

### Build Pipeline
1. **Local**: `npm run lint` → `npm run test`
2. **GitHub**: Automated checks (if configured)
3. **Vercel**: Automatic build & deployment on push to main

---

## 📦 Dependencies

### Main Dependencies
- **express**: Web framework
- **helmet**: Security headers
- **cors**: Cross-origin requests
- **pg**: PostgreSQL client
- **axios**: HTTP client
- **pino**: Structured logging
- **@sentry/node**: Error tracking

### Dev Dependencies
- **jest**: Testing framework
- **supertest**: HTTP assertions
- **eslint**: Code linting

See `package.json` for full list.

---

## 📞 Support & Issues

- **Build Issues**: Check Vercel build logs
- **API Issues**: Check server logs with `npm run dev`
- **Database Issues**: Verify PostgreSQL connection
- **Frontend Issues**: Check browser console (F12)

---

## 📄 License

Open source project.

---

## 🎯 Next Steps

1. ✅ Clone & install dependencies
2. ✅ Set up `.env` file with API keys
3. ✅ Run `npm run dev` to test locally
4. ✅ Deploy to Vercel (commit + push)
5. ✅ Set environment variables on Vercel
6. ✅ Test production endpoints

---

**Updated:** September 24, 2026  
**Status:** ✅ Production Ready

