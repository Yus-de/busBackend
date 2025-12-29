# 🚌 Bus Ticket Booking Backend (Express.js)

A **production-ready backend API** for a Bus Ticket Booking System built with **Express.js**. This project is designed to reflect **real-world booking systems** with proper authentication, seat locking, payments, and admin control.

---

## 🎯 Project Goals

* Build a **scalable & secure** booking backend
* Handle **real-time seat availability** safely
* Support **role-based access** (Admin / User)
* Serve as a **portfolio-level or startup-ready backend**

---

## 🚀 Features

### 🔐 Authentication & Security

* User registration & login
* JWT access & refresh tokens
* Role-based authorization (ADMIN, USER)
* Password hashing (bcrypt)
* Rate limiting & request validation

---

### 👤 User Features

* Search buses by route & date
* View seat availability
* Book one or multiple seats
* Booking history
* Cancel bookings (with rules)

---

### 🚌 Bus & Route Management (Admin)

* Create/update/delete buses
* Define seat layouts per bus
* Create routes (source → destination)
* Assign schedules to routes

---

### 💺 Seat & Booking System (Core Logic)

* Real-time seat availability
* **Seat locking (time-limited hold)**
* Prevent double booking (DB transactions)
* Booking expiration if payment fails
* Booking status lifecycle:

  * PENDING
  * CONFIRMED
  * CANCELLED
  * EXPIRED

---

### 💳 Payment Handling

* Payment intent creation
* Payment status tracking
* Webhook-ready payment confirmation
* Automatic seat release on failure
* Refund handling (optional)

---

### 🎫 Ticketing

* Ticket generation after payment
* Unique ticket reference number
* QR code ready (extendable)

---

### 📊 Admin & Reports

* View all bookings
* Revenue reports
* Manage users
* Popular routes analytics

---

## 🛠 Tech Stack

* **Node.js**
* **Express.js**
* **PostgreSQL** (recommended) or MongoDB
* **Prisma** (ORM)
* **JWT** (Auth)
* **bcryptjs** (Security)
* **Zod** (Validation)
* **dotenv** (Environment config)
* **Morgan** (Logging)

---

## 📁 Project Structure

```
bus-ticket-backend/
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   ├── models/
│   ├── utils/
│   ├── validations/
│   ├── config/
│   ├── app.js
│   └── server.js
│
├── prisma/
│   └── schema.prisma
│
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd bus-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bus_db

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Seat Lock Duration (in minutes)
SEAT_LOCK_DURATION=10

# Payment
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Set up the database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 5. Start the server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs at:

```
http://localhost:5000
```

---

## 📌 API Endpoints

### 🔐 Auth

```
POST   /api/auth/register      - Register a new user
POST   /api/auth/login         - Login user
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/logout        - Logout user
```

### 👤 Users

```
GET    /api/users/me           - Get current user profile
GET    /api/users/bookings     - Get user's bookings
```

### 🚌 Buses (Admin)

```
POST   /api/buses              - Create a bus (Admin only)
GET    /api/buses              - Get all buses
GET    /api/buses/:id          - Get bus by ID
PUT    /api/buses/:id          - Update bus (Admin only)
DELETE /api/buses/:id          - Delete bus (Admin only)
```

### 🛣 Routes & Schedules

```
POST   /api/routes             - Create a route (Admin only)
GET    /api/routes/search      - Search routes by source, destination, date
GET    /api/routes             - Get all routes
GET    /api/routes/:id         - Get route by ID

POST   /api/schedules          - Create a schedule (Admin only)
GET    /api/schedules          - Get all schedules
```

### 💺 Seats

```
GET    /api/seats/availability?scheduleId=xxx  - Get seat availability
```

### 🎫 Bookings

```
POST   /api/bookings           - Create a booking (requires auth)
GET    /api/bookings/my        - Get user's bookings
GET    /api/bookings/:id       - Get booking by ID
DELETE /api/bookings/:id       - Cancel booking
```

### 💳 Payments

```
POST   /api/payments           - Create payment intent
POST   /api/payments/confirm   - Confirm payment
POST   /api/payments/webhook   - Payment webhook
```

### 📊 Admin

```
GET    /api/admin/bookings     - Get all bookings (Admin only)
GET    /api/admin/revenue      - Get revenue report (Admin only)
GET    /api/admin/users        - Get all users (Admin only)
DELETE /api/admin/bookings/:id - Cancel any booking (Admin only)
```

---

## 🧪 Testing

```bash
npm test
```

Recommended tools:

* Postman
* Thunder Client
* Insomnia

---

## 🔒 Key Engineering Concepts Used

* Database transactions
* Seat-locking mechanism
* Stateless authentication
* Role-based route protection
* Scalable folder structure
* Error handling middleware
* Request validation
* Rate limiting

---

## 📝 Example API Usage

### Register a User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Search Routes

```bash
GET /api/routes/search?source=New York&destination=Boston&date=2024-01-15
```

### Create Booking

```bash
POST /api/bookings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "scheduleId": "schedule-uuid",
  "seatIds": ["seat-uuid-1", "seat-uuid-2"]
}
```

### Confirm Payment

```bash
POST /api/payments/confirm
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "paymentId": "payment-uuid",
  "transactionId": "txn_123456789"
}
```

---

## 🔧 Creating an Admin User

To create an admin user, you can use Prisma Studio or run a script:

```javascript
// scripts/createAdmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  
  console.log('Admin created:', admin);
}

createAdmin();
```

---

## 📈 Future Enhancements

* WebSocket live seat updates
* Redis caching
* SMS / Email notifications
* QR code ticket scanning
* Promo codes & discounts
* Multi-currency support
* Advanced analytics dashboard

---

## 🤝 Contributing

Pull requests are welcome. Open an issue to discuss major changes.

---

## 📄 License

MIT License

---

## ✨ Author

Built with ❤️ using Express.js

