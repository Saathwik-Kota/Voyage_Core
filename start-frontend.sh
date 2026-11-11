#!/bin/bash

echo "=== Starting VoyageCore Console ==="
echo ""

cd admin-dashboard

# Install dependencies
echo "Installing dependencies..."
npm install

# Start React app
echo "Starting React development server..."
REACT_APP_API_URL=http://localhost:3009 npm start
