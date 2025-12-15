# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 🐳 Docker Issues

#### Issue: "Cannot connect to the Docker daemon"
**Solution:**
```bash
# Start Docker service
sudo systemctl start docker

# Or if using Docker Desktop, make sure it's running
```

#### Issue: "Port already in use"
**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :5432

# Stop the service or change port in docker-compose.yml
# For example, change PostgreSQL port:
ports:
  - "5442:5432"  # Changed from 5432:5432
```

#### Issue: Containers keep restarting
**Solution:**
```bash
# Check container logs
docker-compose logs kafka
docker-compose logs redis
docker-compose logs auth-db

# Common fix: Wait for Kafka to fully initialize (takes 30-60 seconds)
docker-compose logs -f kafka | grep "Kafka Server started"
```

#### Issue: "Cannot connect to Kafka"
**Solution:**
```bash
# Kafka takes time to start. Wait 60 seconds after starting
# Verify Kafka is running
docker exec -it kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Restart Kafka if needed
docker-compose restart kafka
```

---

### 🔐 Auth Service Issues

#### Issue: "Cannot connect to database"
**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# 1. Check if PostgreSQL container is running
docker ps | grep auth-db

# 2. Check if database is ready
docker exec -it auth-db pg_isready -U auth_user

# 3. Verify credentials in .env match docker-compose.yml
# auth-service/.env should have:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=auth_user
DB_PASSWORD=auth_password
DB_NAME=auth_db

# 4. If still fails, restart the container
docker-compose restart auth-db
```

#### Issue: "User already exists" on registration
**Solution:**
```bash
# Clear the users table
docker exec -it auth-db psql -U auth_user -d auth_db -c "TRUNCATE users CASCADE;"

# Or use a different email
```

#### Issue: "Invalid credentials" but password is correct
**Possible causes:**
1. Password was changed after registration
2. Different user with same email exists
3. Database was reset

**Solution:**
```bash
# Check users in database
docker exec -it auth-db psql -U auth_user -d auth_db -c "SELECT id, email, username FROM users;"

# Delete user and re-register
docker exec -it auth-db psql -U auth_user -d auth_db -c "DELETE FROM users WHERE email='user@example.com';"
```

---

### 🌐 API Gateway Issues

#### Issue: GraphQL Playground not loading
**Error:** `Cannot GET /graphql`

**Solution:**
```bash
# 1. Check if API Gateway is running
# Look for: "🚀 API Gateway running on http://localhost:3000"

# 2. Check the correct URL
# Should be: http://localhost:3000/graphql (with /graphql)

# 3. Check console for errors
cd api-gateway
npm run start:dev

# 4. Common issue: Missing dependencies
npm install
```

#### Issue: "Cannot connect to Auth Service"
**Error:** `ECONNREFUSED 127.0.0.1:3001`

**Solution:**
```bash
# 1. Make sure Auth Service is running
cd auth-service
npm run start:dev

# 2. Check AUTH_SERVICE_URL in api-gateway/.env
AUTH_SERVICE_URL=http://localhost:3001  # Not https, not trailing slash

# 3. Test Auth Service directly
curl http://localhost:3001/auth/me
# Should return: {"statusCode":401,"message":"Unauthorized"}
```

#### Issue: "Invalid token" on authenticated requests
**Solution:**
```bash
# 1. Make sure JWT_SECRET matches in both services
# api-gateway/.env and auth-service/.env should have SAME value

# 2. Get a fresh token by logging in again

# 3. Check Authorization header format:
# Correct: "Bearer eyJhbGc..."
# Wrong: "eyJhbGc..." (missing "Bearer ")
```

---

### 📦 npm Issues

#### Issue: "Cannot find module '@nestjs/...'"
**Solution:**
```bash
# Install dependencies
cd <service-name>
npm install

# If still failing, clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "EACCES: permission denied"
**Solution:**
```bash
# Option 1: Fix npm permissions
sudo chown -R $USER:$USER ~/.npm

# Option 2: Use npx instead
npx @nestjs/cli new service-name
```

#### Issue: Port in use (npm start fails)
**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=3010
```

---

### 🎯 GraphQL Issues

#### Issue: "Cannot query field 'sendMessage' on type 'Mutation'"
**Solution:**
This means the Chat Service resolvers aren't set up yet. Currently only Auth queries/mutations work:
- `register`
- `login`
- `refreshToken`

**Workaround:** Wait for Chat Service implementation or test only auth endpoints.

#### Issue: Headers not being sent
**Solution:**
```json
// In GraphQL Playground, click "HTTP HEADERS" at bottom
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

#### Issue: "Unauthorized" even with valid token
**Possible causes:**
1. Token expired (access tokens expire in 1 hour)
2. Wrong JWT_SECRET in services
3. Authorization header format wrong

**Solution:**
```bash
# 1. Verify token hasn't expired (check 'exp' claim)
# 2. Use refresh token to get new access token:
mutation {
  refreshToken(input: {
    refreshToken: "YOUR_REFRESH_TOKEN"
  }) {
    accessToken
  }
}

# 3. Check header format:
# Correct: Authorization: Bearer eyJhbGc...
# Wrong: Authorization: eyJhbGc... (missing Bearer)
```

---

### 🔴 Redis Issues

#### Issue: "Connection refused" to Redis
**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec -it redis redis-cli ping
# Should return: PONG

# Restart if needed
docker-compose restart redis
```

---

### 📊 Kafka Issues

#### Issue: "Failed to connect to Kafka"
**Solution:**
```bash
# 1. Kafka takes 30-60 seconds to fully start
# Wait and check logs
docker-compose logs kafka | grep "started"

# 2. Check if Kafka is accessible
docker exec -it kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# 3. Verify KAFKA_BROKER in .env
KAFKA_BROKER=localhost:9092  # Not kafka:29092 (that's internal)
```

#### Issue: "Topic does not exist"
**Solution:**
```bash
# List topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Create topic manually
docker exec -it kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic message.created \
  --partitions 3 \
  --replication-factor 1
```

---

## 🧪 Testing Checklist

### ✅ Infrastructure Health Check

```bash
# 1. Check all containers are running
docker-compose ps

# Should show 9 containers:
# - zookeeper (Up)
# - kafka (Up)
# - schema-registry (Up)
# - redis (Up)
# - auth-db (Up)
# - chat-db (Up)
# - presence-db (Up)
# - notification-db (Up)

# 2. Test Kafka
docker exec -it kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# 3. Test Redis
docker exec -it redis redis-cli ping

# 4. Test PostgreSQL
docker exec -it auth-db pg_isready -U auth_user

# 5. Test Schema Registry
curl http://localhost:8081/subjects
```

### ✅ Service Health Check

```bash
# Auth Service
curl http://localhost:3001/auth/me
# Expected: {"statusCode":401,"message":"Unauthorized"}

# API Gateway
curl http://localhost:3000/graphql
# Expected: GraphQL Playground HTML

# If services not running:
cd auth-service && npm run start:dev
cd api-gateway && npm run start:dev
```

---

## 🚨 Emergency Reset

If everything is broken and you want to start fresh:

```bash
# 1. Stop all services
# Press Ctrl+C in all terminal windows

# 2. Stop and remove all containers and volumes
cd /path/to/EDA_Chat_Microservice
docker-compose down -v

# 3. Remove all Docker data (CAUTION: This removes ALL Docker data)
docker system prune -a --volumes

# 4. Reinstall dependencies
npm run install:all

# 5. Start fresh
docker-compose up -d
cd auth-service && npm run start:dev
cd api-gateway && npm run start:dev
```

---

## 📞 Getting Help

### Check Logs

**Service Logs:**
```bash
# In the terminal where service is running, you'll see logs
# Look for errors in red

# For more verbose logs, set environment variable:
LOG_LEVEL=debug npm run start:dev
```

**Docker Logs:**
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs kafka
docker-compose logs redis
docker-compose logs auth-db

# Follow logs in real-time
docker-compose logs -f kafka
```

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `ECONNREFUSED` | Cannot connect to service | Check if service is running |
| `EADDRINUSE` | Port already in use | Change port or kill process |
| `Unauthorized` | Token invalid/expired | Get new token |
| `Cannot find module` | Missing dependency | Run `npm install` |
| `relation does not exist` | Database table not created | Check TypeORM synchronize |
| `EACCES` | Permission denied | Fix file permissions |

---

## 🎯 Quick Fixes

### "Just make it work!"

```bash
# Full reset and restart:
docker-compose down -v
docker-compose up -d
sleep 60  # Wait for Kafka

# In separate terminals:
cd auth-service && rm -rf node_modules && npm install && npm run start:dev
cd api-gateway && rm -rf node_modules && npm install && npm run start:dev
```

### "I need to demo in 5 minutes!"

```bash
# Start only what works:
docker-compose up -d zookeeper kafka redis auth-db
cd auth-service && npm run start:dev &
cd api-gateway && npm run start:dev

# Open http://localhost:3000/graphql
# Test only: register, login mutations
```

---

## 📚 Additional Resources

- **NestJS Docs**: https://docs.nestjs.com
- **GraphQL Docs**: https://graphql.org/learn
- **Kafka Docs**: https://kafka.apache.org/documentation
- **Docker Docs**: https://docs.docker.com
- **TypeORM Docs**: https://typeorm.io

---

**Still stuck?** Check `PROJECT_STATUS.md` to see what's implemented and what's not!
