# Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Ansible 2.9+ (for automated deployment)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if running without Docker)
- Neo4j 5+ (if running without Docker)

## Quick Start (Docker Compose)

1. **Clone the repository**
```bash
git clone <repository-url>
cd travel-plan
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run setup script**
```bash
chmod +x setup.sh
./setup.sh
```

4. **Access the application**
- Admin Dashboard: https://localhost
- API: https://localhost/api
- Default credentials: admin@travel.com / Admin@123

## Manual Deployment

### 1. Database Setup

**PostgreSQL:**
```bash
docker run -d \
  --name travel-postgres \
  -e POSTGRES_DB=travel_db \
  -e POSTGRES_USER=travel_admin \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -v ./database/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:15-alpine
```

**Neo4j:**
```bash
docker run -d \
  --name travel-neo4j \
  -e NEO4J_AUTH=neo4j/your_password \
  -p 7474:7474 -p 7687:7687 \
  neo4j:5-community
```

### 2. Build Services

```bash
# Identity Manager
cd services/identity-manager
npm install
docker build -t voyage-identity-manager .

# Profile Service
cd ../profile-service
npm install
docker build -t voyage-profile-service .

# Booking Engine
cd ../booking-engine
npm install
docker build -t voyage-booking-engine .

# Transaction Service
cd ../transaction-service
npm install
docker build -t voyage-transaction-service .

# API Gateway
cd ../api-gateway
npm install
docker build -t voyage-api-gateway .
```

### 3. Start Services

```bash
docker-compose up -d
```

## Ansible Deployment

### 1. Configure Inventory

Edit `ansible/inventory/hosts`:
```ini
[docker_hosts]
your-server.com ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa
```

### 2. Run Playbook

```bash
ansible-playbook -i ansible/inventory/hosts ansible/deploy.yml
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f kubernetes/deployment.yml
```

### 2. Verify Deployment

```bash
kubectl get pods -n voyage-system
kubectl get services -n voyage-system
```

### 3. Access Services

```bash
kubectl port-forward -n voyage-system service/api-gateway 8080:80
```

## Production Considerations

### Security

1. **Update all default passwords** in `.env`
2. **Generate strong JWT secret**:
```bash
openssl rand -base64 32
```

3. **Use real SSL certificates** (Let's Encrypt):
```bash
certbot certonly --standalone -d yourdomain.com
```

4. **Configure Vault** for secret management:
```bash
vault kv put secret/travel-app \
  postgres_password=xxx \
  jwt_secret=xxx \
  stripe_key=xxx
```

### Monitoring

1. **Access Jaeger UI**: http://localhost:16686
2. **Check service health**:
```bash
curl http://localhost:3000/health
```

3. **View logs**:
```bash
docker-compose logs -f [service-name]
```

### Scaling

**Docker Compose:**
```bash
docker-compose up -d --scale auth-service=3 --scale user-service=3
```

**Kubernetes:**
```bash
kubectl scale deployment auth-service --replicas=5 -n travel-system
```

### Backup

**PostgreSQL:**
```bash
docker exec travel-postgres pg_dump -U travel_admin travel_db > backup.sql
```

**Neo4j:**
```bash
docker exec travel-neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j-backup.dump
```

## CI/CD Setup

### Jenkins

1. Install Jenkins plugins:
   - Docker Pipeline
   - SonarQube Scanner
   - Ansible

2. Configure credentials in Jenkins
3. Create pipeline from Jenkinsfile

### GitHub Actions

1. Add secrets to repository:
   - DOCKER_USERNAME
   - DOCKER_PASSWORD
   - SONAR_TOKEN
   - SONAR_HOST_URL

2. Push to main branch to trigger pipeline

## Troubleshooting

### Services not starting
```bash
docker-compose logs [service-name]
docker-compose ps
```

### Database connection issues
```bash
docker exec -it travel-postgres psql -U travel_admin -d travel_db
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d --build
```

## Performance Tuning

1. **PostgreSQL**: Adjust `shared_buffers`, `work_mem` in postgresql.conf
2. **Neo4j**: Increase heap size in NEO4J_dbms_memory_heap_max__size
3. **Node.js**: Set NODE_ENV=production
4. **Nginx**: Enable gzip compression and caching

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review documentation: API_DOCUMENTATION.md, DATABASE_SCHEMA.md
- Monitor traces: Jaeger UI at http://localhost:16686
