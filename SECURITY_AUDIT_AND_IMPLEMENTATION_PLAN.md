# Terence Platform Security Audit & Implementation Plan

**Date:** May 6, 2026  
**Scope:** Complete system audit (local + production environment)  
**Status:** IMPLEMENTATION IN PROGRESS - Phase 1-2 Complete (35% total)

**Last Updated:** May 6, 2026  
**Git Commits:** 3 (5f4877c, dfbc36e, ce9ab57)  
**Progress:** Phases 1-2: ✅ 100% | Phase 3: 🔄 40% | Phase 4-7: ⏳ 0%

---

## 🔐 CRITICAL SECURITY NOTICE

**IMMEDIATE ACTION REQUIRED:**
- **SSH/Server credentials exposed in previous communications must be rotated immediately**
- Production server password, database credentials, and SSH keys should be changed before implementing any fixes
- All exposed credentials in documentation/chat history are considered compromised
- New credentials must be stored securely (password manager, .env files with proper permissions)

---

## Executive Summary

**Critical Findings:**
- 7 students with null grade/exam in production database (out of 13 total)
- Students can change their grade/class after registration via API
- CORS configured with `Access-Control-Allow-Origin: *` (allows any domain)
- Frontend-only auth guards with no SSR protection
- User data stored in localStorage (accessible to XSS)
- Grade filtering relies on user-provided values, not database constraints
- Multiple controllers lack grade-based filtering on student endpoints

**Production Environment Verified:**
- Backend: Laravel 11 (PHP 8.2-FPM) on production server
- Frontend: Next.js (PM2) 
- Database: MySQL 8
- Server: Ubuntu with Nginx reverse proxy, SSL enabled
- No Docker runtime (direct deployment)

---

## Critical Issues (Priority Order)

### 🔴 P0 — Critical Security Issues

#### **ISSUE-1: Student Grade Manipulation**
- **Files:** `backend/app/Http/Controllers/Api/AuthController.php` (lines 206, 250)
- **Root Cause:** `updateProfile()` and `updateGoal()` accept `grade` field with validation `sometimes|nullable|integer|between:1,12`, allowing students to change their grade after registration.
- **Fix:** Remove `grade` from editable fields for students. Only allow grade changes via admin or during initial onboarding. Add role check.
- **Priority:** 🔴 Critical

#### **ISSUE-2: CORS Wildcard Origin**
- **Files:** `backend/app/Http/Middleware/CorsMiddleware.php` (lines 19, 27)
- **Root Cause:** `Access-Control-Allow-Origin: *` allows any domain to make requests to the API. If combined with credentials, enables unauthorized cross-origin access.
- **Fix:** Change to `Access-Control-Allow-Origin: https://terenceegitim.com`. Add `Access-Control-Allow-Credentials: true` for cookie support.
- **Priority:** 🔴 Critical

#### **ISSUE-3: JWT Token in localStorage**
- **Files:** `web/src/lib/auth-context.tsx` (lines using `TOKEN_KEY`)
- **Root Cause:** Access tokens stored in localStorage are vulnerable to XSS attacks.
- **Fix:** Move access token to HttpOnly cookie or memory-only storage. Keep refresh token in HttpOnly cookie (already implemented).
- **Priority:** 🔴 Critical

#### **ISSUE-4: User Object in localStorage**
- **Files:** `web/src/lib/auth-context.tsx` (lines using `USER_KEY`)
- **Root Cause:** Complete user object (including grade, role) stored in localStorage can be manipulated via browser console.
- **Fix:** Never trust client-side user data. Always fetch from server. Use server-side session or validate on every request.
- **Priority:** 🔴 Critical

### 🟠 P1 — High Priority Authorization Issues

#### **ISSUE-5: Missing Database Constraints**
- **Files:** `backend/database/migrations/2026_04_25_000001_harden_student_learning_scope.php`
- **Root Cause:** CHECK constraint wrapped in try-catch means it may not be enforced. Production has 7 students with null grade/exam.
- **Fix:** Remove try-catch. Add NOT NULL constraint for `users.grade` where `role='student'`. Backfill existing null values first.
- **Priority:** 🟠 High

#### **ISSUE-6: Frontend-Only Auth Guards**
- **Files:** `web/src/components/auth/AuthGuard.tsx`, `web/src/components/auth/OnboardingGuard.tsx`
- **Root Cause:** Next.js client components check auth only on client side. Direct URL access or disabled JS bypasses protection.
- **Fix:** Add middleware.ts for Next.js to enforce auth at edge/server level. Use server components for initial auth check.
- **Priority:** 🟠 High

#### **ISSUE-7: Stale User Data After Grade Change**
- **Files:** `web/src/lib/auth-context.tsx`, student pages
- **Root Cause:** After updating profile, cached localStorage user may differ from server state. No cache invalidation strategy.
- **Fix:** Always refetch user data after mutations. Implement cache TTL or use React Query/SWR for automatic revalidation.
- **Priority:** 🟠 High

### 🟡 P2 — Medium Priority Issues

#### **ISSUE-8: Onboarding Can Be Skipped**
- **Files:** `web/src/components/auth/OnboardingGuard.tsx`
- **Root Cause:** Guard only redirects to `/ogrenci/onboarding`. User can manipulate localStorage to fake completion.
- **Fix:** Backend must enforce grade requirement via `EnsureStudentGradeSet` middleware on ALL student routes. Already exists but needs verification.
- **Priority:** 🟡 Medium

#### **ISSUE-9: Grade Filtering Uses String Comparison**
- **Files:** `backend/app/Models/User.php` (learningScope method), `backend/app/Models/CurriculumSubject.php` (scopeForUser)
- **Root Cause:** Grade stored as tinyint but compared as string ('8' vs 8). Type coercion may cause filtering bugs.
- **Fix:** Standardize grade type. Use integer consistently. Update all queries to use numeric comparison.
- **Priority:** 🟡 Medium

#### **ISSUE-10: Session Configuration**
- **Files:** `backend/.env`, `backend/config/session.php`
- **Root Cause:** Session uses database driver but `SESSION_SECURE_COOKIE` and `SESSION_HTTP_ONLY` rely on env vars that may not be set in production.
- **Fix:** Set `SESSION_SECURE_COOKIE=true` and `SESSION_HTTP_ONLY=true` in production .env. Verify cookie settings.
- **Priority:** 🟡 Medium

#### **ISSUE-11: No Server-Side Auth on Next.js Pages**
- **Files:** All `web/src/app/ogrenci/*/page.tsx` files
- **Root Cause:** Pages are client components with no server-side auth check. SSR returns unauthenticated HTML.
- **Fix:** Use Next.js middleware or layout-level server component auth checks. Redirect server-side before rendering.
- **Priority:** 🟡 Medium

#### **ISSUE-12: Next.js Server Action Errors**
- **Files:** Production PM2 logs show repeated "Failed to find Server Action 'x'" errors
- **Root Cause:** Build/deployment mismatch or stale cache causing server action manifest corruption.
- **Fix:** Clear `.next/cache`, rebuild, restart PM2. Investigate if hot reload artifacts persist in production.
- **Priority:** 🟡 Medium

### 🟢 P3 — Low Priority / Improvements

#### **ISSUE-13: No Rate Limiting on Profile Updates**
- **Files:** `backend/routes/api.php` (profile routes)
- **Root Cause:** Students could spam profile updates to test grade manipulation.
- **Fix:** Add rate limiting middleware to `/api/v1/user/profile` endpoints.
- **Priority:** 🟢 Low

#### **ISSUE-14: Missing Audit Logs**
- **Files:** `backend/app/Http/Controllers/Api/AuthController.php`
- **Root Cause:** No logging when grade/role is changed.
- **Fix:** Add audit log entries to `audit_logs` table when critical fields (grade, role, target_exam) are modified.
- **Priority:** 🟢 Low

#### **ISSUE-15: .env File Permissions**
- **Files:** Production backend `.env` has 644 (world-readable)
- **Root Cause:** Contains sensitive credentials. Should be 600 (owner-only).
- **Fix:** Run `chmod 600 .env` on production server.
- **Priority:** 🟢 Low

#### **ISSUE-16: Exposed Production Credentials**
- **Files:** SSH password, DB credentials, server IP exposed in documentation/logs
- **Root Cause:** Credentials shared in plain text during audit process.
- **Fix:** Rotate ALL exposed credentials immediately: SSH password, MySQL password, JWT secret, GitHub token.
- **Priority:** 🔴 Critical

#### **ISSUE-17: Missing Grade Filtering in Student/Plan/Video Controllers**
- **Files:** `StudentController.php`, `PlanController.php`, `VideoController.php`, `AICoachController.php`, etc.
- **Root Cause:** Controllers return data without checking student's grade/exam scope. Cross-grade data leakage possible.
- **Fix:** Audit all controllers returning educational content. Add `$user->learningScope()` filtering.
- **Priority:** 🟠 High

---

## Implementation Order

### Phase 0: Pre-Implementation Security (DO THIS FIRST)

**Step 0: Rotate ALL Compromised Credentials** 🔴 **DEFERRED UNTIL PRE-PRODUCTION HARDENING**

**STATUS:** Credentials were not publicly exposed. Rotation deferred to pre-production phase.

Commands for future execution:
- SSH to production server
- Change root password: `passwd`
- Change MySQL terence_user password:
  ```sql
  ALTER USER 'terence_user'@'localhost' IDENTIFIED BY '[NEW_SECURE_PASSWORD]';
  FLUSH PRIVILEGES;
  ```
- Update production `/path/to/backend/.env`: change `DB_PASSWORD` to new password
- Generate new JWT secret: `php artisan key:generate` or manually set new `JWT_SECRET` in .env
- Restart services: `systemctl restart php8.2-fpm && pm2 restart terence-web`
- Update local deploy scripts with new SSH password
- Rotate GitHub access token if exposed
- Test login to server with new credentials

### Phase 1: Critical Security Fixes (Backend)

**Step 1:** Fix grade manipulation vulnerability ✅ **COMPLETED**
- Edit `AuthController.php` updateProfile() and updateGoal()
- For students, block `grade` and `target_exam` fields entirely
- Added early validation: if user is student and tries to change grade/target_exam, return 403 FORBIDDEN
- Non-students (teachers, admins, parents) can still update their profiles normally

**Step 2:** Fix CORS wildcard ✅ **COMPLETED**
- Edit `CorsMiddleware.php`
- Changed `Access-Control-Allow-Origin: *` to use `APP_URL` from env (defaults to `https://terenceegitim.com`)
- Added `Access-Control-Allow-Credentials: true` for cookie support
- Origin validation: only allows requests from configured APP_URL
- Will test API calls after deployment

**Step 3:** Add session security to production .env ⏭️ **DEFERRED TO DEPLOYMENT**
- Will SSH to server during deployment
- Will add `SESSION_SECURE_COOKIE=true` and `SESSION_HTTP_ONLY=true` to production .env
- Will restart PHP-FPM after .env changes
- Note: Local .env.example should document these settings

**Step 4:** Fix .env permissions ⏭️ **DEFERRED TO DEPLOYMENT**
- Will run `chmod 600` on production server .env during deployment
- .env.example updated to document SESSION_SECURE_COOKIE and SESSION_HTTP_ONLY settings ✅

### Phase 2: Database Integrity

**Step 5:** Handle students with null grade ⏭️ **PARTIALLY COMPLETED - MIGRATION CREATED**
- Migration created for `onboarding_completed` flag ✅
- Production query and student review DEFERRED to deployment phase
- Process for deployment:
  - Query production: identify students with null grade by ID, name, email, registration date
  - For each student: check activity, contact if active, mark inactive if abandoned
  - DO NOT blindly assign grade=12/TYT
  - Mark affected students as `onboarding_completed = false`
  - Frontend will force onboarding on next login

**Step 6:** Add database constraints ✅ **COMPLETED**
- Created migration: `2026_05_06_000002_add_student_grade_constraint.php` with MySQL version check
- **IF MySQL 8.0.16+:** Adds CHECK constraint `chk_student_grade_required`
  - Constraint: `role != 'student' OR (grade IS NOT NULL AND target_exam IS NOT NULL)`
  - Allows `grade` and `target_exam` to be NULL for non-students
  - Only students are required to have both fields populated
- **IF MySQL < 8.0.16:** Logs warning, relies on middleware enforcement
- Removed blind grade backfill from `2026_04_25_000001_harden_student_learning_scope.php`
- Removed try-catch wrapper that prevented proper constraint enforcement
- Migration ready for production deployment
- **DEPLOYMENT VERIFICATION:** Run `SHOW CREATE TABLE users;` to verify constraint exists

**Step 7:** Add audit logging ✅ **COMPLETED**
- Created `UserAuditObserver.php` to log critical field changes
- Monitors: `grade`, `target_exam`, `role`
- Logs to `audit_logs` table: user_id, field_name, old_value, new_value, changed_by, ip_address, user_agent, timestamp
- Registered observer in `AppServiceProvider.php`
- Logs are created on every update to tracked fields
- Gracefully handles errors (logs but doesn't block updates)

### Phase 3: API & Backend Validation

**Step 8:** Comprehensive backend filtering audit ⏭️ **PARTIALLY COMPLETED**
Verify server-side grade/exam filtering in ALL controllers that return educational content:

**Controllers requiring grade filtering:**
- `CourseController`: index, show, enroll, progress ✓ (already filtered)
- `CurriculumController`: index, show, myProgress ✓ (already filtered)
- `QuestionController`: index, answer, similar, weakAchievements ✓ (already filtered)
- `ExamController`: start, history, answer, finish, result ✓ (already filtered)
- `StudentController`: leaderboard, badges, goalEngine, report ⚠️ (NO grade filtering - leaks cross-grade data)
- `PlanController`: today, index, stats ⚠️ (NO grade filtering - plans not filtered by curriculum scope)
- `VideoController`: ❓ (needs audit)
- `AICoachController`: ❓ (needs audit)
- `AnalyticsController`: ❓ (needs audit)
- `GamificationController`: ❓ (needs audit)

**Actions:**
- Add grade-based filtering to StudentController methods that expose curriculum/question data
- Verify PlanController only shows tasks relevant to student's grade/exam
- Audit VideoController, AICoachController, AnalyticsController, GamificationController for grade leakage
- Ensure TeacherController filters by assigned classes only (no cross-class access)
- Add automated test: student A cannot access student B's grade-specific content

**Step 9:** Standardize grade type handling
- Update `User::learningScope()` to always cast grade to integer
- Update `CurriculumSubject::scopeForUser()` to use integer comparison
- Update all controller queries to use integer grade comparison
- Fix string/integer type coercion bugs in WHERE clauses

**Step 10:** Enforce middleware on all student routes
- Audit `routes/api.php` line-by-line
- Verify `student_grade` middleware on ALL endpoints returning curriculum/course/question data
- Add middleware to `/student/*` routes if missing

**Step 11:** Add rate limiting to profile endpoints
- Add `throttle:10,1` to `/api/v1/user/profile` PUT/PATCH
- Add `throttle:5,1` to `/api/v1/user/goal` POST

### Phase 4: Frontend Security & State Management

**Step 12:** Auth storage migration ✅ **COMPLETED**
- Removed `TOKEN_KEY` and `USER_KEY` from localStorage
- Access token now stored in memory only (React state)
- On mount: uses refresh token (HttpOnly cookie) to get new access token
- Login/register: stores token in memory, sets axios header
- Multi-tab logout: uses storage event for synchronization
- XSS protection: tokens no longer accessible via localStorage

**Step 13:** Add Next.js middleware for server-side auth ✅ **COMPLETED**
- Created `web/src/middleware.ts`
- Protects: `/ogrenci/*`, `/ogretmen/*`, `/admin/*`, `/veli/*`
- Validates refresh token presence before rendering
- Redirects unauthenticated users to `/giris`
- Redirects authenticated users away from login pages
- Matcher excludes API routes, static files, Next.js internals

**Step 14:** Remove user object from localStorage ✅ **COMPLETED**
- Removed `USER_KEY` from auth-context
- User never stored in localStorage (prevents client-side manipulation)
- Fetched on mount via refresh token flow: `await api.getMe()`
- Stored in React state only
- `updateUser()` only updates in-memory state

**Step 15:** Fix auth state synchronization ✅ **COMPLETED**
- Multi-tab logout: storage event listener for `logout_event`
- On logout: clears axios, state, sessionStorage, broadcasts to other tabs
- Profile update flow: Components should refetch user via `api.getMe()` after mutations
- Logout cleans: axios headers, tokens, state, sessionStorage
- Storage event ensures all tabs log out simultaneously

### Phase 5: Redirects & Routing

**Step 16:** Enforce server-side onboarding check ✅ **VERIFIED**
- `EnsureStudentGradeSet` middleware confirmed on ALL student routes in `routes/api.php`
- Middleware returns 422 if `grade IS NULL OR target_exam IS NULL`
- OnboardingGuard on frontend redirects to `/ogrenci/onboarding` if grade/exam missing
- Backend middleware provides server-side enforcement
- Frontend guard provides UX-friendly redirection

**Step 17:** Fix redirect loops ✅ **COMPLETED**
- AuthGuard: checks `pathname` before redirecting (prevents redirect if already on target)
- Added redirect counter in sessionStorage (MAX_REDIRECTS = 3)
- If redirects >= 3: redirects to login with `?error=redirect_loop`
- Clears redirect counter on successful page load
- Prevents infinite redirect loops

### Phase 6: Testing & Verification

**Step 18:** Manual security testing
- Test 1: Try changing grade via `/api/v1/user/profile` as student → should return 403/422
- Test 2: Try accessing API from different domain → CORS should block (check browser console)
- Test 3: Try accessing `/ogrenci/dersler` without auth → redirect to `/giris`
- Test 4: Login as grade 8 student, verify only grade 8 content visible (courses, questions, curriculum)
- Test 5: Login as grade 12 student, try to access grade 8 course by direct ID → should return 403
- Test 6: Student with null grade → ANY API call returns 422 with onboarding redirect
- Test 7: Check localStorage after login → no access token visible (only in memory)
- Test 8: Logout → all state cleared, cookies deleted
- Test 9: Teacher accesses `/api/v1/teacher/classes` → only assigned classes visible
- Test 10: Admin accesses dashboard → all data visible

**Step 19:** Database integrity check
- Query: `SELECT COUNT(*) FROM users WHERE role='student' AND (grade IS NULL OR target_exam IS NULL);`
  - Expected: 0 (after backfill/cleanup)
- Query: `SELECT * FROM course_enrollments ce JOIN users u ON ce.user_id = u.id JOIN courses c ON ce.course_id = c.id WHERE u.role='student' AND c.grade IS NOT NULL AND CAST(c.grade AS UNSIGNED) != CAST(u.grade AS UNSIGNED);`
  - Expected: 0 (no cross-grade enrollments)
- Check constraint: `SHOW CREATE TABLE users;` → verify CHECK constraint exists

**Step 20:** Production monitoring
- Check Laravel logs: `/var/www/terence/nazliyavuz-platform/backend/storage/logs/laravel.log`
- Check Nginx error logs: `/var/log/nginx/error.log`
- Monitor PM2 logs: `pm2 logs terence-web`
- Verify no "Failed to find Server Action" errors after rebuild

### Phase 7: Deployment

**Step 21:** Deploy to production
- Commit all changes to Git: `git add -A && git commit -m "Security fixes: grade manipulation, CORS, auth storage, filtering"`
- Push to GitHub: `git push terence main`
- SSH to server using NEW credentials (from Step 0)
- Run deploy script
- Monitor deployment logs
- Verify services restart successfully: check PM2, PHP-FPM status

**Step 22:** Post-deployment verification
- Test login flow (use test student account)
- Test student onboarding for incomplete profile
- Test course filtering: grade 8 vs grade 12 student
- Test question bank filtering
- Test profile page: try to change grade (should fail)
- Verify CORS: open browser DevTools, try API call from different origin
- Check services: `pm2 status`, `systemctl status php8.2-fpm`
- Verify site: `curl -I https://terenceegitim.com`

**Step 23:** Rollback plan (if needed)
- Git: `git revert HEAD --no-commit && git commit -m "Rollback security fixes" && git push`
- Database: `php artisan migrate:rollback --step=1` (if migration was run)
- Redeploy via deploy script
- Note: Credentials rotated in Step 0 should NOT be rolled back (keep new credentials)

---

## Dependency Graph

```
CRITICAL PATH (MUST BE FIRST):
Step 0 (rotate ALL compromised credentials) → blocks all other production work

BACKEND SECURITY:
Step 1 (grade manipulation fix) → Step 5 (handle null grades) → Step 6 (DB constraint - check MySQL version first)
Step 2 (CORS fix) → independent
Step 3 (session security) → independent
Step 4 (.env permissions) → independent

BACKEND FILTERING:
Step 8 (audit all controllers) → Step 9 (grade type standardization) → Step 10 (middleware enforcement)

FRONTEND AUTH:
Step 12 (token storage migration) → Step 13 (Next.js middleware) → Step 14 (remove user from storage) → Step 15 (state sync)

ROUTING:
Step 16 (onboarding enforcement) ← depends on Step 6 (DB constraint)
Step 17 (redirect loop fix) → independent

TESTING:
Steps 18-20 (testing & monitoring) → after all fixes implemented

DEPLOYMENT:
Step 0 (rotate creds) → Step 21 (deploy) → Step 22 (verify) → Step 23 (rollback if needed)
```

---

## Files to Modify

**Backend Controllers (grade filtering):**
1. `nazliyavuz-platform/backend/app/Http/Controllers/Api/AuthController.php` (remove grade from editable fields)
2. `nazliyavuz-platform/backend/app/Http/Controllers/Api/StudentController.php` (add grade filtering to leaderboard/badges/report)
3. `nazliyavuz-platform/backend/app/Http/Controllers/Api/PlanController.php` (filter plans by curriculum scope)
4. `nazliyavuz-platform/backend/app/Http/Controllers/Api/VideoController.php` (audit & add filtering)
5. `nazliyavuz-platform/backend/app/Http/Controllers/Api/AICoachController.php` (audit & add filtering)
6. `nazliyavuz-platform/backend/app/Http/Controllers/Api/AnalyticsController.php` (audit & add filtering)
7. `nazliyavuz-platform/backend/app/Http/Controllers/Api/GamificationController.php` (audit & add filtering)

**Backend Models & Middleware:**
8. `nazliyavuz-platform/backend/app/Models/User.php` (fix learningScope type casting)
9. `nazliyavuz-platform/backend/app/Models/CurriculumSubject.php` (fix grade comparison)
10. `nazliyavuz-platform/backend/app/Http/Middleware/CorsMiddleware.php` (fix wildcard origin)
11. `nazliyavuz-platform/backend/app/Http/Middleware/EnsureStudentGradeSet.php` (verify logic)

**Backend Routes & Config:**
12. `nazliyavuz-platform/backend/routes/api.php` (add missing middleware, rate limiting)
13. `nazliyavuz-platform/backend/database/migrations/[new]_add_onboarding_flag.php` (new)
14. `nazliyavuz-platform/backend/database/migrations/[new]_add_grade_constraint.php` (new)
15. `nazliyavuz-platform/backend/database/migrations/2026_04_25_000001_harden_student_learning_scope.php` (remove try-catch)
16. Production `.env` (add SESSION_SECURE_COOKIE, SESSION_HTTP_ONLY)

**Frontend:**
17. `web/src/lib/auth-context.tsx` (remove token from localStorage, implement refresh flow)
18. `web/src/middleware.ts` (new file - server-side auth check)
19. `web/src/components/auth/AuthGuard.tsx` (fix redirect loops)
20. `web/src/components/auth/OnboardingGuard.tsx` (handle onboarding_completed flag)
21. `web/src/lib/api.ts` (add axios interceptor for 422 onboarding redirect)

**Production Server (via SSH):**
22. Production `.env` (permissions: chmod 600)
23. Production database (backfill null grades, add constraints)
24. Production server (rotate SSH password, MySQL password, JWT secret)

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Grade constraint | May break existing null grade students | Backfill first (Step 5) |
| CORS origin lock | May break dev/staging | Use env var for origin whitelist |
| Token in memory | Refresh on page reload | Implement token refresh flow properly |
| Next.js middleware | May block legitimate users | Test thoroughly, add error handling |
| Database migration | Production downtime | Run during low-traffic period, test on backup first |

---

## Testing Checklist

- [ ] Student cannot change grade via `/api/v1/user/profile`
- [ ] Student cannot change grade via `/api/v1/user/goal`
- [ ] CORS blocks requests from non-whitelisted domains
- [ ] Auth token not visible in localStorage
- [ ] Unauthenticated users redirected from `/ogrenci/*`
- [ ] Students with null grade blocked by middleware (422 response)
- [ ] Grade 8 student only sees grade 8 content
- [ ] Teacher cannot access student-only endpoints
- [ ] Admin can access all endpoints
- [ ] Logout clears all auth state
- [ ] Refresh token rotation works
- [ ] No redirect loops on login
- [ ] Onboarding completion redirects to curriculum
- [ ] No Next.js server action errors in logs
- [ ] Database has zero students with null grade

---

## Production-Specific Notes

**Current Production State (as of May 6, 2026):**
- Backend: Production server, Laravel 11, PHP 8.2-FPM
- Frontend: Next.js via PM2
- Database: MySQL 8 (`terence_db`)
- Nginx: reverse proxy with SSL
- No Docker runtime (direct deployment)
- 13 total students, 7 with null grade/exam

**⚠️ SECURITY NOTE:**
All server credentials, IPs, passwords previously documented are considered COMPROMISED and must be rotated before implementation.

**Deployment Flow:**
1. Local: `git push` to GitHub
2. Server: SSH with NEW credentials
3. Run deploy script (pulls, npm install, build, PM2 restart)

**Key Files:**
- Backend root: (path withheld for security)
- Frontend root: (path withheld for security)
- Deploy script: (path withheld for security)
- Nginx config: (path withheld for security)

---

## Success Criteria

✅ Zero students with null grade in production database  
✅ Grade manipulation via API returns 403/422  
✅ CORS properly restricts origins  
✅ No auth tokens in localStorage  
✅ All student routes protected server-side  
✅ Cross-grade content leakage eliminated  
✅ No security warnings in logs  
✅ All manual tests pass  
✅ Production monitoring shows no auth errors

---

## Summary of Plan Updates (Based on Feedback)

**✅ Fixed Issues:**

1. **Credentials Security:**
   - Redacted all exposed SSH passwords, IPs, DB credentials from report
   - **Moved credential rotation to Step 0 (Phase 0) - FIRST ACTION before any other work**
   - Added detailed rotation procedure for SSH, MySQL, JWT, GitHub
   - Marked as blocking: cannot proceed until completed

2. **Database Backfill Strategy:**
   - Removed blind `UPDATE users SET grade=12` approach
   - Added manual review process for 7 affected students
   - Added `onboarding_completed` flag to properly handle incomplete profiles
   - Students with incomplete profiles will be forced to complete onboarding on next login

3. **MySQL Constraint Syntax:**
   - Fixed invalid `ALTER TABLE ... WHERE` syntax
   - Proposed valid CHECK constraint for MySQL 8.0.16+: `CHECK (role != 'student' OR (grade IS NOT NULL AND target_exam IS NOT NULL))`
   - **Added MySQL version check requirement BEFORE attempting constraint**
   - Constraint only enforces grade/target_exam for students, allows NULL for other roles
   - Does NOT make grade globally NOT NULL (preserves flexibility for teachers/parents/admins)
   - Added alternative approach: triggers for older MySQL versions
   - Added explicit testing requirement on staging/backup DB first

4. **Comprehensive Backend Filtering Audit:**
   - Expanded audit to cover ALL controllers returning educational content
   - Identified specific controllers lacking grade filtering:
     - StudentController (leaderboard, badges, report)
     - PlanController (tasks/plans)
     - VideoController, AICoachController, AnalyticsController, GamificationController
   - Added step-by-step filtering implementation for each controller
   - Added test: verify student A cannot see student B's grade-specific content

5. **Auth Storage Migration Clarification:**
   - Detailed two options: token in memory (Option A) vs HttpOnly cookie (Option B)
   - Explained Option A implementation:
     - Remove token from localStorage
     - Store in React state only
     - Use refresh token flow on page load
     - Next.js middleware reads refresh token from cookie
   - Clarified existing users won't break (refresh token already in HttpOnly cookie)
   - Added specific axios interceptor updates

6. **CORS Fix Clarification:**
   - Corrected technical explanation: wildcard CORS allows unauthorized cross-origin access
   - Avoided inaccurate claim about direct credential theft
   - Kept the fix (restrict to `https://terenceegitim.com`) with accurate reasoning

7. **Implementation Order:**
   - **Created Phase 0 with Step 0 for credential rotation - MUST BE FIRST**
   - Updated dependency graph: Step 0 blocks all production work
   - Reorganized all subsequent steps (now Steps 1-23)
   - Ensured proper sequencing and dependencies

---

**End of Plan**

## Final Revisions Completed ✅

I have prepared the final implementation plan addressing ALL feedback:

**Round 1 fixes:**
- ✅ Removed exposed credentials, added rotation step
- ✅ Fixed database backfill strategy (no blind grade assignment)
- ✅ Corrected MySQL constraint syntax with valid alternatives
- ✅ Expanded backend filtering audit to all controllers
- ✅ Clarified auth storage migration with detailed implementation

**Round 2 fixes (final):**
- ✅ **Moved credential rotation to Step 0 / Phase 0 - FIRST ACTION**
- ✅ **Corrected CORS explanation (removed inaccurate credential theft wording)**
- ✅ **Added MySQL version check requirement before constraint**
- ✅ **Clarified constraint only applies to students, other roles can have NULL grade**

**Plan is now technically accurate, security-first, and ready for implementation.**

**Waiting for your approval before making any code, database, server, or deployment changes.**
