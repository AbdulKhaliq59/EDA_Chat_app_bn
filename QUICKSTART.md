# 🚀 Quick Start Guide

## Step 1: Start Infrastructure

```bash
docker-compose up -d
```

Wait for all containers to be healthy (~30 seconds):
```bash
docker-compose ps
```

## Step 2: Install Dependencies

```bash
# Install all services at once
cd api-gateway && npm install && cd ..
cd auth-service && npm install && cd ..
cd chat-service && npm install && cd ..
cd presence-service && npm install && cd ..
cd notification-service && npm install && cd ..
```

## Step 3: Start All Services

Open 5 separate terminals:

**Terminal 1 - Auth Service:**
```bash
cd auth-service
npm run start:dev
```
Wait for: `🔐 Auth Service running on http://localhost:3001`

**Terminal 2 - Chat Service:**
```bash
cd chat-service
npm run start:dev
```
Wait for: `💬 Chat Service running on http://localhost:3002`

**Terminal 3 - Presence Service:**
```bash
cd presence-service
npm run start:dev
```
Wait for: `👤 Presence Service running on http://localhost:3003`

**Terminal 4 - Notification Service:**
```bash
cd notification-service
npm run start:dev
```
Wait for: `🔔 Notification Service running on http://localhost:3004`

**Terminal 5 - API Gateway:**
```bash
cd api-gateway
npm run start:dev
```
Wait for: `🚀 API Gateway running on http://localhost:3000`

## Step 4: Test the Application

### Open GraphQL Playground
Navigate to: http://localhost:3000/graphql

### 1. Register a User

```graphql
mutation {
  register(input: {
    email: "alice@example.com"
    username: "alice"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      userId
      email
      username
    }
  }
}
```

**Copy the `accessToken` from the response!**

### 2. Set Authorization Header

In the GraphQL Playground, click "HTTP HEADERS" at the bottom and add:

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

### 3. Update Your Presence

```graphql
mutation {
  updatePresence(input: {
    status: ONLINE
  }) {
    userId
    status
    lastSeenAt
  }
}
```

### 4. Register a Second User

Remove the Authorization header, then:

```graphql
mutation {
  register(input: {
    email: "bob@example.com"
    username: "bob"
    password: "password123"
  }) {
    accessToken
    user {
      userId
    }
  }
}
```

**Copy Bob's userId and accessToken!**

### 5. Send a Message (as Alice)

Set Alice's token in headers, then:

```graphql
mutation {
  sendMessage(input: {
    receiverId: "BOB_USER_ID_HERE"
    content: "Hello Bob!"
  }) {
    id
    content
    senderId
    receiverId
    conversationId
    createdAt
  }
}
```

### 6. Get Conversations

```graphql
query {
  getConversations(page: 1, limit: 20) {
    data {
      id
      participants
      lastMessageAt
    }
    total
  }
}
```

### 7. Get Messages

```graphql
query {
  getMessages(conversationId: "CONVERSATION_ID_HERE", page: 1, limit: 50) {
    data {
      id
      content
      senderId
      receiverId
      createdAt
    }
    total
  }
}
```

### 8. Check Notifications

```graphql
query {
  getNotifications(page: 1, limit: 20) {
    data {
      id
      type
      title
      message
      read
      createdAt
    }
    total
  }
}
```

## Step 5: Verify Infrastructure

### Check Kafka Topics

```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

You should see topics like:
- `message.created`
- `message.updated`
- `presence.updated`
- `notification.created`

### Check Redis

```bash
docker exec -it redis redis-cli
> KEYS presence:*
> GET presence:USER_ID
```

### Check Databases

```bash
# Auth DB
docker exec -it auth-db psql -U auth_user -d auth_db -c "SELECT id, email, username FROM users;"

# Chat DB
docker exec -it chat-db psql -U chat_user -d chat_db -c "SELECT id, content, sender_id FROM messages LIMIT 5;"
```

## 🛑 Stop Everything

### Stop Services
Press `Ctrl+C` in each terminal

### Stop Infrastructure
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```

## 🔧 Troubleshooting

### Services won't start?

1. **Check Docker containers:**
   ```bash
   docker-compose ps
   ```
   All should be "Up" and healthy.

2. **Check service logs:**
   ```bash
   docker-compose logs kafka
   docker-compose logs redis
   docker-compose logs auth-db
   ```

3. **Restart infrastructure:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Can't connect to database?

Make sure the database is ready:
```bash
docker exec -it auth-db pg_isready -U auth_user
```

### Kafka connection issues?

Wait for Kafka to be fully initialized (can take 30-60 seconds):
```bash
docker-compose logs -f kafka
```

Look for: "Kafka Server started"

### Port already in use?

Change the port in the service's `.env` file:
```bash
# In api-gateway/.env
PORT=3010  # Changed from 3000
```

## 📝 Next Steps

1. **Explore the GraphQL Schema**: Check all available queries and mutations in the playground
2. **Add More Users**: Register multiple users and test conversations
3. **Monitor Kafka Events**: Use Kafka UI or CLI to see events flowing
4. **Check Redis Cache**: Verify presence data is being cached
5. **Review Service Logs**: See event publishing and consumption in real-time

## 🎯 Key Endpoints

- **API Gateway (GraphQL)**: http://localhost:3000/graphql
- **Auth Service**: http://localhost:3001
- **Chat Service**: http://localhost:3002
- **Presence Service**: http://localhost:3003
- **Notification Service**: http://localhost:3004
- **Kafka**: localhost:9092
- **Schema Registry**: http://localhost:8081
- **Redis**: localhost:6379

## ✅ Success Indicators

- All 5 services show "running" messages
- GraphQL Playground loads at http://localhost:3000/graphql
- User registration returns a valid JWT token
- Messages can be sent and retrieved
- Presence status updates successfully
- Kafka topics are created automatically
- Redis contains presence data

---

**Need Help?** Check the main README.md for detailed documentation.
