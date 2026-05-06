# Frontend Auth Storage Migration Plan
**Priority:** 🔴 CRITICAL - Must be completed before production deployment  
**Security Issue:** Access tokens in localStorage are vulnerable to XSS attacks

---

## Current State (INSECURE)

### What's Stored in localStorage
1. `terence_token` - JWT access token (VULNERABLE to XSS)
2. `terence_user` - Complete user object including role, grade (MANIPULATABLE)

### Security Risks
- XSS attack can steal access token via `localStorage.getItem('terence_token')`
- User object in localStorage can be modified via browser console
- Frontend code trusts localStorage data without server validation

---

## Target State (SECURE)

### Token Storage
- **Access Token:** Memory-only (React state) - lost on page refresh
- **Refresh Token:** HttpOnly cookie (already implemented) - immune to XSS

### User Data
- **Never stored client-side**
- Fetched from server on mount: `await api.getMe()`
- Stored in React state only
- Refetched after any mutation

---

## Implementation Steps

### Step 12: Token Storage Migration

#### File: `web/src/lib/auth-context.tsx`

**Changes Required:**

1. **Remove localStorage token storage**
```typescript
// REMOVE these lines:
localStorage.setItem(TOKEN_KEY, token);
localStorage.getItem(TOKEN_KEY);
localStorage.removeItem(TOKEN_KEY);
```

2. **Keep token in state only**
```typescript
const [state, setState] = useState<AuthState>({
  user: null,
  token: null,  // Stored in memory only
  loading: true,
  error: null,
});
```

3. **On mount: Use refresh token to get access token**
```typescript
useEffect(() => {
  if (typeof window === "undefined") return;
  
  // Don't check localStorage - use refresh token instead
  const initAuth = async () => {
    try {
      // Call refresh endpoint (uses HttpOnly cookie automatically)
      const refreshed = await authApi.refresh();
      const newToken = refreshed.token.access_token;
      
      // Set in axios and state
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setState(s => ({ ...s, token: newToken }));
      
      // Fetch user
      const user = await authApi.getMe();
      setState({ user, token: newToken, loading: false, error: null });
    } catch {
      // No valid refresh token - user not logged in
      setState({ user: null, token: null, loading: false, error: null });
    }
  };
  
  initAuth();
}, []);
```

4. **On login: Store token in state only**
```typescript
const login = useCallback(async (email: string, password: string) => {
  // ... existing validation ...
  
  const res = await authApi.login(email, password);
  const user = res.user as User;
  const token = res.token.access_token;
  
  // REMOVE localStorage.setItem calls
  // Store in state and axios only
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  setState({ user, token, loading: false, error: null });
}, []);
```

5. **On logout: Clear state and call logout endpoint**
```typescript
const logout = useCallback(async () => {
  try {
    await authApi.logout(); // Clears refresh token cookie
  } catch (e) {
    console.error('Logout failed:', e);
  }
  
  // REMOVE localStorage.removeItem calls
  // Clear state and axios
  delete api.defaults.headers.common['Authorization'];
  setState({ user: null, token: null, loading: false, error: null });
  
  // Optional: broadcast to other tabs
  localStorage.setItem('logout-event', Date.now().toString());
}, []);
```

### Step 13: Next.js Middleware (Server-Side Auth)

#### File: `web/src/middleware.ts` (NEW)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token');
  const { pathname } = request.nextUrl;
  
  // Protected routes
  const protectedPrefixes = ['/ogrenci', '/ogretmen', '/admin', '/veli'];
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));
  
  // Public routes
  const publicRoutes = ['/giris', '/kayit', '/sifremi-unuttum', '/'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/_next');
  
  if (isProtectedRoute && !refreshToken) {
    // No refresh token - redirect to login
    return NextResponse.redirect(new URL('/giris', request.url));
  }
  
  if (pathname === '/giris' && refreshToken) {
    // Already logged in - redirect to appropriate dashboard
    // Note: We can't decode JWT here without access to JWT_SECRET
    // So we redirect to a default and let client-side handle it
    return NextResponse.redirect(new URL('/ogrenci', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Step 14: Remove User from localStorage

#### File: `web/src/lib/auth-context.tsx`

**Changes:**

1. **Remove USER_KEY completely**
```typescript
// DELETE this line:
const USER_KEY = "terence_user";
```

2. **Never store user in localStorage**
```typescript
// REMOVE all lines like:
localStorage.setItem(USER_KEY, JSON.stringify(user));
localStorage.getItem(USER_KEY);
localStorage.removeItem(USER_KEY);
```

3. **Fetch user on mount (already done in Step 12)**

4. **Update updateUser function**
```typescript
const updateUser = useCallback((user: User) => {
  // REMOVE localStorage.setItem
  // Only update state
  setState((s) => ({ ...s, user }));
}, []);
```

### Step 15: Auth State Synchronization

#### File: `web/src/lib/auth-context.tsx`

**Add:**

1. **Refetch user after profile updates**
```typescript
// In components that call api.updateProfile:
const handleProfileUpdate = async (data) => {
  await api.updateProfile(data);
  // Refetch user to get latest data from server
  const freshUser = await api.getMe();
  updateUser(freshUser);
};
```

2. **Multi-tab logout synchronization**
```typescript
// In AuthProvider:
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'logout-event') {
      // Another tab logged out - clear state here too
      setState({ user: null, token: null, loading: false, error: null });
      delete api.defaults.headers.common['Authorization'];
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

3. **Clear all state on logout**
```typescript
const logout = useCallback(async () => {
  try {
    await authApi.logout();
  } catch (e) {
    console.error('Logout failed:', e);
  }
  
  // Clear axios
  delete api.defaults.headers.common['Authorization'];
  
  // Clear state
  setState({ user: null, token: null, loading: false, error: null });
  
  // Clear any sessionStorage
  sessionStorage.clear();
  
  // Broadcast to other tabs
  localStorage.setItem('logout-event', Date.now().toString());
  
  // Navigate to login
  window.location.href = '/giris';
}, []);
```

---

## Testing Checklist

### After Implementation

- [ ] Login works - token stored in memory only
- [ ] Page refresh - user stays logged in (via refresh token)
- [ ] Logout works - refresh token cookie cleared
- [ ] Multi-tab logout - all tabs log out simultaneously
- [ ] Profile update - user data refetches from server
- [ ] Direct URL access to protected route - redirects to /giris
- [ ] Inspect localStorage - NO terence_token or terence_user visible
- [ ] Inspect Application > Cookies - refresh_token present (HttpOnly)
- [ ] Browser console: try `localStorage.getItem('terence_token')` → null
- [ ] XSS test: inject `<script>alert(localStorage.getItem('terence_token'))</script>` → null

---

## Rollback Plan

If auth breaks after migration:

1. Revert `auth-context.tsx` to previous version
2. Revert `middleware.ts` (delete file)
3. Redeploy
4. Users may need to log in again

---

## Estimated Effort

- **Step 12:** 1-2 hours (token storage migration)
- **Step 13:** 30 minutes (Next.js middleware)
- **Step 14:** 15 minutes (remove USER_KEY)
- **Step 15:** 30 minutes (sync fixes)
- **Testing:** 1 hour (comprehensive testing)

**Total:** 3-4 hours

---

## Status

- [ ] Step 12: Token storage migration
- [ ] Step 13: Next.js middleware
- [ ] Step 14: Remove user from localStorage
- [ ] Step 15: Auth state synchronization
- [ ] Testing complete
- [ ] Production ready

**BLOCKER:** This MUST be completed before production deployment.

---

## References

- Current file: `web/src/lib/auth-context.tsx`
- API file: `web/src/lib/api.ts`
- Backend refresh endpoint: `/api/v1/auth/refresh` (POST)
- Backend logout endpoint: `/api/v1/auth/logout` (POST)
