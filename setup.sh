#!/bin/bash

set -e

echo "=== VoyageCore Platform Setup ==="

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
fi

# Generate SSL certificates
echo "Generating SSL certificates..."
chmod +x generate-ssl.sh
./generate-ssl.sh

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the services, run:"
echo "  docker compose up -d --build"
echo ""
echo "Or if you have docker-compose:"
echo "  docker-compose up -d --build"
echo ""
echo "Access points:"
echo "  - Admin Dashboard: https://localhost"
echo "  - API Gateway: https://localhost/api"
echo "  - Jaeger UI: http://localhost:16686"
echo "  - Neo4j Browser: http://localhost:7474"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@travel.com"
echo "  Password: Admin@123"
