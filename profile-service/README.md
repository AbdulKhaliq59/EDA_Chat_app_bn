# Profile Service

Profile Management Service with rich media support via Cloudinary.

## Features

- **User Profile Management**: Create, read, update user profiles
- **Profile Picture Upload**: Upload and manage profile pictures with Cloudinary
- **Cover Image Upload**: Upload and manage cover images
- **Media Management**: Secure media asset storage and deletion
- **Event-Driven**: Publishes profile update events to Kafka
- **Authentication**: JWT-based authentication

## Running the Service

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Start production server
npm run start:prod
```

## Endpoints

### Profiles

- `POST /profiles` - Create a new profile
- `GET /profiles/me` - Get current user's profile
- `GET /profiles/:userId` - Get profile by userId
- `PATCH /profiles/me` - Update profile
- `DELETE /profiles/me/picture` - Delete profile picture

### Media

- `POST /profiles/me/picture` - Upload profile picture
- `POST /profiles/me/cover` - Upload cover image

## Environment Variables

See `.env.example` for required environment variables.

## Database

Uses PostgreSQL with TypeORM. Auto-synchronization is enabled in development mode.

## Events Published

- `profile.updated` - When profile is updated
- `profile.picture.updated` - When profile picture is uploaded/changed
