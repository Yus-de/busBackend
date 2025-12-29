# 🎉 New Features: Email OTP Verification & Google OAuth

## Overview

The authentication system has been enhanced with:
1. **Email OTP Verification** - Users must verify their email before they can log in
2. **Google OAuth Login** - Users can sign in with their Google account

---

## 📧 Email OTP Verification

### Registration Flow

1. **User registers** → Account created but email not verified
2. **OTP sent automatically** → 6-digit code sent to user's email
3. **User verifies email** → Enters OTP code
4. **Account activated** → User receives access tokens

### API Endpoints

#### 1. Register (Updated)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false
    },
    "message": "OTP sent to your email",
    "expiresIn": 600
  }
}
```

#### 2. Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": true
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### 3. Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 4. Send OTP (Manual)
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### OTP Details

- **Length**: 6 digits
- **Expiration**: 10 minutes
- **One-time use**: Each OTP can only be used once
- **Rate limited**: Prevents spam

---

## 🔐 Google OAuth Login

### How It Works

1. **Frontend**: User clicks "Sign in with Google"
2. **Google**: User authenticates with Google
3. **Frontend**: Receives Google ID token
4. **Backend**: Verifies token and creates/logs in user
5. **Response**: Returns JWT tokens

### API Endpoint

```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_from_frontend"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "name": "John Doe",
      "emailVerified": true
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Features

- ✅ Automatic account creation if user doesn't exist
- ✅ Email automatically verified (Google emails are pre-verified)
- ✅ Links Google account to existing email account
- ✅ No password required for Google OAuth users

---

## 🔄 Updated Login Flow

### Regular Login (Email/Password)

Users can only login if:
- ✅ Email is verified
- ✅ Password is correct
- ✅ Account exists

**Error if email not verified:**
```json
{
  "success": false,
  "message": "Please verify your email before logging in"
}
```

### Google Login

- ✅ Works immediately (no email verification needed)
- ✅ Creates account automatically
- ✅ Links to existing account if email matches

---

## 📋 Database Changes

### User Model Updates

- `emailVerified`: Boolean (default: false)
- `googleId`: String? (unique, for Google OAuth users)
- `password`: String? (optional, null for Google OAuth users)

### New OTP Model

- Stores OTP codes with expiration
- Indexed for fast lookups
- Auto-cleanup of expired OTPs

---

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. Configure Environment Variables

Add to `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Setup Email

See `EMAIL_SETUP.md` for detailed email configuration guide.

### 5. Setup Google OAuth

See `GOOGLE_OAUTH_SETUP.md` for detailed Google OAuth setup guide.

---

## 🔒 Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **One-time Use**: Each OTP can only be used once
3. **Rate Limiting**: Prevents OTP spam
4. **Email Verification Required**: Users must verify before login
5. **Google Token Verification**: Backend verifies Google tokens
6. **Automatic Cleanup**: Expired OTPs are automatically deleted

---

## 📝 Example Frontend Flow

### Registration with OTP

```javascript
// 1. Register
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe'
  })
});

// 2. User receives OTP in email
// 3. User enters OTP

// 4. Verify email
const verifyResponse = await fetch('/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    otp: '123456'
  })
});

const { accessToken, refreshToken } = await verifyResponse.json();
// Store tokens and redirect to dashboard
```

### Google Login

```javascript
// After user authenticates with Google and receives idToken
const googleLoginResponse = await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    idToken: googleIdToken
  })
});

const { accessToken, refreshToken } = await googleLoginResponse.json();
// Store tokens and redirect to dashboard
```

---

## 🐛 Troubleshooting

### OTP Not Received

1. Check spam folder
2. Verify SMTP configuration
3. Check email address is correct
4. Try resend OTP endpoint

### Google Login Fails

1. Verify `GOOGLE_CLIENT_ID` is correct
2. Check Google token is being sent correctly
3. Ensure Google account email is verified
4. Check CORS settings

### Email Verification Required Error

- User must verify email before login
- Use `/api/auth/verify-email` endpoint
- Or use Google login (auto-verified)

---

## 📚 Additional Documentation

- `EMAIL_SETUP.md` - Email configuration guide
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth setup guide
- `API_DOCUMENTATION.md` - Complete API reference

---

## ✨ Benefits

1. **Security**: Email verification prevents fake accounts
2. **User Experience**: Google login is faster and easier
3. **Flexibility**: Users can choose email/password or Google
4. **Reliability**: OTP system ensures valid email addresses

