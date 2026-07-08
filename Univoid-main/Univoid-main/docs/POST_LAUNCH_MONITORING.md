# UniVoid Post-Launch Monitoring Checklist

## 🎯 Overview
This document outlines the monitoring strategy for UniVoid after going live. Follow this checklist daily for the first week, then weekly thereafter.

---

## 🔴 Critical Metrics (Check Every 4 Hours - First 48 Hours)

### Error Monitoring
- [ ] Check `error_logs` table for new entries
- [ ] Review console errors in production
- [ ] Monitor edge function logs for failures
- [ ] Check auth logs for login issues

```sql
-- Recent errors (last 4 hours)
SELECT * FROM error_logs 
WHERE created_at > NOW() - INTERVAL '4 hours'
ORDER BY created_at DESC;
```

### User Activity
- [ ] New user signups working
- [ ] Login/logout flow stable
- [ ] Profile creation successful
- [ ] Email verification functioning

```sql
-- New users in last 24 hours
SELECT COUNT(*) as new_users, 
       DATE_TRUNC('hour', created_at) as hour
FROM profiles 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour ORDER BY hour;
```

---

## 📊 Daily Monitoring Checklist

### 1. Database Health
- [ ] Query performance acceptable (<500ms)
- [ ] No connection pool exhaustion
- [ ] Storage usage within limits
- [ ] RLS policies functioning correctly

### 2. Core Features Status

| Feature | Status | Last Checked | Notes |
|---------|--------|--------------|-------|
| Books Listing | ⬜ | | |
| Book Creation | ⬜ | | |
| Materials Browse | ⬜ | | |
| Material Upload | ⬜ | | |
| Events Listing | ⬜ | | |
| Event Registration | ⬜ | | |
| Tasks Plaza | ⬜ | | |
| Projects | ⬜ | | |
| User Auth | ⬜ | | |
| Admin Panel | ⬜ | | |

### 3. Performance Metrics
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks detected
- [ ] Mobile performance acceptable

### 4. User Experience
- [ ] No UI freezes reported
- [ ] Navigation working smoothly
- [ ] Realtime updates functioning
- [ ] No data disappearing on refresh

---

## 🚨 Alert Thresholds

### Immediate Action Required
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 5% of requests | Investigate immediately |
| API latency | > 2 seconds | Check database/network |
| Failed logins | > 10 in 1 hour | Check auth system |
| 500 errors | Any occurrence | Debug edge functions |

### Warning Level
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 1% of requests | Monitor closely |
| API latency | > 1 second | Optimize queries |
| Page load | > 5 seconds | Check bundle size |

---

## 📱 Device-Specific Checks

### Mobile (Priority)
- [ ] Bottom navigation visible on all pages
- [ ] Touch interactions responsive
- [ ] No layout shifts
- [ ] Back navigation stable
- [ ] Forms usable on small screens

### Desktop
- [ ] Responsive layouts correct
- [ ] Hover states working
- [ ] Keyboard navigation functional
- [ ] Sidebar/header consistent

---

## 🔍 Weekly Deep Dive

### Database Analysis
```sql
-- Most active tables
SELECT schemaname, relname, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
LIMIT 10;

-- Slow queries (if pg_stat_statements enabled)
-- Check for queries > 100ms
```

### User Engagement
```sql
-- Daily active users
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as dau
FROM xp_transactions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date ORDER BY date;

-- Feature usage
SELECT 
  (SELECT COUNT(*) FROM books WHERE created_at > NOW() - INTERVAL '7 days') as new_books,
  (SELECT COUNT(*) FROM materials WHERE created_at > NOW() - INTERVAL '7 days') as new_materials,
  (SELECT COUNT(*) FROM events WHERE created_at > NOW() - INTERVAL '7 days') as new_events,
  (SELECT COUNT(*) FROM task_requests WHERE created_at > NOW() - INTERVAL '7 days') as new_tasks;
```

### Error Trends
```sql
-- Error breakdown by type
SELECT error_type, COUNT(*) as count
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY error_type
ORDER BY count DESC;

-- Errors by component
SELECT component_name, COUNT(*) as count
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY component_name
ORDER BY count DESC;
```

---

## 🚑 Emergency Response Protocol

### If Critical Issue Detected:

1. **Assess Impact**
   - How many users affected?
   - Which features broken?
   - Is data at risk?

2. **Communicate**
   - Update status page (if available)
   - Notify team immediately

3. **Investigate**
   - Check error logs
   - Review recent deployments
   - Check database status

4. **Fix**
   - Apply hotfix if safe
   - Or rollback to previous version

5. **Post-Mortem**
   - Document what happened
   - Root cause analysis
   - Preventive measures

---

## 📋 Quick Commands

### Check Recent Errors
```sql
SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 20;
```

### Check User Activity
```sql
SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Check Content Creation
```sql
SELECT 
  'books' as type, COUNT(*) as count FROM books WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'materials', COUNT(*) FROM materials WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'events', COUNT(*) FROM events WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## ✅ Sign-Off

| Date | Checked By | Status | Notes |
|------|------------|--------|-------|
| | | | |
| | | | |
| | | | |

---

*Last Updated: December 2024*
*Document Owner: UniVoid Team*
