# Pre-Deployment Testing Checklist

**Date:** May 6, 2026  
**Purpose:** Manual testing required before production deployment  
**Status:** Ready for testing after controller audit completion

---

## 🔐 Authentication & Authorization Tests

### Login Flow
- [ ] **Test 1:** Login with valid student credentials
  - Should redirect to `/ogrenci` dashboard
  - Token should NOT appear in `localStorage`
  - Refresh token should be in HttpOnly cookie
  
- [ ] **Test 2:** Login with valid teacher credentials
  - Should redirect to `/ogretmen` dashboard
  
- [ ] **Test 3:** Login with invalid credentials
  - Should show error message
  - Should NOT redirect

### Page Refresh
- [ ] **Test 4:** Refresh student dashboard
  - Should stay logged in
  - Should call `/api/v1/auth/refresh` automatically
  - Should fetch user via `/api/v1/auth/me`
  
- [ ] **Test 5:** Refresh multiple times rapidly
  - Should not cause errors
  - Should not create redirect loops

### Logout
- [ ] **Test 6:** Logout from single tab
  - Should clear all auth state
  - Should redirect to `/giris`
  - Should clear refresh token cookie
  
- [ ] **Test 7:** Logout with multiple tabs open
  - All tabs should log out simultaneously
  - All tabs should redirect to login

### Direct URL Access
- [ ] **Test 8:** Access `/ogrenci/dashboard` without login
  - Should redirect to `/giris?redirect=/ogrenci/dashboard`
  - Middleware should block before page renders
  
- [ ] **Test 9:** Access `/ogrenci/onboarding` when grade is set
  - Should allow access
  
- [ ] **Test 10:** Access `/ogrenci/dersler` when grade is NULL
  - Should redirect to `/ogrenci/onboarding`

---

## 🎯 Grade Manipulation Tests

### Student Grade Change Attempts
- [ ] **Test 11:** Student tries to update profile with new grade
  ```bash
  curl -X PATCH https://terenceegitim.com/api/v1/user/profile \
    -H "Authorization: Bearer <student_token>" \
    -d '{"grade": 12}'
  ```
  - Should return 403 FORBIDDEN
  - Error message: "Sınıf ve hedef sınav bilgisi değiştirilemez"
  
- [ ] **Test 12:** Student tries to update goal with new exam type
  ```bash
  curl -X PATCH https://terenceegitim.com/api/v1/user/goal \
    -H "Authorization: Bearer <student_token>" \
    -d '{"target_exam": "YKS"}'
  ```
  - Should return 403 FORBIDDEN

### Teacher/Admin Grade Change
- [ ] **Test 13:** Teacher updates their own profile
  - Should allow update (not blocked)
  
- [ ] **Test 14:** Admin updates student grade (if admin endpoint exists)
  - Should allow update (authorized)

---

## 📚 Content Filtering Tests

### Grade-Based Content Isolation
- [ ] **Test 15:** Grade 9 student accesses question bank
  ```bash
  GET /api/v1/questions?subject=Matematik
  ```
  - Should return ONLY Grade 9 questions (or grade=all, grade=null)
  
- [ ] **Test 16:** Grade 12 student accesses courses
  ```bash
  GET /api/v1/courses
  ```
  - Should return ONLY Grade 12 courses
  
- [ ] **Test 17:** TYT student accesses exam content
  - Should return ONLY TYT exams (or exam_type=Genel, exam_type=null)

### Cross-Grade Leakage Prevention
- [ ] **Test 18:** Student manually changes API request to wrong grade
  ```bash
  curl -X GET 'https://terenceegitim.com/api/v1/questions?grade=12' \
    -H "Authorization: Bearer <grade9_student_token>"
  ```
  - Server should filter by authenticated user's grade
  - Should NOT return Grade 12 questions to Grade 9 student
  
- [ ] **Test 19:** Check student report for cross-grade data
  ```bash
  GET /api/v1/student/report
  ```
  - Should only show performance for user's assigned grade/exam

---

## 🔄 Redirect & Routing Tests

### Redirect Loop Prevention
- [ ] **Test 20:** Student with grade=NULL attempts to access content
  - Should redirect to `/ogrenci/onboarding` (max 1 redirect)
  - Should NOT create infinite redirect loop
  
- [ ] **Test 21:** Trigger 3+ redirects artificially
  - Should redirect to `/giris?error=redirect_loop`
  - Should log error to console

### Onboarding Flow
- [ ] **Test 22:** New student (no grade) accesses dashboard
  - Should redirect to `/ogrenci/onboarding`
  - Backend middleware should return 422 for API calls
  
- [ ] **Test 23:** Student completes onboarding
  - Should set `onboarding_completed = true`
  - Should redirect to dashboard
  - Should now access content normally

---

## 🗃️ Database Integrity Tests

### Constraint Enforcement
- [ ] **Test 24:** Attempt to create student with NULL grade via API
  ```sql
  INSERT INTO users (role, grade, target_exam) VALUES ('student', NULL, 'TYT');
  ```
  - MySQL should reject (CHECK constraint violation)
  
- [ ] **Test 25:** Update existing student to NULL grade
  ```sql
  UPDATE users SET grade = NULL WHERE role = 'student' AND id = 123;
  ```
  - MySQL should reject

### Audit Logging
- [ ] **Test 26:** Admin changes student's grade
  - Should log entry in `audit_logs` table
  - Should include: user_id, field, old_value, new_value, changed_by, IP
  
- [ ] **Test 27:** Query audit logs
  ```sql
  SELECT * FROM audit_logs WHERE field IN ('grade', 'target_exam', 'role') ORDER BY created_at DESC LIMIT 10;
  ```
  - Should show recent grade/role changes

---

## 🛡️ Security Tests

### XSS Protection
- [ ] **Test 28:** Check localStorage after login
  ```javascript
  console.log(localStorage.getItem('terence_token')); // Should be null
  console.log(localStorage.getItem('terence_user')); // Should be null
  ```
  - Both should return `null`
  
- [ ] **Test 29:** Check cookies
  ```javascript
  document.cookie; // Should NOT show refresh_token (HttpOnly)
  ```
  - Refresh token should be invisible to JavaScript

### CORS Protection
- [ ] **Test 30:** Make API request from wrong origin
  ```bash
  curl -X GET https://terenceegitim.com/api/v1/auth/me \
    -H "Origin: https://evil.com" \
    -H "Authorization: Bearer <token>"
  ```
  - Should reject with CORS error
  - Access-Control-Allow-Origin should NOT be `*`

---

## 📊 Performance & UX Tests

### Page Load Performance
- [ ] **Test 31:** Measure time from login to dashboard
  - Should be < 2 seconds on 3G connection
  
- [ ] **Test 32:** Measure time for refresh token flow on page reload
  - Should be < 1 second

### Error Handling
- [ ] **Test 33:** Login with expired refresh token
  - Should redirect to login page
  - Should show friendly error message
  
- [ ] **Test 34:** API 422 error with code 'GRADE_REQUIRED'
  - Should redirect to onboarding
  - Should not crash app

---

## 🚀 Deployment Smoke Tests

### Post-Deployment Verification
- [ ] **Test 35:** New user registration flow
  - Complete registration
  - Set grade during onboarding
  - Access dashboard
  
- [ ] **Test 36:** Existing user login
  - Login with existing account
  - Verify data still accessible
  
- [ ] **Test 37:** Check production logs for errors
  ```bash
  ssh root@31.210.53.84
  tail -f /var/www/terence/nazliyavuz-platform/backend/storage/logs/laravel.log
  ```
  - Should not show critical errors

---

## ✅ Success Criteria

All tests must pass before production deployment. Priority order:

1. **CRITICAL (must pass):**
   - Tests 1-10 (Auth flow)
   - Tests 11-12 (Grade manipulation blocked)
   - Tests 15-19 (Content filtering)
   - Test 28-29 (XSS protection)

2. **HIGH (strongly recommended):**
   - Tests 20-23 (Redirect protection)
   - Tests 24-27 (Database integrity)
   - Test 30 (CORS)

3. **MEDIUM (recommended):**
   - Tests 31-34 (Performance & errors)
   - Tests 35-37 (Smoke tests)

---

## 📝 Test Results Template

Copy this template for tracking:

```
Date: _____________
Tester: _____________

CRITICAL TESTS:
[_] Test 1-10: Auth flow - PASS / FAIL - Notes: ___________
[_] Test 11-12: Grade manipulation - PASS / FAIL - Notes: ___________
[_] Test 15-19: Content filtering - PASS / FAIL - Notes: ___________
[_] Test 28-29: XSS protection - PASS / FAIL - Notes: ___________

HIGH PRIORITY:
[_] Test 20-23: Redirects - PASS / FAIL - Notes: ___________
[_] Test 24-27: Database - PASS / FAIL - Notes: ___________
[_] Test 30: CORS - PASS / FAIL - Notes: ___________

DEPLOYMENT DECISION: GO / NO-GO
Reason: _____________
```

---

## 🔧 Troubleshooting Guide

**Issue:** Users can't log in after deployment  
**Fix:** Clear browser cache, check refresh token cookie, verify backend `/api/v1/auth/refresh` endpoint

**Issue:** Redirect loop detected  
**Fix:** Clear sessionStorage, check `auth_redirect_count`, verify AuthGuard logic

**Issue:** Grade 9 student sees Grade 12 content  
**Fix:** Check backend controller filtering, verify `learningScope()` returns correct grade

**Issue:** MySQL constraint errors on student creation  
**Fix:** Ensure grade and target_exam are provided during registration, check onboarding flow
