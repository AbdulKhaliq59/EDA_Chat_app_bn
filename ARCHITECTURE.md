# 🏗️ Architecture Documentation

## System Overview

This is an **Event-Driven Architecture (EDA)** chat application built with **NestJS microservices**. The system follows Domain-Driven Design principles and uses event sourcing for reliable, scalable communication between services.

## Core Principles

### 1. **Event-Driven Architecture**
- Services communicate asynchronously through Kafka
- Loose coupling between services
- High scalability and fault tolerance
- Event sourcing for audit trails

### 2. **Microservices Pattern**
- Each service has its own database (Database per Service pattern)
- Independent deployment and scaling
- Technology diversity (though all use NestJS)
- Failure isolation

### 3. **API Gateway Pattern**
- Single entry point for clients
- Request routing and aggregation
- Authentication and authorization
- Protocol translation (GraphQL to REST)

## Detailed Component Architecture

### 🚪 API Gateway (Port 3000)

**Purpose**: Single entry point for all client requests

**Technology Stack**:
- NestJS
- Apollo GraphQL Server
- JWT Authentication
- HTTP Client (Axios)

**Responsibilities**:
1. **Authentication**: Validate JWT tokens with Auth Service
2. **Request Routing**: Route GraphQL queries to appropriate microservices
3. **Response Aggregation**: Combine data from multiple services
4. **Protocol Translation**: Convert GraphQL to REST calls
5. **WebSocket Management**: Handle real-time subscriptions

**Communication Pattern**:
- **Inbound**: GraphQL over HTTP/WebSocket from clients
- **Outbound**: Synchronous REST calls to microservices

**Key Files**:
```
api-gateway/
├── src/
│   ├── auth/             # Auth GraphQL resolvers
│   ├── chat/             # Chat GraphQL resolvers
│   ├── presence/         # Presence GraphQL resolvers
│   ├── notification/     # Notification GraphQL resolvers
│   └── common/
│       ├── guards/       # JWT authentication guard
│       └── decorators/   # Current user decorator
```

---

### 🔐 Auth Service (Port 3001)

**Purpose**: User authentication and authorization

**Technology Stack**:
- NestJS
- TypeORM
- PostgreSQL
- Passport JWT
- bcrypt

**Database Schema**:
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  username VARCHAR UNIQUE,
  password VARCHAR,
  refresh_token VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Responsibilities**:
1. **User Registration**: Create new user accounts with hashed passwords
2. **User Login**: Validate credentials and issue JWT tokens
3. **Token Management**: Generate access and refresh tokens
4. **Token Validation**: Verify JWT tokens for other services
5. **Token Refresh**: Issue new access tokens using refresh tokens

**Security Features**:
- Password hashing with bcrypt (10 salt rounds)
- JWT access tokens (short-lived, 1 hour)
- JWT refresh tokens (long-lived, 7 days)
- Refresh token rotation (new token on each refresh)
- Secure token storage in database

**API Endpoints**:
```
POST /auth/register      - Register new user
POST /auth/login         - Login user
POST /auth/refresh       - Refresh access token
POST /auth/validate      - Validate JWT token (authenticated)
GET  /auth/me            - Get current user profile (authenticated)
```

---

### 💬 Chat Service (Port 3002)

**Purpose**: Message creation and conversation management

**Technology Stack**:
- NestJS
- TypeORM
- PostgreSQL
- Kafka Producer
- Schema Registry Client

**Database Schema**:
```sql
messages (
  id UUID PRIMARY KEY,
  content TEXT,
  sender_id UUID,
  receiver_id UUID,
  conversation_id UUID,
  read_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

conversations (
  id UUID PRIMARY KEY,
  participants UUID[],
  last_message_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Responsibilities**:
1. **Message Creation**: Persist messages to database
2. **Message Retrieval**: Fetch messages by conversation
3. **Conversation Management**: Create and manage conversations
4. **Event Publishing**: Publish message events to Kafka
5. **Schema Validation**: Validate events against Schema Registry
6. **Read Receipts**: Track message read status

**Event Flow**:
```
1. Client sends message via API Gateway
2. Chat Service validates and persists to database
3. Chat Service fetches event schema from Schema Registry
4. Chat Service publishes MessageCreatedEvent to Kafka
5. Kafka distributes event to consumers (Notification Service)
```

**Kafka Topics**:
- `message.created` - New message events
- `message.updated` - Message update events (read status)
- `message.deleted` - Message deletion events

**API Endpoints**:
```
POST   /messages              - Create new message
GET    /messages/:conversationId - Get messages
PATCH  /messages/:id/read     - Mark message as read
GET    /conversations         - Get user conversations
POST   /conversations         - Create conversation
```

---

### 👤 Presence Service (Port 3003)

**Purpose**: Track and manage user online/offline status

**Technology Stack**:
- NestJS
- Redis
- TypeORM
- PostgreSQL

**Data Storage**:

**Redis** (Primary - Fast reads):
```
Key: presence:{userId}
Value: JSON {
  status: "ONLINE" | "OFFLINE" | "AWAY" | "BUSY",
  lastSeenAt: ISO8601 timestamp
}
TTL: 5 minutes (auto-expire offline users)
```

**PostgreSQL** (Secondary - Historical data):
```sql
presence_history (
  id UUID PRIMARY KEY,
  user_id UUID,
  status VARCHAR,
  created_at TIMESTAMP
)
```

**Responsibilities**:
1. **Status Updates**: Update user presence in Redis
2. **Status Queries**: Fast lookup of user status
3. **Bulk Queries**: Get presence for multiple users
4. **Auto-Expiry**: Remove stale presence data
5. **History Tracking**: Store presence changes in PostgreSQL

**Presence Statuses**:
- `ONLINE` - User is actively using the app
- `OFFLINE` - User is not connected
- `AWAY` - User is idle (no activity for 5 minutes)
- `BUSY` - User set "Do Not Disturb"

**API Endpoints**:
```
POST   /presence              - Update user presence
GET    /presence/:userId      - Get user presence
POST   /presence/bulk         - Get multiple user presences
```

**Heartbeat Mechanism**:
- Clients send heartbeat every 30 seconds
- If no heartbeat for 60 seconds, status → AWAY
- If no heartbeat for 5 minutes, Redis key expires → OFFLINE

---

### 🔔 Notification Service (Port 3004)

**Purpose**: Consume events and create notifications

**Technology Stack**:
- NestJS
- Kafka Consumer
- Redis (Pub/Sub)
- TypeORM
- PostgreSQL

**Database Schema**:
```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  type VARCHAR,
  title VARCHAR,
  message TEXT,
  data JSONB,
  read BOOLEAN,
  created_at TIMESTAMP
)
```

**Responsibilities**:
1. **Event Consumption**: Consume events from Kafka topics
2. **Notification Creation**: Create notifications based on events
3. **Notification Storage**: Persist to PostgreSQL
4. **Caching**: Store recent notifications in Redis
5. **Fan-Out**: Publish to Redis Pub/Sub for WebSocket delivery
6. **Read Management**: Mark notifications as read

**Event Processing Flow**:
```
1. Kafka delivers MessageCreatedEvent
2. Notification Service consumes event
3. Service creates notification for receiver
4. Notification saved to PostgreSQL
5. Notification cached in Redis (recent 100)
6. Notification published to Redis Pub/Sub channel
7. API Gateway WebSocket delivers to client
```

**Kafka Consumer Groups**:
- `notification-consumer-group` - Single consumer group for all topics

**Consumed Topics**:
- `message.created` → Create "New Message" notification
- `presence.updated` → Create "User Online" notification (friends only)

**Redis Pub/Sub**:
```
Channel: notifications:{userId}
Payload: Notification JSON
```

**API Endpoints**:
```
GET    /notifications         - Get user notifications
PATCH  /notifications/:id/read - Mark as read
PATCH  /notifications/read-all - Mark all as read
DELETE /notifications/:id      - Delete notification
```

---

## Data Flow Examples

### Example 1: Sending a Message

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. GraphQL Mutation: sendMessage
     ▼
┌──────────────┐
│ API Gateway  │
│ (GraphQL)    │
└────┬─────────┘
     │ 2. HTTP POST /messages
     ▼
┌──────────────┐
│Chat Service  │
│              │──► 3. INSERT INTO messages
└────┬─────────┘
     │ 4. Fetch schema from Schema Registry
     │ 5. Publish MessageCreatedEvent
     ▼
┌──────────────┐
│    Kafka     │
└────┬─────────┘
     │ 6. Deliver event
     ▼
┌──────────────────┐
│Notification Svc  │
│                  │──► 7. INSERT INTO notifications
│                  │──► 8. PUBLISH to Redis
└──────────────────┘
```

### Example 2: User Authentication

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. GraphQL Mutation: login
     ▼
┌──────────────┐
│ API Gateway  │
└────┬─────────┘
     │ 2. HTTP POST /auth/login
     ▼
┌──────────────┐
│Auth Service  │
│              │──► 3. SELECT FROM users WHERE email
│              │──► 4. bcrypt.compare(password, hash)
│              │──► 5. Generate JWT tokens
└────┬─────────┘
     │ 6. Return tokens
     ▼
┌──────────────┐
│ API Gateway  │
└────┬─────────┘
     │ 7. Return to client
     ▼
┌─────────┐
│ Client  │ (Stores accessToken)
└─────────┘
```

### Example 3: Presence Update with Caching

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. GraphQL Mutation: updatePresence (ONLINE)
     ▼
┌──────────────┐
│ API Gateway  │
└────┬─────────┘
     │ 2. HTTP POST /presence
     ▼
┌──────────────────┐
│ Presence Service │
│                  │──► 3. SETEX presence:{userId} 300 "{status:ONLINE}"
│                  │──► 4. INSERT INTO presence_history
└──────────────────┘
```

## Infrastructure Components

### 🟢 Kafka + Zookeeper

**Purpose**: Distributed event streaming platform

**Configuration**:
- **Kafka Broker**: localhost:9092
- **Zookeeper**: localhost:2181
- **Replication Factor**: 1 (single broker)
- **Auto Create Topics**: Enabled

**Topics** (Auto-created):
```
message.created         - Partitions: 3
message.updated         - Partitions: 3
message.deleted         - Partitions: 1
presence.updated        - Partitions: 1
user.registered         - Partitions: 1
notification.created    - Partitions: 1
```

**Consumer Groups**:
- `notification-consumer-group` - Notification Service

---

### 📋 Schema Registry

**Purpose**: Manage and validate event schemas

**Configuration**:
- **URL**: http://localhost:8081
- **Backend**: Kafka (stores schemas in topics)

**Schema Evolution**:
- Backward compatibility enforced
- Version tracking for all schemas
- JSON Schema format

**Registered Schemas**:
```
message.created-value (v1)
message.updated-value (v1)
presence.updated-value (v1)
```

---

### 🔴 Redis

**Purpose**: Caching and pub/sub messaging

**Configuration**:
- **Host**: localhost:6379
- **Persistence**: AOF (Append-Only File)

**Use Cases**:

1. **Presence Caching**:
   ```
   Key Pattern: presence:{userId}
   TTL: 300 seconds
   ```

2. **Notification Cache**:
   ```
   Key Pattern: notifications:{userId}
   Type: List
   Max Size: 100
   ```

3. **Pub/Sub Channels**:
   ```
   notifications:{userId}  - Real-time notification delivery
   presence:updates        - Presence change broadcasts
   ```

---

### 🐘 PostgreSQL Databases

**4 Separate Databases** (Database per Service):

1. **auth_db** (Port 5432)
   - User accounts
   - Refresh tokens

2. **chat_db** (Port 5433)
   - Messages
   - Conversations

3. **presence_db** (Port 5434)
   - Presence history
   - Activity logs

4. **notification_db** (Port 5435)
   - Notifications
   - Read status

**Why Separate Databases?**
- Independent scaling
- Fault isolation
- Service autonomy
- Clear boundaries

---

## Design Patterns Used

### 1. **Database per Service**
Each microservice owns its database. No shared databases.

### 2. **API Gateway**
Single entry point for all client requests.

### 3. **Event Sourcing**
All state changes published as events to Kafka.

### 4. **CQRS (Command Query Responsibility Segregation)**
- Commands: Create/Update operations
- Queries: Read operations (can use different data stores)

### 5. **Saga Pattern** (Planned)
Distributed transactions across services using event choreography.

### 6. **Circuit Breaker** (Planned)
Prevent cascading failures when services are down.

### 7. **Service Discovery** (Future)
Currently using hardcoded URLs, will move to Consul/Eureka.

---

## Scalability Considerations

### Horizontal Scaling

**Stateless Services** (Can scale freely):
- API Gateway: Multiple instances behind load balancer
- Auth Service: Multiple instances
- Chat Service: Multiple instances
- Presence Service: Multiple instances (with Redis)
- Notification Service: Multiple instances (Kafka consumer group)

**Scaling Strategy**:
```
Production Setup:
- API Gateway: 3+ instances (Load Balanced)
- Auth Service: 2+ instances
- Chat Service: 3+ instances (with Kafka partitions)
- Presence Service: 2+ instances
- Notification Service: 2+ instances (consumer group)
```

### Data Partitioning

**Kafka Partitions**:
- Partition by userId or conversationId
- Enables parallel processing
- Maintains ordering per partition

**Database Sharding** (Future):
- Shard by userId
- Separate read replicas for queries

---

## Security Architecture

### Authentication Flow

```
1. User registers/logs in → Auth Service
2. Auth Service returns JWT access token (1h) + refresh token (7d)
3. Client stores tokens securely
4. Every request includes: Authorization: Bearer {accessToken}
5. API Gateway validates token with Auth Service
6. If valid, request forwarded to microservice
7. If expired, client uses refresh token to get new access token
```

### Token Structure

**Access Token** (JWT):
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "username": "johndoe",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Security Best Practices**:
- Passwords hashed with bcrypt (10 rounds)
- JWT secrets in environment variables
- HTTPS in production (not in dev)
- CORS enabled with whitelist
- Rate limiting (planned)
- Input validation on all endpoints

---

## Monitoring & Observability

### Logging Strategy

Each service logs:
- **Info**: Service start, significant operations
- **Error**: All errors with stack traces
- **Debug**: Detailed flow for development

### Metrics to Monitor

**Service Health**:
- CPU usage
- Memory usage
- Request rate
- Error rate
- Response time

**Infrastructure Health**:
- Kafka lag per consumer group
- Redis memory usage
- PostgreSQL connections
- Disk usage

**Business Metrics**:
- Messages sent per minute
- Active users
- Notification delivery rate

### Tools (Planned)

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **ELK Stack**: Centralized logging
- **Jaeger**: Distributed tracing

---

## Testing Strategy

### Unit Tests
- Service methods
- Business logic
- Utilities

### Integration Tests
- Database operations
- Kafka producers/consumers
- Redis operations

### E2E Tests
- Complete user flows
- GraphQL API testing
- Service-to-service communication

---

## Deployment Architecture

### Development (Current)
```
Local machine with Docker Compose:
- All infrastructure in containers
- Services run natively (npm run start:dev)
- Hot reload enabled
```

### Production (Recommended)

**Kubernetes Cluster**:
```
- Each service in separate Deployment
- Services exposed via ClusterIP
- API Gateway exposed via LoadBalancer/Ingress
- Kafka, Redis, PostgreSQL as StatefulSets
- Helm charts for deployment
- HPA (Horizontal Pod Autoscaler)
```

---

## Future Enhancements

1. **WebSocket Support**: Real-time message delivery
2. **File Uploads**: S3 integration for images/files
3. **Message Encryption**: End-to-end encryption
4. **Read Receipts**: Track message delivery status
5. **Typing Indicators**: Show when user is typing
6. **Group Chats**: Multi-participant conversations
7. **Message Search**: Elasticsearch integration
8. **Video Calls**: WebRTC signaling
9. **Push Notifications**: Firebase/APNs integration
10. **Analytics**: User behavior tracking

---

This architecture provides a solid foundation for a scalable, resilient, and maintainable chat application!
