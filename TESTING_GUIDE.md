# BITLYFE - Testing Guide

## Current Status
✅ Frontend: Complete and production-ready
⏳ Backend API: Mock endpoints returning empty data
⏳ Payment Gateway: Integrated with Paystack test keys

## How to Test

### 1. Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

### 2. Authentication
- Sign up page: `/auth`
- Test credentials can be any email/password
- Currently returns mock player data

### 3. Available Games Page
- Navigate to: `/format` (after login)
- Shows "Available Games" heading
- Currently empty (waiting for backend games)

### 4. Logout
- Click logout button in top-right navbar
- Redirects to auth page

## Integration with Your Backend

### Replace Mock Endpoints

Currently these files return empty data and need your backend:

1. **`app/api/game/doors/route.ts`**
   - Replace with call to: `GET /api/doors`
   - Expected response: `{ success: true, data: [] }`

2. **`app/api/admin/games/route.ts`**
   - Replace with call to: `GET /api/games`
   - Expected response: `{ success: true, data: { games: [] } }`

3. **Authentication Endpoints**
   - `app/api/auth/signin/route.ts` - POST
   - `app/api/auth/signup/route.ts` - POST
   - Should set JWT token in localStorage

### Environment Variables

```
NEXT_PUBLIC_API_URL=http://your-backend-api.com
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```

## Paystack Payment Testing

### Test Card Details
- Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 01/25)
- CVC: Any 3 digits (e.g., 123)

### Test Amounts
Any amount will work in test mode.

### Paystack Dashboard
- View test transactions: https://dashboard.paystack.com

## API Structure

The app uses a centralized API client in `lib/api.ts` with methods:

```typescript
adminApi.getGames()           // List games
adminApi.getSettings()        // Get app settings
gameApi.getDoors()            // Get door games
gameApi.play(doorId)          // Enter a door game
authApi.signin(email, pass)   // Login
authApi.signup(data)          // Register
```

## Key Files

- **Auth**: `app/auth/page.tsx`, `context/AppContext.tsx`
- **Games**: `app/format/page.tsx`, `app/doors/page.tsx`
- **NavBar**: `components/ui/NavBar.tsx` (logout button)
- **API Client**: `lib/api.ts`

## Next Steps

1. Deploy backend API
2. Update `NEXT_PUBLIC_API_URL` to point to backend
3. Implement real endpoints in backend
4. Update mock API routes to call backend
5. Test full flow end-to-end
6. Deploy to Vercel

## Deployment

See `DEPLOYMENT.md` for Vercel deployment instructions.
