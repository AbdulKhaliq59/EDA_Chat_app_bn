# Event-Driven Architecture Chat Microservice

A scalable, event-driven chat application built with NestJS microservices, Kafka, Redis, PostgreSQL, and GraphQL. **Now with Profile Management and Rich Media Support!**

## ✅ Project Status: **ENHANCED & COMPLETE**

All microservices are fully implemented with event-driven architecture. Latest enhancements include:
- ✨ **Profile Management Service** - User profiles with media uploads via Cloudinary
- ✨ **Advanced Messaging** - Rich media support (images, videos, audio, documents, voice messages)
- ✨ **Cloudinary Integration** - Secure cloud storage and media delivery

See [IMPLEMENTATION_ADDITIONS.md](IMPLEMENTATION_ADDITIONS.md) for new features and [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for setup.

## 🏗️ Architecture Overview

This project implements a microservices architecture following Event-Driven Design (EDD) principles:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ GraphQL + REST
       ▼
┌─────────────────────┐
│  API Gateway        │ (Port 3000)
│  (GraphQL)          │
└──────┬──────────────┘
       │
       ├──────────────┬────────────────┬────────────────┬──────────────┐
       ▼              ▼                ▼                ▼              ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│Auth Service │ │Chat Service  │ │Presence      │ │Notification │ │Profile Service  │
│ (Port 3001) │ │(Port 3002)   │ │Service       │ │Service       │ │(Port 3004) 🆕   │
│             │ │🔄 Enhanced   │ │(Port 3003)   │ │(Port 3005)   │ │                  │
└──────┬──────┘ └──────┬───────┘ └──────┬───────┘ └──────┬──────┘ └────────┬─────────┘
       │                │                │                │                │
       ▼                ▼                ▼                ▼                ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Auth DB    │ │  Chat DB     │ │Presence DB   │ │Notification │ │Profile DB        │
│ PostgreSQL  │ │ PostgreSQL   │ │PostgreSQL    │ │  DB          │ │PostgreSQL 🆕    │
└─────────────┘ └──────┬───────┘ │(+ Attachments)                 │ │(+ Media Assets)  │
                       │          └──────┬───────┘ │PostgreSQL    │ └──────────────────┘
                       │                │         └──────────────┘
                       │                │                │
                       └────────────────┴────────────────┘
                              ▼
                          Kafka 📡
                              │
                              └─► Redis 💾 (Presence Cache)
                                   Cloudinary ☁️ (Media Storage 🆕)
```

## 🚀 Services

### 1. API Gateway (Port 3000)
- **Technology**: NestJS + GraphQL (Apollo Server)
- **Responsibilities**:
  - GraphQL API endpoint for clients
  - Request routing to microservices
  - JWT validation
  - WebSocket subscriptions for real-time updates

### 2. Auth Service (Port 3001)
- **Technology**: NestJS + TypeORM + PostgreSQL + JWT + OAuth 2.0
- **Responsibilities**:
  - User registration and login
  - **Google OAuth authentication (Web & Mobile)**
  - JWT token generation and validation
  - Refresh token management
  - Password hashing with bcrypt

**🆕 OAuth Support:** Now includes Google OAuth 2.0 for both web and mobile platforms. See [Google OAuth Setup Guide](GOOGLE_OAUTH_SETUP.md) for configuration.

### 3. Chat Service (Port 3002)
- **Technology**: NestJS + TypeORM + PostgreSQL + Kafka + Cloudinary
- **Responsibilities**:
  - Message creation and retrieval
  - Conversation management
  - **🆕 Rich media attachments** (images, videos, audio, documents, voice messages)
  - **🆕 Cloudinary integration** for media storage
  - Publish message events to Kafka
  - Schema validation with Schema Registry

**New Features:** Send messages with multiple attachments, voice messages, and more! See [IMPLEMENTATION_ADDITIONS.md](IMPLEMENTATION_ADDITIONS.md).

### 4. Presence Service (Port 3003)
- **Technology**: NestJS + Redis + TypeORM + PostgreSQL
- **Responsibilities**:
  - Track user online/offline status
  - Real-time presence updates
  - Redis caching for fast lookups

### 5. Notification Service (Port 3005)
- **Technology**: NestJS + Kafka + Redis + TypeORM + PostgreSQL
- **Responsibilities**:
  - Consume Kafka message events
  - Create and store notifications
  - Fan-out notifications via Redis
  - WebSocket push notifications

### 6. Profile Service (Port 3004) 🆕
- **Technology**: NestJS + TypeORM + PostgreSQL + Cloudinary + Kafka
- **Responsibilities**:
  - **User profile management** (name, bio, location, etc.)
  - **Profile picture uploads** with Cloudinary
  - **Cover image uploads**
  - **Media asset tracking** and cleanup
  - **Event publishing** for profile updates
  - Secure file handling with validation

**New Service:** Complete profile management with picture uploads. See [profile-service/README.md](profile-service/README.md).

## 🆕 New Features

### Profile Management
- ✅ Create and manage user profiles
- ✅ Upload profile pictures via Cloudinary
- ✅ Upload cover images
- ✅ Profile information (name, bio, location, website, phone, birthdate)
- ✅ Event-driven profile updates
- ✅ Secure image upload with validation

### Advanced Messaging
- ✅ Send messages with multiple attachments
- ✅ Support for images, videos, audio, documents, voice messages
- ✅ Media-only messages (text optional)
- ✅ Secure file uploads with Cloudinary
- ✅ Attachment metadata tracking (size, dimensions, duration)
- ✅ Backward compatible with text-only messages

### Cloudinary Integration
- ✅ Secure cloud storage for all media
- ✅ Automatic CDN delivery
- ✅ Automatic deletion of old media
- ✅ Token-based secure URLs
- ✅ Metadata tracking for images/videos

- **Framework**: NestJS
- **API**: GraphQL (Apollo Server)
- **Message Broker**: Apache Kafka + Zookeeper
- **Schema Registry**: Confluent Schema Registry
- **Cache & Pub/Sub**: Redis
- **Database**: PostgreSQL (4 separate databases)
- **Authentication**: JWT + Passport
- **Validation**: Class-validator, Class-transformer
- **ORM**: TypeORM

## 📦 Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Docker & Docker Compose

## 🚀 Getting Started

### 1. Start Infrastructure (Kafka, Redis, PostgreSQL)

```bash
docker-compose up -d
```

This will start:
- Zookeeper (Port 2181)
- Kafka (Ports 9092, 29092)
- Schema Registry (Port 8081)
- Redis (Port 6379)
- PostgreSQL databases for each service (Ports 5432-5435)

### 2. Install Dependencies

```bash
# API Gateway
cd api-gateway && npm install

# Auth Service
cd ../auth-service && npm install

# Chat Service
cd ../chat-service && npm install

# Presence Service
cd ../presence-service && npm install

# Notification Service
cd ../notification-service && npm install

# Shared Types (Optional)
cd ../shared && npm install && npm run build
```

### 3. Configure Environment Variables

Each service has a `.env.example` file. Copy it to `.env` and update if needed:

```bash
# API Gateway
cp api-gateway/.env.example api-gateway/.env

# Auth Service
cp auth-service/.env.example auth-service/.env

# Chat Service (when configured)
cp chat-service/.env.example chat-service/.env

# Presence Service (when configured)
cp presence-service/.env.example presence-service/.env

# Notification Service (when configured)
cp notification-service/.env.example notification-service/.env
```

### 4. Start Services

Open separate terminal windows for each service:

```bash
# Terminal 1 - Auth Service
cd auth-service && npm run start:dev

# Terminal 2 - Chat Service
cd chat-service && npm run start:dev

# Terminal 3 - Presence Service
cd presence-service && npm run start:dev

# Terminal 4 - Notification Service
cd notification-service && npm run start:dev

# Terminal 5 - API Gateway
cd api-gateway && npm run start:dev
```

## 🧪 Testing the Application

### Access GraphQL Playground

Open your browser and navigate to:
```
http://localhost:3000/graphql
```

### Example GraphQL Queries

**Register a User:**
```graphql
mutation {
  register(input: {
    email: "user@example.com"
    username: "johndoe"
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

**Login:**
```graphql
mutation {
  login(input: {
    email: "user@example.com"
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

**Send a Message (Authenticated):**
```graphql
mutation {
  sendMessage(input: {
    receiverId: "receiver-user-id"
    content: "Hello, World!"
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

**Update Presence Status:**
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

**Get Notifications:**
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
    page
    totalPages
  }
}
```

### Set Authorization Header

After login, copy the `accessToken` and add it to the HTTP Headers in GraphQL Playground:

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

## 📁 Project Structure

```
EDA_Chat_Microservice/
├── api-gateway/              # GraphQL API Gateway
│   └── src/
│       ├── auth/             # Auth GraphQL module
│       ├── chat/             # Chat GraphQL module
│       ├── presence/         # Presence GraphQL module
│       ├── notification/     # Notification GraphQL module
│       └── common/           # Guards, decorators
├── auth-service/             # Authentication microservice
│   └── src/
│       ├── auth/             # Auth logic
│       └── users/            # User management
├── chat-service/             # Chat microservice
│   └── src/
│       ├── messages/         # Message handling
│       ├── conversations/    # Conversation management
│       └── kafka/            # Kafka producers
├── presence-service/         # Presence tracking microservice
│   └── src/
│       ├── presence/         # Presence logic
│       └── redis/            # Redis integration
├── notification-service/     # Notification microservice
│   └── src/
│       ├── notifications/    # Notification handling
│       └── kafka/            # Kafka consumers
├── shared/                   # Shared types and schemas
│   └── src/
│       ├── types/            # TypeScript interfaces
│       └── events/           # Kafka event schemas
└── docker-compose.yml        # Infrastructure setup
```

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS**: Enabled for cross-origin requests
- **Validation**: Input validation with class-validator
- **Environment Variables**: Sensitive data in .env files (not committed)

## 🔧 Development

### Build Shared Types

```bash
cd shared
npm run build
```

### Run Tests

```bash
# In each service directory
npm run test
```

### Lint Code

```bash
npm run lint
```

## 📊 Monitoring

### Check Kafka Topics

```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Check Redis Keys

```bash
docker exec -it redis redis-cli KEYS '*'
```

### Check PostgreSQL Databases

```bash
# Auth DB
docker exec -it auth-db psql -U auth_user -d auth_db

# Chat DB
docker exec -it chat-db psql -U chat_user -d chat_db
```

## 🚧 Roadmap

- [x] ✅ Google OAuth 2.0 authentication (Web & Mobile)
- [ ] Complete Chat Service with Kafka integration
- [ ] Complete Presence Service with Redis
- [ ] Complete Notification Service with Kafka consumers
- [ ] Add WebSocket support for real-time notifications
- [ ] Implement message read receipts
- [ ] Add file/image upload support
- [ ] Implement message encryption
- [ ] Add unit and e2e tests
- [ ] Add Docker Compose for services
- [ ] Add API documentation with Swagger
- [ ] Add more OAuth providers (Facebook, GitHub, etc.)
- [ ] Implement rate limiting
- [ ] Add monitoring with Prometheus & Grafana

## 📝 Environment Variables

### API Gateway
```
PORT=3000
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://localhost:3001
CHAT_SERVICE_URL=http://localhost:3002
PRESENCE_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
```

### Auth Service
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=auth_user
DB_PASSWORD=auth_password
DB_NAME=auth_db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRATION=7d

# Google OAuth (See GOOGLE_OAUTH_SETUP.md for details)
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
GOOGLE_MOBILE_CLIENT_ID=your-mobile-client-id.apps.googleusercontent.com
GOOGLE_MOBILE_CLIENT_SECRET=your-mobile-client-secret
GOOGLE_MOBILE_CALLBACK_URL=http://localhost:3001/auth/google/mobile/callback
WEB_APP_URL=http://localhost:3000
MOBILE_APP_SCHEME=myapp
```

## 📚 Additional Documentation

- [Google OAuth Setup Guide](GOOGLE_OAUTH_SETUP.md) - Complete guide for Google OAuth 2.0 integration
- [Quick Start - Google OAuth](GOOGLE_OAUTH_QUICKSTART.md) - Quick reference for OAuth setup
- [Architecture Documentation](ARCHITECTURE.md) - Detailed architecture overview
- [Project Status](PROJECT_STATUS.md) - Current implementation status
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

## 👨‍💻 Author

Your Name

---

**Note**: This is a development setup. For production, ensure to:
- Use proper secret management
- Set `synchronize: false` in TypeORM
- Implement database migrations
- Add proper logging and monitoring
- Use environment-specific configurations
- Implement rate limiting and security headers
- Add health checks for all services
