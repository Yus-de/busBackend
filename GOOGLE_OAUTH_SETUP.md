# Google OAuth Setup Guide

This guide will help you set up Google OAuth for login functionality.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required information
     - Add your email to test users
   - Application type: **Web application**
   - Name: Your application name
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (for development)
     - `https://yourdomain.com/auth/google/callback` (for production)
   - Click "Create"
   - Copy the **Client ID**

## Step 2: Configure Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Step 3: Frontend Integration

### React Example

```javascript
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
        }),
      });
      
      const data = await response.json();
      // Store tokens and redirect
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        console.log('Login Failed');
      }}
    />
  );
}
```

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="g_id_onload"
       data-client_id="YOUR_GOOGLE_CLIENT_ID"
       data-callback="handleCredentialResponse">
  </div>
  <div class="g_id_signin" data-type="standard"></div>

  <script>
    async function handleCredentialResponse(response) {
      const idToken = response.credential;
      
      try {
        const res = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });
        
        const data = await res.json();
        console.log('Login successful:', data);
        // Store tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  </script>
</body>
</html>
```

## Step 4: Test the Integration

1. Start your backend server
2. Use the frontend to trigger Google login
3. After successful authentication, you should receive:
   - `accessToken`: JWT access token
   - `refreshToken`: JWT refresh token
   - `user`: User information

## Troubleshooting

### "Invalid Google token" error
- Verify `GOOGLE_CLIENT_ID` matches your Google Cloud Console credentials
- Ensure the token is being sent correctly from the frontend

### "Google email is not verified" error
- The Google account must have a verified email address
- Check the user's Google account settings

### CORS errors
- Make sure your backend CORS configuration allows requests from your frontend domain
- Check `src/app.js` for CORS settings

## Security Notes

- Never expose your Google Client Secret in the frontend
- Always use HTTPS in production
- Validate tokens on the backend (already implemented)
- Store tokens securely (httpOnly cookies recommended for production)

