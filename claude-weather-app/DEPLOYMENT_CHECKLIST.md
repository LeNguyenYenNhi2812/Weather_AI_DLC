# Deployment Checklist

**Project:** Weather Application  
**Deployment Date:** [Fill in]  
**Deployed By:** [Name]  
**Environment:** Production

---

## Phase 1: Pre-Deployment (24 hours before)

### Code Quality & Testing
- [ ] All unit tests passing (60/60)
  ```bash
  npm test -- --forceExit
  ```
- [ ] ESLint validation passed (0 errors)
  ```bash
  npm run lint
  ```
- [ ] No security vulnerabilities
  ```bash
  npm audit
  ```
- [ ] Code review completed
- [ ] Changelog updated

### Configuration Verification
- [ ] vercel.json configured correctly
- [ ] Environment variables documented
- [ ] Database credentials verified
- [ ] API keys validated
  - [ ] OpenWeather API key works
  - [ ] Sentry DSN validated
  - [ ] Datadog API key validated
- [ ] CORS origins configured
- [ ] Security headers verified

### Database Readiness
- [ ] Database backup taken
  ```bash
  pg_dump $DATABASE_URL > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Schema verified
- [ ] Indexes created
- [ ] Connection pool configured (20 connections)
- [ ] Migration scripts tested on staging

### Documentation
- [ ] OPERATIONS.md reviewed
- [ ] Runbooks prepared
- [ ] Escalation procedures defined
- [ ] On-call schedule assigned
- [ ] Status page updated

---

## Phase 2: Staging Deployment (12 hours before)

### Deploy to Staging
- [ ] Push code to `staging` branch
- [ ] Deploy to Vercel staging environment
  ```bash
  vercel --target=staging
  ```
- [ ] Verify deployment URL accessible

### Smoke Tests (Staging)
- [ ] Health endpoint responds
  ```bash
  curl https://weather-app-staging.vercel.app/health
  ```
- [ ] Weather endpoint works
  ```bash
  curl https://weather-app-staging.vercel.app/api/weather?city=Tokyo
  ```
- [ ] Forecast endpoint works
  ```bash
  curl https://weather-app-staging.vercel.app/api/forecast?city=Tokyo
  ```
- [ ] Frontend loads correctly
- [ ] Service Worker registers
- [ ] Cache is working (check cache-stats)
- [ ] Rate limiting functional

### Performance Testing (Staging)
- [ ] Response time < 500ms for cached requests
- [ ] Response time < 2000ms for fresh data
- [ ] Cache hit rate > 90%
- [ ] Memory usage < 300MB
- [ ] No memory leaks over 30 minutes

### Security Testing (Staging)
- [ ] Security headers present
  ```bash
  curl -i https://weather-app-staging.vercel.app/
  ```
- [ ] CORS properly restricted
- [ ] Input validation working
- [ ] Rate limiting enforced
- [ ] SQL injection prevention verified

### Monitoring Setup (Staging)
- [ ] Sentry configured and receiving events
- [ ] Datadog APM tracking requests
- [ ] Logs visible in Pino/cloudwatch
- [ ] Alerts triggering correctly (test alert)

---

## Phase 3: Production Deployment (Deployment Day)

### Pre-Deployment
- [ ] Announce maintenance window (if needed)
- [ ] Notify on-call team
- [ ] Prepare rollback plan
- [ ] Database backup taken
  ```bash
  pg_dump $DATABASE_URL > backup_pre_prod_$(date +%Y%m%d_%H%M%S).sql
  ```

### Deploy to Production
- [ ] Merge code to `main` branch
- [ ] Tag release: `v1.0.0`
  ```bash
  git tag -a v1.0.0 -m "Production release"
  git push origin v1.0.0
  ```
- [ ] Deploy to Vercel production
  ```bash
  vercel --prod
  ```
- [ ] Verify deployment URL
  ```bash
  curl https://weather-app.vercel.app/health
  ```

### Production Smoke Tests
- [ ] Health endpoint responds with status "ok"
- [ ] Weather API returns valid data
- [ ] Forecast API returns valid data
- [ ] Alerts API functioning
- [ ] History API functioning
- [ ] Frontend loads correctly
- [ ] PWA manifest valid
- [ ] Service Worker active

### Monitoring Verification
- [ ] Sentry receiving production events
- [ ] Datadog showing traffic metrics
- [ ] Logs appearing in monitoring system
- [ ] Error rate < 0.1%
- [ ] Response time P95 < 500ms
- [ ] Database connections stable
- [ ] Cache hit rate > 95%

### User Verification
- [ ] Test from multiple geographic locations
- [ ] Test on mobile devices
- [ ] Test with slow network (3G simulation)
- [ ] Test offline functionality
- [ ] Test with different languages (EN/VI)

---

## Phase 4: Post-Deployment (First 24 hours)

### Monitoring
- [ ] Monitor error rate every 15 minutes
- [ ] Check response time trends
- [ ] Verify cache hit rate stability
- [ ] Monitor database performance
- [ ] Watch for memory leaks

### User Feedback
- [ ] Monitor social media for issues
- [ ] Check support channels
- [ ] No critical user-reported bugs

### Performance Baseline
- [ ] Record baseline metrics:
  - API response time (P50, P95, P99)
  - Cache hit rate
  - Error rate
  - Uptime percentage

### Team Communication
- [ ] Send deployment notification
- [ ] Share metrics dashboard
- [ ] Document any issues encountered
- [ ] Schedule post-mortem if issues found

---

## Phase 5: Post-Deployment (First Week)

### Stability Monitoring
- [ ] No P1 incidents reported
- [ ] Error rate stable
- [ ] Performance metrics stable
- [ ] Database health normal

### Optimization
- [ ] Analyze slow queries
- [ ] Review expensive operations
- [ ] Optimize cache strategy if needed
- [ ] Fine-tune rate limits based on traffic

### Documentation Update
- [ ] Document actual deployment time
- [ ] Update runbooks with learnings
- [ ] Document any deviations from plan
- [ ] Share lessons learned with team

---

## Rollback Procedures

### If Critical Issues Found

**Option 1: Immediate Rollback (< 5 minutes downtime)**
```bash
# 1. Identify previous working version
git log --oneline | head -5

# 2. Redeploy previous version
git checkout v0.9.0
vercel --prod

# 3. Verify rollback successful
curl https://weather-app.vercel.app/health
```

**Option 2: Database Rollback (if data corruption)**
```bash
# 1. Stop all services
vercel env set DATABASE_URL=""

# 2. Restore from backup
psql postgres -c "DROP DATABASE weather_db;"
psql postgres -c "CREATE DATABASE weather_db;"
psql weather_db < backup_pre_prod_20260924_120000.sql

# 3. Restore environment variable
vercel env set DATABASE_URL "postgresql://..."

# 4. Redeploy
vercel --prod
```

**Option 3: Canary Rollback**
```bash
# Deploy to 10% of traffic first
vercel --prod --scale 0.1

# Monitor for 1 hour
# If stable, scale to 100%
vercel --prod --scale 1.0
```

---

## Sign-Off

**Deployment Manager:** ________________ Date: ________

**QA Lead:** ________________ Date: ________

**DevOps Lead:** ________________ Date: ________

**Product Owner:** ________________ Date: ________

---

## Deployment Metrics

**Target Metrics After Deployment:**

| Metric | Target | Status |
|--------|--------|--------|
| Uptime | > 99.9% | |
| Error Rate | < 0.1% | |
| API Response P95 | < 500ms | |
| Cache Hit Rate | > 95% | |
| Database Latency P95 | < 50ms | |

**Actual Metrics:**

| Metric | Actual | Time Recorded |
|--------|--------|--------------|
| Uptime | _____% | |
| Error Rate | ____% | |
| API Response P95 | ___ms | |
| Cache Hit Rate | ____% | |
| Database Latency P95 | __ms | |

---

## Notes

```
[Space for deployment notes]




```
