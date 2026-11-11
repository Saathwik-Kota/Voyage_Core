#!/bin/bash

echo "=== Starting VoyageCore Backend Services ==="
echo ""

# Update database connection to use port 5433
export DATABASE_URL="postgresql://travel_admin:TravelPass2024!@localhost:5432/travel_db"
export JWT_SECRET="a8f5f167f44f4964e6c998dee827110c"
export NEO4J_URI="bolt://localhost:7688"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="Neo4jPass2024!"

# Start Identity Manager
echo "Starting Identity Manager on port 3001..."
cd services/identity-manager
npm install > /dev/null 2>&1 &
sleep 2
PORT=3001 node src/index.js > ../../logs/identity.log 2>&1 &
echo "Identity Manager PID: $!"

cd ../..

# Start Profile Service
echo "Starting Profile Service on port 3002..."
cd services/profile-service
npm install > /dev/null 2>&1 &
sleep 2
PORT=3002 node src/index.js > ../../logs/profile.log 2>&1 &
echo "Profile Service PID: $!"

cd ../..

# Start Booking Engine
echo "Starting Booking Engine on port 3003..."
cd services/booking-engine
npm install > /dev/null 2>&1 &
sleep 2
PORT=3003 node src/index.js > ../../logs/booking.log 2>&1 &
echo "Booking Engine PID: $!"

cd ../..

# Start Transaction Service
echo "Starting Transaction Service on port 3004..."
cd services/transaction-service
npm install > /dev/null 2>&1 &
sleep 2
PORT=3004 DATABASE_URL=$DATABASE_URL STRIPE_SECRET_KEY=sk_test_dummy PAYPAL_CLIENT_ID=dummy PAYPAL_CLIENT_SECRET=dummy node src/index.js > ../../logs/transaction.log 2>&1 &
echo "Transaction Service PID: $!"

cd ../..

# Start API Gateway
echo "Starting API Gateway on port 3009..."
cd services/api-gateway
npm install > /dev/null 2>&1 &
sleep 2
PORT=3009 IDENTITY_MANAGER_URL=http://localhost:3001 PROFILE_SERVICE_URL=http://localhost:3002 BOOKING_ENGINE_URL=http://localhost:3003 TRANSACTION_SERVICE_URL=http://localhost:3004 AUTH_SERVICE_URL=http://localhost:3001 USER_SERVICE_URL=http://localhost:3002 TRAVEL_SERVICE_URL=http://localhost:3003 PAYMENT_SERVICE_URL=http://localhost:3004 JWT_SECRET=$JWT_SECRET node src/index.js > ../../logs/gateway.log 2>&1 &
echo "API Gateway PID: $!"

cd ../..

echo ""
echo "=== Services Starting ==="
echo "Wait 10 seconds for services to initialize..."
sleep 10

echo ""
echo "=== Services Status ==="
curl -s http://localhost:3001/health && echo ""
curl -s http://localhost:3002/health && echo ""
curl -s http://localhost:3003/health && echo ""
curl -s http://localhost:3004/health && echo ""
curl -s http://localhost:3009/health && echo ""

echo ""
echo "=== Backend Ready ==="
echo "API Gateway: http://localhost:3009"
echo ""
echo "View logs: tail -f logs/*.log"
echo "Stop services: pkill -f 'node src/index.js'"
