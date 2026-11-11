#!/bin/bash

echo "=== Quick Start - Databases Only ==="
echo ""
echo "Starting PostgreSQL and Neo4j..."
echo ""

sudo docker compose -f docker-compose-simple.yml up -d

echo ""
echo "Waiting for databases to start..."
sleep 10

echo ""
echo "=== Databases Started ==="
echo ""
echo "PostgreSQL: localhost:5432"
echo "  User: travel_admin"
echo "  Password: TravelPass2024!"
echo "  Database: travel_db"
echo ""
echo "Neo4j: http://localhost:7474"
echo "  User: neo4j"
echo "  Password: Neo4jPass2024!"
echo ""
echo "Check status: sudo docker compose -f docker-compose-simple.yml ps"
echo "View logs: sudo docker compose -f docker-compose-simple.yml logs -f"
echo "Stop: sudo docker compose -f docker-compose-simple.yml down"
