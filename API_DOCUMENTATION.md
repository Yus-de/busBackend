# 📚 API Documentation

Complete API reference for the Bus Ticket Booking Backend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
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
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "USER"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

### Login

**POST** `/api/auth/login`

Authenticate and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
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
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

### Refresh Token

**POST** `/api/auth/refresh`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

---

### Logout

**POST** `/api/auth/logout`

Invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

---

## 👤 User Endpoints

### Get Current User

**GET** `/api/users/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "USER"
  }
}
```

---

### Get User Bookings

**GET** `/api/users/bookings`

Get all bookings for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "CONFIRMED",
      "totalAmount": 91.98,
      "ticketNumber": "TKT-XXX-XXX",
      "schedule": {
        "id": "uuid",
        "departureTime": "2024-01-15T08:00:00Z",
        "arrivalTime": "2024-01-15T12:00:00Z",
        "price": 45.99,
        "bus": {
          "busNumber": "BUS-001",
          "busName": "Luxury Express"
        },
        "route": {
          "source": "New York",
          "destination": "Boston"
        }
      },
      "seats": [
        {
          "seat": {
            "seatNumber": "1A"
          }
        }
      ]
    }
  ]
}
```

---

## 🚌 Bus Endpoints

### Get All Buses

**GET** `/api/buses`

Get list of all buses.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "busNumber": "BUS-001",
      "busName": "Luxury Express",
      "totalSeats": 40,
      "seatLayout": {
        "rows": 10,
        "seatsPerRow": 4,
        "layout": "2x2"
      },
      "amenities": ["AC", "WiFi", "Charging"]
    }
  ]
}
```

---

### Get Bus by ID

**GET** `/api/buses/:id`

Get bus details.

---

### Create Bus (Admin Only)

**POST** `/api/buses`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "busNumber": "BUS-003",
  "busName": "Comfort Plus",
  "totalSeats": 45,
  "seatLayout": {
    "rows": 9,
    "seatsPerRow": 5,
    "layout": "3x2"
  },
  "amenities": ["AC", "WiFi"]
}
```

---

### Update Bus (Admin Only)

**PUT** `/api/buses/:id`

Update bus information.

---

### Delete Bus (Admin Only)

**DELETE** `/api/buses/:id`

Delete a bus.

---

## 🛣 Route Endpoints

### Search Routes

**GET** `/api/routes/search?source=New York&destination=Boston&date=2024-01-15`

Search for routes by source, destination, and date.

**Query Parameters:**
- `source` (required): Source city
- `destination` (required): Destination city
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "source": "New York",
      "destination": "Boston",
      "distance": 306.5,
      "duration": 240,
      "schedules": [
        {
          "id": "uuid",
          "departureTime": "2024-01-15T08:00:00Z",
          "arrivalTime": "2024-01-15T12:00:00Z",
          "price": 45.99,
          "bus": {
            "busNumber": "BUS-001",
            "busName": "Luxury Express"
          }
        }
      ]
    }
  ]
}
```

---

### Create Route (Admin Only)

**POST** `/api/routes`

**Request Body:**
```json
{
  "source": "New York",
  "destination": "Boston",
  "distance": 306.5,
  "duration": 240
}
```

---

## 📅 Schedule Endpoints

### Get Schedules

**GET** `/api/schedules?routeId=uuid&date=2024-01-15&isActive=true`

Get schedules with optional filters.

**Query Parameters:**
- `routeId` (optional): Filter by route
- `busId` (optional): Filter by bus
- `date` (optional): Filter by date (YYYY-MM-DD)
- `isActive` (optional): Filter by active status

---

### Create Schedule (Admin Only)

**POST** `/api/schedules`

**Request Body:**
```json
{
  "busId": "uuid",
  "routeId": "uuid",
  "departureTime": "2024-01-15T08:00:00Z",
  "arrivalTime": "2024-01-15T12:00:00Z",
  "price": 45.99
}
```

---

## 💺 Seat Endpoints

### Get Seat Availability

**GET** `/api/seats/availability?scheduleId=uuid`

Get seat availability for a schedule.

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": {
      "id": "uuid",
      "departureTime": "2024-01-15T08:00:00Z",
      "price": 45.99,
      "bus": {
        "busNumber": "BUS-001"
      },
      "route": {
        "source": "New York",
        "destination": "Boston"
      }
    },
    "seats": [
      {
        "id": "uuid",
        "seatNumber": "1A",
        "isAvailable": true,
        "isLocked": false
      },
      {
        "id": "uuid",
        "seatNumber": "1B",
        "isAvailable": false,
        "isLocked": true,
        "lockedUntil": "2024-01-14T10:15:00Z"
      }
    ]
  }
}
```

---

## 🎫 Booking Endpoints

### Create Booking

**POST** `/api/bookings`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "scheduleId": "uuid",
  "seatIds": ["seat-uuid-1", "seat-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully. Please complete payment.",
  "data": {
    "booking": {
      "id": "uuid",
      "status": "PENDING",
      "totalAmount": 91.98,
      "ticketNumber": "TKT-XXX-XXX",
      "expiresAt": "2024-01-14T10:15:00Z"
    },
    "payment": {
      "id": "uuid",
      "amount": 91.98,
      "status": "PENDING"
    }
  }
}
```

---

### Get My Bookings

**GET** `/api/bookings/my`

Get all bookings for authenticated user.

---

### Get Booking by ID

**GET** `/api/bookings/:id`

Get booking details.

---

### Cancel Booking

**DELETE** `/api/bookings/:id`

Cancel a booking.

---

## 💳 Payment Endpoints

### Create Payment Intent

**POST** `/api/payments`

**Request Body:**
```json
{
  "bookingId": "uuid",
  "paymentMethod": "card"
}
```

---

### Confirm Payment

**POST** `/api/payments/confirm`

**Request Body:**
```json
{
  "paymentId": "uuid",
  "transactionId": "txn_123456789"
}
```

---

### Payment Webhook

**POST** `/api/payments/webhook`

Webhook endpoint for payment gateway callbacks.

**Request Body:**
```json
{
  "paymentId": "uuid",
  "status": "completed",
  "transactionId": "txn_123456789"
}
```

---

## 📊 Admin Endpoints

### Get All Bookings

**GET** `/api/admin/bookings?status=CONFIRMED&userId=uuid`

Get all bookings with optional filters.

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, CONFIRMED, CANCELLED, EXPIRED)
- `userId` (optional): Filter by user ID

---

### Get Revenue Report

**GET** `/api/admin/revenue?startDate=2024-01-01&endDate=2024-01-31`

Get revenue analytics.

**Query Parameters:**
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 5000.50,
    "bookingCount": 120,
    "routeRevenue": [
      {
        "route": {
          "source": "New York",
          "destination": "Boston"
        },
        "revenue": 2500.25,
        "bookings": 60
      }
    ],
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }
}
```

---

### Get All Users

**GET** `/api/admin/users`

Get list of all users.

---

### Cancel Booking (Admin)

**DELETE** `/api/admin/bookings/:id`

Cancel any booking (admin override).

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "path": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- Authentication endpoints: 5 requests per 15 minutes
- Other endpoints: 100 requests per 15 minutes

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all IDs
- Seat locks expire after 10 minutes (configurable)
- Bookings expire if payment is not completed within the lock duration

