# Email Setup Guide for OTP

This guide will help you configure email sending for OTP verification.

## Option 1: Gmail (Development/Testing)

### Step 1: Enable App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Create a new app password for "Mail"
5. Copy the 16-character password

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=your_email@gmail.com
```

## Option 2: SendGrid (Production Recommended)

### Step 1: Create SendGrid Account

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Verify your account
3. Create an API key:
   - Go to Settings > API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the API key

### Step 2: Configure Environment Variables

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=your_verified_sender_email@yourdomain.com
```

## Option 3: AWS SES (Production)

### Step 1: Set up AWS SES

1. Go to AWS SES Console
2. Verify your email/domain
3. Get SMTP credentials:
   - Go to SMTP Settings
   - Create SMTP credentials
   - Copy username and password

### Step 2: Configure Environment Variables

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
SMTP_FROM=your_verified_email@yourdomain.com
```

## Option 4: Mailgun (Production)

### Step 1: Create Mailgun Account

1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Verify your domain
3. Get SMTP credentials from dashboard

### Step 2: Configure Environment Variables

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your_domain.mailgun.org
SMTP_PASS=your_mailgun_smtp_password
SMTP_FROM=noreply@yourdomain.com
```

## Testing Email Configuration

You can test your email setup by:

1. Starting the server
2. Making a registration request:
   ```bash
   POST /api/auth/register
   {
     "email": "test@example.com",
     "password": "password123",
     "name": "Test User"
   }
   ```
3. Check the email inbox for the OTP code

## Troubleshooting

### "Failed to send verification email" error

1. **Check SMTP credentials**: Verify all environment variables are correct
2. **Check firewall**: Ensure port 587 is not blocked
3. **Gmail specific**: Make sure you're using an App Password, not your regular password
4. **Check email limits**: Some services have sending limits for free tiers

### OTP not received

1. Check spam/junk folder
2. Verify email address is correct
3. Check SMTP logs in console
4. Ensure SMTP service is not blocking your IP

### Development Testing

For development, you can use services like:
- [Mailtrap](https://mailtrap.io/) - Catches all emails for testing
- [Ethereal Email](https://ethereal.email/) - Creates fake SMTP for testing

Example Mailtrap configuration:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
SMTP_FROM=noreply@example.com
```

## Security Best Practices

1. **Never commit credentials**: Keep `.env` file in `.gitignore`
2. **Use environment-specific configs**: Different SMTP for dev/staging/prod
3. **Rate limit OTP requests**: Already implemented with `authLimiter`
4. **OTP expiration**: OTPs expire after 10 minutes (configurable)
5. **One-time use**: OTPs can only be used once

## Customizing Email Template

Edit `src/services/otpService.js` to customize the email HTML template:

```javascript
const mailOptions = {
  // ... existing code
  html: `
    <div>
      <h2>Your Custom Template</h2>
      <p>Your OTP code is: <strong>${code}</strong></p>
    </div>
  `,
};
```

