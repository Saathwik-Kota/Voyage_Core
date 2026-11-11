# Database Schema Documentation

## PostgreSQL Schema

### Users Table
Stores user accounts with authentication and role information.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `email` (VARCHAR, UNIQUE): User email
- `password_hash` (VARCHAR): Bcrypt hashed password
- `first_name`, `last_name` (VARCHAR): User name
- `role` (VARCHAR): 'admin' or 'user'
- `phone` (VARCHAR): Contact number
- `is_active` (BOOLEAN): Account status
- `created_at`, `updated_at` (TIMESTAMP): Audit fields

**Relationships:**
- One-to-many with bookings (CASCADE DELETE)
- One-to-many with travels (SET NULL on delete)

### Travels Table
Main travel packages.

**Columns:**
- `id` (UUID, PK)
- `title`, `description` (VARCHAR/TEXT)
- `price` (DECIMAL): Package price
- `duration_days` (INTEGER)
- `start_date`, `end_date` (DATE)
- `max_participants`, `current_participants` (INTEGER)
- `status` (VARCHAR): 'active', 'inactive', 'cancelled', 'completed'
- `created_by` (UUID, FK): References users

**Relationships:**
- Many-to-many with destinations via travel_destinations
- One-to-many with accommodations (CASCADE DELETE)
- One-to-many with transportation (CASCADE DELETE)
- One-to-many with activities (CASCADE DELETE)
- One-to-many with bookings (CASCADE DELETE)

### Destinations Table
Travel destinations/locations.

**Columns:**
- `id` (UUID, PK)
- `name`, `country`, `city` (VARCHAR)
- `description` (TEXT)
- `image_url` (VARCHAR)

### Travel_Destinations Table
Junction table for travels and destinations.

**Columns:**
- `id` (UUID, PK)
- `travel_id` (UUID, FK): References travels (CASCADE DELETE)
- `destination_id` (UUID, FK): References destinations (CASCADE DELETE)
- `day_number` (INTEGER): Day of visit in itinerary

**Constraints:**
- UNIQUE(travel_id, destination_id, day_number)

### Accommodations Table
Hotel/lodging information for travels.

**Columns:**
- `id` (UUID, PK)
- `travel_id` (UUID, FK): References travels (CASCADE DELETE)
- `name`, `type`, `address` (VARCHAR/TEXT)
- `check_in_date`, `check_out_date` (DATE)

### Transportation Table
Travel transportation details.

**Columns:**
- `id` (UUID, PK)
- `travel_id` (UUID, FK): References travels (CASCADE DELETE)
- `type` (VARCHAR): Flight, train, bus, etc.
- `departure_location`, `arrival_location` (VARCHAR)
- `departure_time`, `arrival_time` (TIMESTAMP)
- `provider` (VARCHAR): Airline/company name

### Activities Table
Activities included in travel packages.

**Columns:**
- `id` (UUID, PK)
- `travel_id` (UUID, FK): References travels (CASCADE DELETE)
- `name`, `description` (VARCHAR/TEXT)
- `duration_hours` (INTEGER)
- `price` (DECIMAL): Additional cost if any
- `scheduled_time` (TIMESTAMP)

### Bookings Table
User travel bookings.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK): References users (CASCADE DELETE)
- `travel_id` (UUID, FK): References travels (CASCADE DELETE)
- `status` (VARCHAR): 'pending', 'confirmed', 'cancelled', 'completed'
- `total_amount` (DECIMAL)
- `participants` (INTEGER): Number of people

**Relationships:**
- One-to-many with payments (CASCADE DELETE)

### Payment_Methods Table
Available payment gateways.

**Columns:**
- `id` (UUID, PK)
- `name` (VARCHAR, UNIQUE): Display name
- `type` (VARCHAR): 'stripe' or 'paypal'
- `is_active` (BOOLEAN)
- `config` (JSONB): Gateway configuration

### Payments Table
Payment transactions.

**Columns:**
- `id` (UUID, PK)
- `booking_id` (UUID, FK): References bookings (CASCADE DELETE)
- `payment_method_id` (UUID, FK): References payment_methods (SET NULL)
- `amount` (DECIMAL)
- `currency` (VARCHAR): ISO currency code
- `status` (VARCHAR): 'pending', 'completed', 'failed', 'refunded'
- `transaction_id` (VARCHAR): External gateway transaction ID
- `payment_date` (TIMESTAMP)

## Neo4j Graph Schema

### Destination Nodes
```cypher
(:Destination {
  id: String,
  name: String,
  country: String,
  city: String,
  popularity: Integer
})
```

### Relationships
```cypher
(:Destination)-[:CONNECTS_TO {
  distance_km: Integer,
  travel_time_hours: Float
}]->(:Destination)
```

**Use Cases:**
- Find optimal travel routes between destinations
- Calculate total travel distance for multi-destination packages
- Recommend popular destination combinations
- Analyze destination connectivity

## Indexes

**PostgreSQL:**
- `idx_users_email`: Fast user lookup by email
- `idx_users_role`: Filter users by role
- `idx_travels_status`: Filter travels by status
- `idx_travels_dates`: Date range queries
- `idx_bookings_user`: User's bookings
- `idx_bookings_travel`: Travel's bookings
- `idx_payments_booking`: Payment lookup
- `idx_payments_status`: Payment status filtering

**Neo4j:**
- Unique constraint on Destination.id
- Index on Destination.name
- Index on Destination.country

## Cascade Behavior

**DELETE User:**
- Deletes all user's bookings
- Deletes all payments for those bookings
- Sets travels.created_by to NULL

**DELETE Travel:**
- Deletes all travel_destinations entries
- Deletes all accommodations
- Deletes all transportation
- Deletes all activities
- Deletes all bookings
- Deletes all payments for those bookings

**DELETE Destination:**
- Deletes all travel_destinations entries (removes from travel packages)

**DELETE Payment Method:**
- Sets payments.payment_method_id to NULL (preserves payment history)
