# Monitoring & Alerting Setup Guide

**Application:** Weather App  
**Setup Date:** September 24, 2026  
**Monitoring Stack:** Sentry + Datadog + Pino

---

## Quick Start

### 1. Sentry Setup (Error Tracking)

**Step 1: Create Sentry Account**
- Go to https://sentry.io/signup/
- Create organization: "Weather App Company"
- Create project: "weather-app-prod"

**Step 2: Get DSN**
- Navigate to Settings → Projects → weather-app-prod
- Copy Client Key (DSN)
- Format: `https://key@sentry.io/project-id`

**Step 3: Configure Environment Variable**
```bash
# Vercel CLI
vercel env add SENTRY_DSN "https://key@sentry.io/project-id"

# Or manually in vercel.json
"env": {
  "SENTRY_DSN": "@sentry_dsn"
}
```

**Step 4: Verify Integration**
```javascript
// Test error reporting
import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });

try {
  throw new Error("Test error");
} catch (e) {
  Sentry.captureException(e);
}
```

**Sentry Alert Rules:**
- [ ] Alert on new issue
- [ ] Alert on spike (> 100% increase in 1 hour)
- [ ] Alert on deployment regression

**Sentry Dashboard:**
```
https://sentry.io/organizations/weather-app/
```

---

### 2. Datadog Setup (APM & Metrics)

**Step 1: Create Datadog Account**
- Go to https://www.datadoghq.com/
- Sign up for free trial
- Select "Node.js" as primary language

**Step 2: Get API Key**
- Navigate to Integrations → APIs
- Copy API Key
- Copy Application Key

**Step 3: Configure Environment Variables**
```bash
vercel env add DATADOG_API_KEY "your_api_key"
vercel env add DATADOG_SITE "datadoghq.com"  # or .eu for EU
```

**Step 4: Install Datadog Tracer**
```bash
npm install --save dd-trace
```

**Step 5: Initialize in server.js**
```javascript
// At very top of src/server.js
import tracer from 'dd-trace';
tracer.init({
  env: process.env.DATADOG_ENVIRONMENT,
  logInjection: true
});
```

**Datadog Metrics to Track:**

```
1. API Endpoints
   - weather.get_latency
   - forecast.get_latency
   - alerts.get_latency
   - history.get_latency

2. Cache Performance
   - cache.hit_rate
   - cache.memory_usage
   - cache.entries_count

3. Database
   - db.connections_open
   - db.query_latency
   - db.pool_exhaustion

4. Errors
   - errors.total_count
   - errors.rate
   - errors.by_endpoint
```

**Datadog Dashboard:**
```
https://app.datadoghq.com/dashboard/weather-app
```

**Create Custom Dashboard:**
1. Navigate to Dashboards → New Dashboard
2. Add widgets:
   - API response time P95
   - Error rate (%)
   - Cache hit rate (%)
   - Active database connections
   - Memory usage

---

### 3. Pino Logging Setup

**Already Configured:** Pino is integrated in `src/server.js`

**Log Levels for Production:**
```javascript
// src/server.js
app.use(pinoHttp({
  level: process.env.LOG_LEVEL || 'info',  // Set to 'info' in production
  transport: {
    target: 'pino-cloud-transport',
    options: {
      key: process.env.CLOUD_LOGGING_KEY,
      project_id: process.env.GCP_PROJECT_ID
    }
  }
}));
```

**Log Format (JSON):**
```json
{
  "level": 30,
  "time": "2026-09-24T12:00:00.000Z",
  "pid": 12345,
  "hostname": "weather-app",
  "req": {
    "id": "req-123",
    "method": "GET",
    "url": "/api/weather?city=Tokyo",
    "remoteAddress": "203.0.113.1"
  },
  "res": {
    "statusCode": 200,
    "responseTime": 42
  },
  "msg": "request completed"
}
```

**View Logs:**
```bash
# Vercel logs
vercel logs [--follow]

# Datadog logs
# https://app.datadoghq.com/logs
```

---

## Alert Configuration

### Critical Alerts (Immediate Action)

**1. Service Unavailable**
```
Trigger: HTTP 5xx error rate > 5% for 5 minutes
Action: Page on-call engineer
Notification: Slack, PagerDuty, SMS
```

**2. Database Connection Failed**
```
Trigger: Database connection count = 0
Action: Page on-call engineer immediately
Notification: Slack, PagerDuty, Phone
```

**3. API Key Invalid**
```
Trigger: OpenWeather API returns 401
Action: Alert DevOps team
Notification: Slack, Email
```

### High Priority Alerts (1 hour)

**1. High Error Rate**
```
Trigger: Error rate > 1% for 10 minutes
Action: Create incident, notify team
Notification: Slack
```

**2. Cache Hit Rate Degradation**
```
Trigger: Cache hit rate < 80% for 15 minutes
Action: Investigate cache issues
Notification: Slack
```

**3. API Latency**
```
Trigger: P95 response time > 500ms for 10 minutes
Action: Monitor, investigate if > 1s
Notification: Slack
```

### Medium Priority Alerts (4 hours)

**1. Memory Usage**
```
Trigger: Memory > 500MB for 5 minutes
Action: Monitor for growth
Notification: Email
```

**2. Database Query Slow**
```
Trigger: P95 query time > 100ms for 15 minutes
Action: Review query optimization
Notification: Email
```

---

## Alert Configuration (Sentry)

**Step 1: Create Alert Rules**

Navigate to: Sentry → Alerts → Create Alert Rule

**Rule 1: High Error Volume**
```
If: The event's level is error OR fatal
And: The event rate of (count()) is > 100 per minute
Then: Send an alert
```

**Rule 2: Deployment Regression**
```
If: A new issue is created
And: First seen within deployment
Then: Send an alert with high priority
```

**Rule 3: Exception Spike**
```
If: Event count increased by > 100%
And: In the last 1 hour
Then: Send critical alert
```

**Step 2: Configure Notification Channels**

- [ ] Slack integration
  ```
  1. Sentry → Integrations → Slack
  2. Install to workspace
  3. Select channel: #alerts
  ```

- [ ] PagerDuty integration
  ```
  1. Sentry → Integrations → PagerDuty
  2. Add integration key
  3. Configure escalation policy
  ```

- [ ] Email notifications
  ```
  1. Sentry → Settings → Email
  2. Add team emails
  3. Set frequency
  ```

---

## Alert Configuration (Datadog)

**Step 1: Create Monitors**

Navigate to: Datadog → Monitors → New Monitor

**Monitor 1: High Error Rate**
```
Metric: trace.express.request.errors
Alert if: avg > 0.05 for last 5 minutes
```

**Monitor 2: Database Latency**
```
Metric: trace.pg.query.duration
Alert if: p95 > 50ms for last 10 minutes
```

**Monitor 3: API Response Time**
```
Metric: trace.express.request.duration
Alert if: p95 > 500ms for last 10 minutes
```

**Step 2: Configure Notifications**

```
Notification Channels:
- Slack: @weather-oncall
- PagerDuty: Weather App Service
- Email: devops@company.com
- SMS: [On-call number]
```

---

## Health Check Monitoring

### Synthetic Monitoring Setup

**Create Health Check Job (Datadog):**

```bash
# Create synthetic test for /health endpoint
# Datadog → Synthetics → New Test → API Test

POST https://weather-app.vercel.app/health
Expected response: 200 OK
Check interval: 1 minute
Locations: US (multiple), Europe, Asia
```

**Create Health Check Job (Uptime Robot):**

1. Go to https://uptimerobot.com/
2. Create monitor:
   - URL: https://weather-app.vercel.app/health
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Locations: All
   - Alert after 2 failures

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-24T12:00:00Z",
  "environment": "production",
  "database": {
    "connected": true,
    "latency_ms": 5
  }
}
```

---

## Dashboard Setup

### Datadog Main Dashboard

Create dashboard with widgets:

**Row 1: System Health**
- [ ] Service uptime (%)
- [ ] Error rate (%)
- [ ] Health check status

**Row 2: Performance**
- [ ] API latency P50/P95/P99
- [ ] Cache hit rate (%)
- [ ] Database connection count

**Row 3: Traffic**
- [ ] Requests per second
- [ ] Unique users per hour
- [ ] Geographic distribution

**Row 4: Database**
- [ ] Query latency P95
- [ ] Connection pool usage
- [ ] Query count by endpoint

**Row 5: Errors**
- [ ] Error count by type
- [ ] Error rate over time
- [ ] Top error messages

### Create Shared Dashboard URL

```
1. Datadog → Dashboards → Your Dashboard
2. Click "Share" → "Create Shareable Dashboard"
3. Generate public URL
4. Share with: Team, Status Page, Stakeholders
```

---

## On-Call Rotation Setup

### PagerDuty Integration

**Step 1: Create Service**
```
1. PagerDuty → Services → New Service
2. Name: Weather App
3. Escalation Policy: [Your policy]
4. Integration: Datadog, Sentry
```

**Step 2: Add Schedule**
```
1. PagerDuty → Schedules → New Schedule
2. Name: Weather App On-Call
3. Time zone: [Your timezone]
4. Add team members
5. Rotation: Weekly/Bi-weekly
```

**Step 3: Configure Notification**
```
- Alert method: SMS + Email + Phone
- Escalate after: 30 minutes
- Pages responders: On-call + Manager
```

---

## Testing Alerts

**Test Sentry Alert:**
```bash
# Trigger test error
curl https://weather-app.vercel.app/test-error

# Verify alert in Slack/Email within 30 seconds
```

**Test Datadog Alert:**
```bash
# Generate high error rate
for i in {1..100}; do
  curl https://weather-app.vercel.app/api/invalid-endpoint
done

# Check if alert triggered within 5 minutes
```

**Test Health Check:**
```bash
# Verify /health endpoint
curl -i https://weather-app.vercel.app/health

# Should return 200 with "status": "ok"
```

---

## Metrics to Track

| Metric | Target | Alert If | Dashboard |
|--------|--------|----------|-----------|
| Error Rate | < 0.1% | > 1% | Datadog |
| API Latency P95 | < 500ms | > 1s | Datadog |
| Cache Hit Rate | > 95% | < 80% | Datadog |
| Uptime | > 99.9% | Down | UptimeRobot |
| DB Latency P95 | < 50ms | > 100ms | Datadog |
| Memory Usage | < 300MB | > 500MB | Datadog |

---

## Maintenance Tasks

**Daily:**
- [ ] Check Sentry for new issues
- [ ] Review error trends
- [ ] Verify all alerts functioning

**Weekly:**
- [ ] Review metrics dashboard
- [ ] Check cache hit rate
- [ ] Analyze slow queries
- [ ] Update runbooks if needed

**Monthly:**
- [ ] Test alert escalation
- [ ] Review SLA compliance
- [ ] Plan capacity upgrades
- [ ] Share metrics with stakeholders

---

**Setup Completed By:** ____________  
**Date:** ____________  
**Reviewed By:** ____________
