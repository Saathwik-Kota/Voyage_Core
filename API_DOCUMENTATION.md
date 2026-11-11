# API Documentation

## Base URL
```
https://localhost/api
```

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Identity Manager (Authentication & Tokens)

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/login
Login with credentials.

**Request:**
```json
{
  "email": "admin@travel.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@travel.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  },
  "token": "jwt_token"
}
```

### Profile Service (User Management - Admin Only)

#### GET /api/users
Get all users with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response:**
```json
{
  "users": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### GET /api/users/:id
Get user by ID.

#### POST /api/users
Create new user.

#### PUT /api/users/:id
Update user.

#### DELETE /api/users/:id
Delete user (cascades to bookings).

### Booking Engine (Trips & Itineraries)

#### GET /api/travels
Get all travels.

**Query Parameters:**
- `page`, `limit`, `status`

#### GET /api/travels/:id
Get travel details with destinations, accommodations, transportation, and activities.

#### POST /api/travels (Admin Only)
Create new travel package.

**Request:**
```json
{
  "title": "European Adventure",
  "description": "10-day tour",
  "price": 2500.00,
  "durationDays": 10,
  "startDate": "2024-06-01",
  "endDate": "2024-06-10",
  "maxParticipants": 20,
  "destinations": [
    {
      "destinationId": "uuid",
      "dayNumber": 1
    }
  ],
  "accommodations": [...],
  "transportation": [...],
  "activities": [...]
}
```

#### PUT /api/travels/:id (Admin Only)
Update travel.

#### DELETE /api/travels/:id (Admin Only)
Delete travel (cascades to related data).

### Destination Management (Admin Only)

#### GET /api/destinations
Get all destinations.

#### POST /api/destinations
Create destination.

#### PUT /api/destinations/:id
Update destination.

#### DELETE /api/destinations/:id
Delete destination (cascades to travel_destinations).

### Transaction Service (Payments & Gateways)

#### GET /api/payment-methods (Admin Only)
Get all payment methods.

#### POST /api/payment-methods (Admin Only)
Create payment method.

#### PUT /api/payment-methods/:id (Admin Only)
Update payment method.

#### DELETE /api/payment-methods/:id (Admin Only)
Delete payment method.

#### POST /api/payments/stripe
Process Stripe payment.

**Request:**
```json
{
  "amount": 2500.00,
  "currency": "usd",
  "bookingId": "uuid",
  "paymentMethodId": "uuid"
}
```

#### POST /api/payments/paypal
Process PayPal payment.

#### GET /api/payments
Get payments (optionally filtered by bookingId).

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message"
}
```

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
