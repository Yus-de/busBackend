# 💳 Payment Collector Feature

## Overview

The payment system now supports multiple payment collection methods and restricts payment confirmation to authorized personnel (Cashiers and Admins).

---

## 🔐 Role-Based Payment Confirmation

### Who Can Confirm Payments?

- ✅ **CASHIER** - Can confirm payments
- ✅ **ADMIN** - Can confirm payments (full access)
- ❌ **USER** - Cannot confirm payments

---

## 📋 Payment Collectors

The system now tracks who or what collected the payment:

### Available Collectors

1. **CASHIER** - Payment collected by cashier at counter
2. **BANK** - Payment made through bank transfer
3. **ONLINE** - Payment made through online gateway (webhook)
4. **MOBILE_BANKING** - Payment via mobile banking app
5. **CARD** - Card payment at terminal

---

## 🗄️ Database Changes

### New Fields in Payment Model

- `collector` - Type of payment collector (enum)
- `collectorId` - ID of cashier/admin who confirmed (if collector is CASHIER)
- `bankReference` - Bank transaction reference (if collector is BANK)

### New User Role

- `CASHIER` - Role for payment collection staff

---

## 📡 API Endpoints

### Confirm Payment (Updated)

**POST** `/api/payments/confirm`

**Authorization:** Required (CASHIER or ADMIN only)

**Request Body:**
```json
{
  "paymentId": "uuid",
  "transactionId": "TXN123456",
  "collector": "CASHIER",  // or "BANK", "ONLINE", "MOBILE_BANKING", "CARD"
  "bankReference": "BANK123456"  // Required if collector is "BANK"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "amount": 100.00,
    "status": "COMPLETED",
    "collector": "CASHIER",
    "collectorId": "cashier-user-id",
    "transactionId": "TXN123456",
    "paidAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

- `403 Forbidden` - If user is not CASHIER or ADMIN
- `400 Bad Request` - If bankReference is missing when collector is BANK

---

## 🔧 Usage Examples

### Example 1: Cashier Confirms Payment

```javascript
// Cashier logs in and confirms payment
POST /api/payments/confirm
Authorization: Bearer <cashier_token>

{
  "paymentId": "payment-uuid",
  "transactionId": "CASH-001",
  "collector": "CASHIER"
}
```

**Result:**
- Payment status → COMPLETED
- Collector → CASHIER
- CollectorId → Cashier's user ID (automatically set)
- Booking → Confirmed

---

### Example 2: Bank Transfer Payment

```javascript
// Admin confirms bank transfer payment
POST /api/payments/confirm
Authorization: Bearer <admin_token>

{
  "paymentId": "payment-uuid",
  "transactionId": "BANK-TXN-123",
  "collector": "BANK",
  "bankReference": "BANK123456789"
}
```

**Result:**
- Payment status → COMPLETED
- Collector → BANK
- BankReference → BANK123456789
- Booking → Confirmed

---

### Example 3: Online Payment (Webhook)

```javascript
// Payment gateway webhook
POST /api/payments/webhook

{
  "paymentId": "payment-uuid",
  "status": "completed",
  "transactionId": "PG-TXN-789"
}
```

**Result:**
- Payment status → COMPLETED
- Collector → ONLINE (automatically set)
- TransactionId → PG-TXN-789
- Booking → Confirmed

---

## 🛠️ Setup Instructions

### 1. Run Database Migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 2. Create Cashier Account

```bash
# Default cashier
npm run create:cashier

# Custom cashier
node scripts/createCashier.js cashier@example.com password123 "Cashier Name"
```

### 3. Update Existing Users (if needed)

If you need to convert an existing user to cashier:

```sql
UPDATE users SET role = 'CASHIER' WHERE email = 'user@example.com';
```

---

## 🔒 Security Features

1. **Role-Based Access**: Only CASHIER and ADMIN can confirm payments
2. **Audit Trail**: Tracks which cashier confirmed each payment
3. **Bank Reference Validation**: Requires bank reference for bank payments
4. **Transaction ID**: All payments require transaction ID

---

## 📊 Payment Flow

### Cash Payment Flow

```
1. User creates booking → Payment created (PENDING)
2. User goes to counter
3. Cashier confirms payment → Status: COMPLETED, Collector: CASHIER
4. Booking automatically confirmed
```

### Bank Transfer Flow

```
1. User creates booking → Payment created (PENDING)
2. User makes bank transfer
3. Admin confirms with bank reference → Status: COMPLETED, Collector: BANK
4. Booking automatically confirmed
```

### Online Payment Flow

```
1. User creates booking → Payment created (PENDING)
2. User pays via payment gateway
3. Gateway sends webhook → Status: COMPLETED, Collector: ONLINE
4. Booking automatically confirmed
```

---

## 🧪 Testing

### Test Cashier Confirmation

```bash
# 1. Login as cashier
POST /api/auth/login
{
  "email": "cashier@example.com",
  "password": "cashier123"
}

# 2. Confirm payment
POST /api/payments/confirm
Authorization: Bearer <cashier_token>
{
  "paymentId": "payment-uuid",
  "transactionId": "TEST-001",
  "collector": "CASHIER"
}
```

### Test Bank Payment

```bash
# 1. Login as admin
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}

# 2. Confirm bank payment
POST /api/payments/confirm
Authorization: Bearer <admin_token>
{
  "paymentId": "payment-uuid",
  "transactionId": "BANK-001",
  "collector": "BANK",
  "bankReference": "BANK123456"
}
```

---

## 📝 Notes

- **Default Collector**: If not specified, defaults to "CASHIER"
- **Collector ID**: Automatically set to current user's ID when collector is CASHIER
- **Bank Reference**: Required validation ensures proper bank payment tracking
- **Webhook Payments**: Automatically set collector to "ONLINE"
- **Admin Override**: Admins can confirm payments with any collector type

---

## 🔄 Migration Notes

After running the migration:

1. Existing payments will have `collector = null`
2. You can update existing payments if needed:
   ```sql
   UPDATE payments SET collector = 'CASHIER' WHERE collector IS NULL AND status = 'COMPLETED';
   ```

---

## ✨ Benefits

1. **Better Tracking**: Know exactly how each payment was collected
2. **Audit Trail**: Track which cashier processed each payment
3. **Flexibility**: Support multiple payment collection methods
4. **Security**: Restrict payment confirmation to authorized personnel
5. **Reporting**: Better analytics on payment methods

---

**Ready to use!** 🚀

