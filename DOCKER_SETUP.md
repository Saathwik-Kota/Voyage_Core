# Docker Permission Fix

## Issue
You're getting "permission denied" when trying to use Docker.

## Solution

### Option 1: Add your user to docker group (Recommended)
```bash
sudo usermod -aG docker $USER
newgrp docker
```

Then restart your terminal or run:
```bash
newgrp docker
```

### Option 2: Use sudo (Quick fix)
```bash
sudo docker compose up -d --build
```

## After fixing permissions, start the system:

```bash
# Start all services
docker compose up -d --build

# Wait 2-3 minutes for services to initialize

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Access the application:
- **Admin Dashboard**: https://localhost
- **Login**: admin@travel.com / Admin@123

## Useful commands:
```bash
# Stop services
docker compose down

# Restart a service
docker compose restart identity-manager

# View specific service logs
docker compose logs -f identity-manager

# Scale a service
docker compose up -d --scale profile-service=3
```
