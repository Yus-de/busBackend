# Password Reset Flow - Updated Implementation

## Overview
The password reset flow has been updated to use a **two-step verification process** with a verification token to prevent OTP consumption issues.

## New Flow

### Step 1: Request OTP
**Endpoint:** `POST /api/auth/forgot-password`
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset OTP sent to your email",
  "expiresIn": 600
}
```

### Step 2: Verify OTP (Get Verification Token)
**Endpoint:** `POST /api/auth/verify-otp`
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "valid": true,
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "OTP verified successfully. Use the verification token to reset your password."
}
```

**What happens:**
- OTP is validated against the database
- OTP is marked as `isUsed: true` (consumed)
- A JWT verification token is generated (expires in 15 minutes)
- The verification token is returned to the client

### Step 3: Reset Password
**Endpoint:** `POST /api/auth/reset-password`
```json
{
  "email": "user@example.com",
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

**What happens:**
- Verification token is validated (JWT signature + OTP status check)
- New password is hashed
- Password is updated in the database
- Operation completes successfully

## Security Features

1. **OTP Consumption**: OTP is consumed immediately after verification in Step 2, preventing reuse
2. **Verification Token**: JWT-based token that:
   - Expires in 15 minutes
   - Contains OTP ID reference
   - Can only be used once (validated against OTP status)
3. **Email Matching**: Token contains email, ensuring it can only be used with the correct email
4. **No Direct OTP in Reset**: The actual OTP is never sent in the reset password request

## Why This Approach?

### Previous Problem
- User calls `/verify-otp` → OTP gets consumed
- User calls `/reset-password` with same OTP → Error: "Invalid or expired OTP"
- Users had to request new OTP every time

### New Solution
- User calls `/verify-otp` → OTP gets consumed, but receives a verification token
- User calls `/reset-password` with verification token → Success!
- Verification token acts as proof that OTP was validated
- Token is time-limited (15 minutes) for security

## API Changes

### Modified Endpoints
- `POST /api/auth/verify-otp` - Now returns verification token
- `POST /api/auth/reset-password` - Now accepts `verificationToken` instead of `otp`

### New Fields
- **Request**: `verificationToken` (in reset-password)
- **Response**: `verificationToken` (in verify-otp)

## Migration Guide

### Old Flow (No Longer Works)
```javascript
// Step 1: Request OTP
POST /forgot-password { email }

// Step 2: Reset password directly with OTP
POST /reset-password { 
  email, 
  otp: "123456",  // ❌ This no longer works
  newPassword 
}
```

### New Flow (Current)
```javascript
// Step 1: Request OTP
POST /forgot-password { email }

// Step 2: Verify OTP and get token
POST /verify-otp { 
  email, 
  otp: "123456" 
}
// Response includes verificationToken

// Step 3: Reset password with verification token
POST /reset-password { 
  email, 
  verificationToken: "eyJ...",  // ✅ Use this instead
  newPassword 
}
```

## Frontend Implementation Example

```javascript
// Step 1: Request OTP
const forgotResponse = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email })
});

// Step 2: User enters OTP, verify it
const verifyResponse = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  body: JSON.stringify({ 
    email, 
    otp: userInputOTP 
  })
});
const { verificationToken } = await verifyResponse.json();

// Step 3: Reset password with verification token
const resetResponse = await fetch('/api/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ 
    email, 
    verificationToken,
    newPassword 
  })
});
```

## Benefits

✅ **No OTP Reuse**: OTP is consumed immediately after verification
✅ **Secure**: Verification token is time-limited and single-use
✅ **User-Friendly**: Users don't need to re-request OTP if they make a mistake
✅ **Flexible**: Verification token can be used within 15-minute window
✅ **Traceable**: Each verification token is linked to a specific OTP record