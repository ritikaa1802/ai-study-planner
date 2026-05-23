# Authentication Token Error Fix

## Problem
You're seeing "Invalid token (status 401)" error on the dashboard.

## Root Causes
This error can occur due to:
1. **Expired Token**: Token was generated but has expired (7 day expiration)
2. **Environment Variables**: JWT_SECRET not loaded correctly in server
3. **Stale Token**: Token in localStorage is from a previous session with different secret
4. **Server Configuration**: Mismatch between frontend and backend JWT configuration

## Solution Steps

### Step 1: Clear Browser Data
1. Open **Developer Tools** (F12)
2. Go to **Application** tab
3. Under **Storage** → **Local Storage** → select your domain
4. Find and delete the `token` entry
5. Also delete `studyflow_api_base` if present

### Step 2: Clear Browser Cache
- Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
- Select "Cookies and other site data"
- Click "Clear data"

### Step 3: Refresh and Log In Again
1. Refresh the page (F5)
2. You'll be sent to the login page
3. Log in with your credentials
4. The system will generate a fresh token with correct JWT_SECRET

### Step 4: Verify Configuration
Check that both backend and frontend have matching JWT configuration:

**Backend (.env)**:
```
JWT_SECRET=supersecretkey
JWT_REFRESH_SECRET=refreshsecretkey123
```

**Frontend (.env and .env.local)**:
```
JWT_SECRET=supersecretkey
JWT_REFRESH_SECRET=refreshsecretkey123
```

## Verification
After logging in, you should see:
1. Dashboard loads without "Invalid token" error
2. User profile displays correctly
3. Activity data loads
4. No error banner at the top

## If Problem Persists

### Check Server Logs
1. Check backend console for JWT validation errors
2. Look for "[Auth Error]" messages in logs

### Verify Environment Variables
```bash
# In backend directory
echo $JWT_SECRET  # Should output: supersecretkey

# In next-frontend directory
echo $JWT_SECRET  # Should output: supersecretkey
```

### Restart Services
1. Stop the backend server
2. Stop the frontend server
3. Clear node_modules cache:
   ```bash
   cd backend && npm cache clean --force
   cd ../next-frontend && npm cache clean --force
   ```
4. Restart both servers
5. Clear browser cache again
6. Log in

## Technical Details

### Authentication Flow
1. User logs in → Backend generates JWT token with JWT_SECRET
2. Token stored in localStorage
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend verifies token using same JWT_SECRET
5. If secrets don't match → 401 error

### Token Structure
- Format: `Bearer <JWT>`
- Payload: `{ userId: number }`
- Expiration: 7 days
- Algorithm: HS256 (default)

### Debugging
Set `skipAuthRedirect: true` in API calls to see detailed error messages in browser console.

## Prevention
To prevent future issues:
- Ensure `.env` files are loaded before server starts
- Don't change JWT_SECRET in production while users have active tokens
- Implement token refresh endpoint for long-lived sessions
- Add token rotation for enhanced security
