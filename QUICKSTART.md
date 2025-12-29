# 🚀 Quick Start Guide

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://username:password@localhost:5432/bus_db

JWT_ACCESS_SECRET=your_super_secret_access_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

SEAT_LOCK_DURATION=10

PAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

**Important:** Replace the database credentials and JWT secrets with your own values!

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database migration
npm run prisma:migrate

# (Optional) Seed sample data
npm run seed
```

### 4. Create Admin User

```bash
npm run create:admin
```

Or with custom credentials:

```bash
node scripts/createAdmin.js admin@example.com admin123 "Admin Name"
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

### 6. Test the API

#### Health Check

```bash
curl http://localhost:5000/health
```

#### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response for authenticated requests.

#### Search Routes

```bash
curl "http://localhost:5000/api/routes/search?source=New York&destination=Boston&date=2024-01-15"
```

## Next Steps

1. Explore the API using Postman or Thunder Client
2. Check out `README.md` for full API documentation
3. Use Prisma Studio to view your database: `npm run prisma:studio`

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify your `DATABASE_URL` in `.env` is correct
- Check if the database exists: `createdb bus_db` (PostgreSQL)

### Port Already in Use

- Change the `PORT` in `.env` file
- Or kill the process using port 5000

### Prisma Errors

- Run `npm run prisma:generate` again
- Check your `DATABASE_URL` format
- Ensure migrations are up to date: `npm run prisma:migrate`

## Need Help?

- Check the main `README.md` for detailed documentation
- Review the API endpoints in the README
- Check Prisma documentation: https://www.prisma.io/docs

