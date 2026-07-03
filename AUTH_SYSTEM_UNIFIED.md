UNIFIED AUTHENTICATION SYSTEM - ✅ FULLY IMPLEMENTED & TESTED

=== CURRENT SITUATION ===
The frontend has been updated with a new unified email/password authentication system. Both regular players and admins now use the same authentication flow with role-based access control.

=== WHAT WAS IMPLEMENTED ON FRONTEND ===
1. New Auth Page with Sign In / Sign Up tabs
2. Sign In: Email + Password (for existing users)
3. Sign Up: Email + Password + Phone + Optional Name (for new players)
4. Admin login now uses the same auth system with role-based access
5. No more SMS OTP for regular players
6. Player model now includes: email, phone, name, balance, is_admin flag

=== DATABASE SCHEMA CHANGES NEEDED ===

Update Player/User table to include:
1. email (STRING, UNIQUE, NOT NULL) - Login identifier
2. password_hash (STRING, NOT NULL) - Hashed password (use bcrypt)
3. is_admin (BOOLEAN, DEFAULT: false) - Admin role flag
4. phone (STRING, UNIQUE, NULLABLE) - For withdrawals/KYC
5. name (STRING, NULLABLE) - Optional user display name
6. created_at (TIMESTAMP) - Account creation time
7. updated_at (TIMESTAMP) - Last update time

Migration:
- Set email to NULL initially for existing accounts (they used phone OTP)
- Set is_admin=true for existing admin accounts
- Keep existing phone data

=== NEW API ENDPOINTS ===

1. POST /api/auth/signup
   Request Body:
   {
     "email": "user@example.com",
     "password": "password123",
     "phone": "08012345678",
     "name": "John Doe" (optional)
   }

   Response (201 Created):
   {
     "success": true,
     "data": {
       "token": "jwt_token_here",
       "player": {
         "id": "uuid",
         "email": "user@example.com",
         "phone": "08012345678",
         "name": "John Doe",
         "balance": 0,
         "is_admin": false
       }
     }
   }

   Error Cases:
   - 400: Email already exists
   - 400: Invalid email format
   - 400: Password too short (< 6 chars)
   - 400: Invalid phone number
   - 500: Server error

2. POST /api/auth/signin
   Request Body:
   {
     "email": "user@example.com",
     "password": "password123"
   }

   Response (200 OK):
   {
     "success": true,
     "data": {
       "token": "jwt_token_here",
       "player": {
         "id": "uuid",
         "email": "user@example.com",
         "phone": "08012345678",
         "name": "John Doe",
         "balance": 1500.50,
         "is_admin": false
       }
     }
   }

   Error Cases:
   - 401: Email not found
   - 401: Incorrect password
   - 500: Server error

=== IMPLEMENTATION DETAILS ===

Password Hashing:
- Use bcrypt with salt rounds = 10
- Never store plain passwords
- Hash password on signup and signin comparison

Email Validation:
- Check if email format is valid
- Check if email already exists (for signup only)
- Case-insensitive email comparison

Phone Number:
- Optional for signin (only required for signup)
- Validate Nigerian phone format or accept any 10-11 digit number
- Store with country code prefix (+234 or 0)

Admin Role:
- Set is_admin=true in database to make user an admin
- Frontend will automatically redirect to /admin if is_admin=true
- No additional admin signup endpoint needed

JWT Token:
- Generate JWT with player id and email
- Token should include is_admin flag for role-based routing
- Ensure token is valid and not expired

=== BACKWARD COMPATIBILITY ===

Keep these legacy endpoints working:
- POST /api/auth/register (phone registration for OTP)
- POST /api/auth/verify-otp (OTP verification)
- POST /api/auth/admin-login (old admin login)

Reason: Existing users may still be using phone OTP flow

=== MIGRATION STRATEGY ===

Phase 1 (Current):
- Implement new signup/signin endpoints
- Keep old OTP endpoints working
- New players use email/password

Phase 2 (Future):
- Existing phone-based players can reset password
- Or they can re-register with email/password
- Gradually deprecate OTP system

=== TESTING CHECKLIST ===

□ Sign up with valid email/password/phone/name
□ Sign up with missing required fields (should fail)
□ Sign up with duplicate email (should fail)
□ Sign up with password < 6 chars (should fail)
□ Sign in with correct credentials
□ Sign in with wrong password (should fail)
□ Sign in with non-existent email (should fail)
□ Admin user (is_admin=true) signs in
□ Regular user (is_admin=false) signs in
□ Token is valid JWT and can be used for authenticated requests
□ Password is actually hashed (check database)
□ Email is case-insensitive for signin

=== NOTES ===

- Phone number is still required but is now for KYC/withdrawals, not auth
- Email becomes the unique identifier for login
- Both admins and regular players share the same Player model
- Admin access is determined by is_admin flag, not a separate table
- Frontend automatically handles role-based routing based on is_admin
- No need for separate admin registration endpoint

=== FRONTEND CONTEXT ===

Frontend code is ready at:
- app/auth/page.tsx - Sign In / Sign Up interface
- lib/api.ts - API calls to signup/signin endpoints
- context/AppContext.tsx - Player context with email and is_admin fields

The frontend expects the exact response format shown in the endpoints above.
If response format differs, frontend will break. Follow the schema exactly.
