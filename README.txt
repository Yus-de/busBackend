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
* **Prisma** or Mongoose
* **JWT** (Auth)
* **bcrypt** (Security)
* **Zod / Joi** (Validation)
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
│   └── app.js
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

```bash
git clone https://github.com/your-username/bus-ticket-backend.git
cd bus-ticket-backend
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/bus_db
JWT_ACCESS_SECRET=access_secret
JWT_REFRESH_SECRET=refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

---

## ▶️ Running the Server

```bash
npm run dev   # development
npm start     # production
```

Server runs at:

```
http://localhost:5000
```

---

## 📌 API Endpoints

### 🔐 Auth

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### 👤 Users

```
GET    /api/users/me
GET    /api/users/bookings
```

### 🚌 Buses (Admin)

```
POST   /api/buses
GET    /api/buses
PUT    /api/buses/:id
DELETE /api/buses/:id
```

### 🛣 Routes & Schedules

```
POST   /api/routes
GET    /api/routes/search
```

### 💺 Seats

```
GET    /api/seats/availability
```

### 🎫 Bookings

```
POST   /api/bookings
GET    /api/bookings/my
DELETE /api/bookings/:id
```

---

## 🧪 Testing

```bash
npm test
```

Recommended tools:

* Postman
* Thunder Client

---

## 🔒 Key Engineering Concepts Used

* Database transactions
* Seat-locking mechanism
* Stateless authentication
* Role-based route protection
* Scalable folder structure

---

## 📈 Future Enhancements

* WebSocket live seat updates
* Redis caching
* SMS / Email notifications
* QR code ticket scanning
* Promo codes & discounts

---

## 🤝 Contributing

Pull requests are welcome. Open an issue to discuss major changes.

---

## 📄 License

MIT License

---

## ✨ Author

Built with ❤️ using Express.js
