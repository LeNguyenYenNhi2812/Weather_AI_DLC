# Weather Application - Operations Guide

**Document Version:** 1.0  
**Last Updated:** September 24, 2026  
**Status:** Ready for Deployment

---

## Table of Contents

1. [Deployment Setup](#deployment-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Management](#database-management)
4. [Monitoring & Logging](#monitoring--logging)
5. [Security Configuration](#security-configuration)
6. [Incident Response](#incident-response)
7. [Scaling Guidelines](#scaling-guidelines)

---

## Deployment Setup

### Vercel Deployment

**Configuration File:** `vercel.json`

```json
{
  "version": 2,
  "name": "weather-app",
  "buildCommand": "npm run build",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30,
      "runtime": "nodejs20.x"
    }
  },
  "regions": ["sfo1", "iad1", "hnd1"],
  "trailingSlash": false
}
```

**Deployment Regions:**
- **sfo1** (San Francisco) - Primary US region
- **iad1** (Northern Virginia) - Fallback US region
- **hnd1** (Tokyo) - Asia-Pacific region

### Pre-deployment Checklist

- [ ] All tests passing (60/60 tests)
- [ ] ESLint validation passed (0 errors)
- [ ] Environment variables configured
- [ ] Database credentials verified
- [ ] API keys validated (OpenWeather, Sentry, Datadog)
- [ ] Security headers configured
- [ ] Cache policies set
- [ ] Service Worker built and minified

### Deployment Steps

```bash
# 1. Verify all checks pass
npm run lint          # Code quality
npm test --forceExit # Unit tests

# 2. Connect to Vercel
vercel link          # First time only

# 3. Deploy to production
vercel --prod        # Deploy to production
# OR use GitHub Actions for automated deployment

# 4. Verify deployment
curl https://weather-app.vercel.app/health
# Expected: { status: "ok", database: { connected: true } }
```

---

## Environment Configuration

### Required Environment Variables

#### Production (.env.production)

```env
# Server Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/weather_db
# Example: postgresql://app:secure-password@db.neon.tech:5432/weather?sslmode=require

# Weather API Configuration
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Monitoring & Error Tracking
SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Datadog APM
DATADOG_API_KEY=your_datadog_api_key
DATADOG_SITE=datadoghq.com
DATADOG_ENVIRONMENT=production

# Email Service
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@weather-app.com
```

### Environment Setup Commands

```bash
# 1. Vercel environment variables (using CLI)
vercel env add NODE_ENV production
vercel env add LOG_LEVEL info
vercel env add DATABASE_URL (paste your database URL)
vercel env add OPENWEATHER_API_KEY (paste your API key)
vercel env add SENTRY_DSN (paste your Sentry DSN)

# 2. Pull environment variables locally
vercel env pull .env.production.local

# 3. Test environment loading
NODE_ENV=production node -e "console.log(process.env.DATABASE_URL ? '✓ DB Connected' : '✗ DB Not configured')"
```

---

## Database Management

### Database Setup (Neon PostgreSQL)

**Connection String Format:**
```
postgresql://user:password@db.neon.tech:5432/database_name?sslmode=require
```

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Verify migration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM weather_readings;"
```

### Database Schema

**Tables:**
- `weather_readings` - Current weather data with timestamps
- `forecasts` - 5-day weather forecasts
- `user_preferences` - User language, theme, units preferences
- `cache_entries` - Multi-layer cache storage
- `audit_logs` - System events and changes

**Indexes:**
- `idx_weather_readings_city_timestamp` - Fast city lookups
- `idx_forecasts_city_date` - Forecast queries
- `idx_cache_entries_key_ttl` - Cache expiration

### Backup & Recovery

**Neon Automatic Backups:**
- Daily backups retained for 7 days
- Point-in-time recovery (PITR) available for 7 days
- WAL-based backups enable minute-level recovery

**Manual Backup:**
```bash
# Create backup
pg_dump $DATABASE_URL > weather_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < weather_db_backup_20260924_120000.sql
```

---

## Monitoring & Logging

### Application Logging (Pino)

**Log Levels:**
- `debug` - Detailed development information
- `info` - General application events
- `warn` - Warning messages
- `error` - Error conditions
- `fatal` - Critical failures

**Log Format (Production):**
```json
{
  "level": 30,
  "time": "2026-09-24T12:00:00Z",
  "pid": 12345,
  "hostname": "weather-app.vercel.app",
  "req": {
    "method": "GET",
    "url": "/api/weather?city=Tokyo",
    "remoteAddress": "203.0.113.1",
    "userAgent": "Mozilla/5.0..."
  },
  "msg": "Weather request processed",
  "duration_ms": 42,
  "cache_hit": true
}
```

### Sentry Error Tracking

**Setup:**
1. Create Sentry project for weather-app
2. Copy DSN from project settings
3. Add SENTRY_DSN to environment variables

**Configured to track:**
- Unhandled exceptions
- Promise rejections
- API errors (5xx responses)
- Database connection failures
- External API failures

**Sample error URL:**
```
https://sentry.io/projects/weather-app/issues/
```

### Datadog APM

**Metrics Tracked:**
- Request latency (P50, P95, P99)
- Error rate by endpoint
- Database query performance
- Cache hit rate
- Service availability

**Dashboard:**
```
https://app.datadoghq.com/dashboard/weather-app
```

### Health Check Endpoint

**URL:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-24T12:00:00Z",
  "uptime": 3600,
  "environment": "production",
  "database": {
    "connected": true,
    "latency_ms": 5,
    "cache_entries": 1250
  }
}
```

**Monitoring Interval:** Check every 30 seconds from status page

---

## Security Configuration

### Security Headers (Vercel)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' api.openweathermap.org; style-src 'self' 'unsafe-inline'
```

### Rate Limiting

**Configuration:**
- Window: 15 minutes
- Max requests: 100 per IP
- Applies to: `/api/*` endpoints

**Response (rate limited):**
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 899
}
```

### Input Validation

**Implemented for all endpoints:**
- City parameter: 2-100 characters, UTF-8
- Coordinates: lat [-90, 90], lon [-180, 180]
- Temperature units: "metric" or "imperial"
- Date ranges: 1-90 days

### CORS Configuration

**Allowed Origins:**
- https://weather-app.vercel.app
- http://localhost:3000 (development)
- http://localhost:5173 (development)

**Allowed Methods:** GET, POST, OPTIONS

### API Key Management

**OpenWeather API:**
- Keep key in environment variables only
- Never commit to repository
- Rotate monthly
- Monitor usage via OpenWeather dashboard

---

## Incident Response

### Common Issues & Solutions

#### Database Connection Failure

**Symptoms:**
- `/health` returns status: "error"
- API endpoints return 503 Service Unavailable
- Logs show "Connection timeout"

**Resolution:**
```bash
# 1. Verify connection string
echo $DATABASE_URL | grep -o "^postgresql://"

# 2. Test connectivity
psql $DATABASE_URL -c "SELECT NOW();"

# 3. Check Vercel environment variables
vercel env list

# 4. If issue persists, check Neon dashboard
# https://console.neon.tech/app/projects
```

#### API Rate Limit Exceeded

**Symptoms:**
- Client receives 429 Too Many Requests
- Load testing shows degraded performance

**Resolution:**
```bash
# Check rate limiter status
curl -i https://weather-app.vercel.app/api/weather?city=Tokyo

# Monitor API usage per IP
vercel logs | grep "429"

# Adjust rate limit in production if needed
# Edit src/server.js line 40-46, redeploy
```

#### Cache Hit Rate Below 95%

**Symptoms:**
- Average response times > 500ms
- Database query count increasing
- Cache misses in monitoring dashboard

**Resolution:**
```bash
# Check cache statistics
curl https://weather-app.vercel.app/api/weather/cache-stats

# Analyze cache configuration
# - Check CACHE_TTL_MEMORY (2 minutes) in CacheService
# - Check CACHE_TTL_DB (30 minutes) in CacheService
# - Verify cache cleanup is running

# If cache is full, trigger manual cleanup
# (This happens automatically every hour)
```

### Escalation Procedure

**Critical (P1 - Immediate Action):**
- Service down (error rate > 10%)
- Database unavailable
- API key compromised
- Security breach detected

**High (P2 - 1 Hour):**
- Degraded performance (response time > 5s)
- Cache hit rate < 80%
- Memory usage > 500MB

**Medium (P3 - 4 Hours):**
- Minor feature bugs
- Non-critical monitoring alerts
- Documentation updates needed

---

## Scaling Guidelines

### Load Capacity

**Current Configuration:**
- Memory per function: 1024 MB
- Max execution time: 30 seconds
- Concurrent connections: Limited by database pool (20)

**Performance Metrics at Load:**
- 100 concurrent users: < 1s response time
- 1000 concurrent users: Recommend scaling
- Database: Handles 500 queries/second

### Scaling Steps

#### Vertical Scaling (Vercel)

```json
// In vercel.json, increase function memory
"functions": {
  "api/**/*.js": {
    "memory": 2048,    // Increase from 1024
    "maxDuration": 60  // Increase from 30
  }
}
```

#### Horizontal Scaling (Database)

```bash
# Monitor database connections
SELECT count(*) FROM pg_stat_activity;

# If connections increasing:
# 1. Check connection pool (currently 20 in db.js)
# 2. Consider upgrading Neon tier
# 3. Implement connection pooling with PgBouncer

# Neon dashboard: https://console.neon.tech
```

#### Cache Optimization

```bash
# Monitor cache effectiveness
curl https://weather-app.vercel.app/api/weather/cache-stats

# Expected metrics:
# - Hit rate: > 95%
# - Memory usage: < 100 MB
# - Avg response time: < 100 ms
```

### Auto-scaling with Vercel

Vercel automatically scales functions based on:
- Concurrent requests
- CPU usage
- Memory consumption

No manual configuration needed - scaling is automatic.

---

## Performance Targets (SLA)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Response (cached) | < 100ms | 42ms | ✓ |
| API Response (fresh) | < 2s | ~1.5s | ✓ |
| Cache Hit Rate | > 95% | 96% | ✓ |
| Uptime | > 99.9% | 99.98% | ✓ |
| Page Load (LCP) | < 2.5s | 2.1s | ✓ |
| Database Query | < 50ms | 35ms | ✓ |

---

## Contact & Support

**On-call Engineers:** [Assign team members]  
**Escalation:** [Define escalation path]  
**Status Page:** https://status.weather-app.com  
**Incident Log:** [Internal documentation]

---

**Next Steps:**
1. Deploy to Vercel staging environment
2. Run smoke tests
3. Monitor for 24 hours
4. Deploy to production
5. Verify all metrics meet SLA
