# Auth Template

A comprehensive authentication system built with NestJS, featuring JWT authentication, session management, email verification, and microservices architecture.

## 🚀 Features

### Authentication & Authorization
- **JWT Authentication** with access and refresh tokens
- **Local Strategy** with email/password login
- **Role-based Access Control** (RBAC) with user roles
- **Session Management** with device tracking
- **Email Verification** with OTP codes
- **Password Security** with bcrypt hashing

### User Management
- User registration and profile management
- Account activation via email verification
- Password change functionality
- User search and pagination
- Role-based permissions

### Session Management
- Device and browser tracking
- IP address logging
- Session expiration handling
- Automatic cleanup of expired sessions
- Session listing and management

### Notification System
- **Email Notifications** via SMTP
- **Microservices Architecture** with RabbitMQ
- OTP code delivery
- Account activation emails
- Resend verification codes

### Technical Features
- **PostgreSQL** database with TypeORM
- **Swagger/OpenAPI** documentation
- **Docker Compose** for development
- **Global validation** and error handling
- **CORS** enabled for cross-origin requests

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Authentication**: JWT, Passport
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Containerization**: Docker

## 📋 Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- PostgreSQL (if not using Docker)
- RabbitMQ (if not using Docker)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd auth-template
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://thn:100700@localhost:5432/auth

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_REFRESH_EXPIRES=7d

# RabbitMQ Configuration
RABBITMQ_URL=amqp://thn:100700@localhost:5672
RABBITMQ_QUEUE=auth_queue

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 4. Start Infrastructure Services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)

### 5. Run the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

The application will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api
- **RabbitMQ Management**: http://localhost:15672

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "Password@123"
}
```

#### Verify Email
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password@123"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "oldPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

### User Management Endpoints

#### Get All Users
```http
GET /users?page=1&limit=10&search=john
Authorization: Bearer <access-token>
```

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <access-token>
```

### Session Management Endpoints

#### Get All Sessions
```http
GET /session/get-all?page=1&limit=10
Authorization: Bearer <access-token>
```

## 🏗️ Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── decorators/         # Custom decorators (@Public, @Roles, etc.)
│   ├── dtos/              # Data Transfer Objects
│   ├── entities/          # Database entities (OtpCode)
│   ├── guards/            # Authentication guards
│   ├── strategies/        # Passport strategies (JWT, Local)
│   ├── types/             # TypeScript type definitions
│   ├── auth.controller.ts # Authentication endpoints
│   ├── auth.service.ts    # Authentication business logic
│   └── auth.module.ts     # Authentication module configuration
├── user/                  # User management module
│   ├── dtos/              # User DTOs
│   ├── entities/          # User entity
│   ├── enums/             # User enums (UserRole)
│   ├── user.controller.ts # User endpoints
│   ├── user.service.ts    # User business logic
│   └── user.module.ts     # User module configuration
├── session/               # Session management module
│   ├── dtos/              # Session DTOs
│   ├── entities/          # Session entity
│   ├── session.controller.ts # Session endpoints
│   ├── session.service.ts # Session business logic
│   └── session.module.ts  # Session module configuration
├── notification/          # Notification microservice
│   ├── notification.controller.ts # Message handlers
│   ├── notification.service.ts    # Notification logic
│   └── notification.module.ts     # Notification module
├── common/                # Shared utilities
│   ├── dtos/              # Common DTOs (Pagination)
│   └── interceptors/      # Global interceptors
├── app.module.ts          # Main application module
└── main.ts               # Application bootstrap
```

## 🔒 Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds
- Minimum password requirements enforced
- Password change requires old password verification

### JWT Security
- Access tokens expire in 3 days
- Refresh tokens expire in 7 days (configurable)
- JWT secret should be strong and environment-specific

### Session Security
- Session tracking with device information
- IP address logging for security monitoring
- Automatic cleanup of expired sessions
- Session-based token invalidation

### Email Verification
- OTP codes expire in 5 minutes
- Account activation required before login
- Resend OTP functionality with rate limiting


## 🚀 Deployment

### Docker Deployment
```bash
# Build the application
npm run build

# Build Docker image
docker build -t auth-template .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables for Production
Ensure all environment variables are properly set:
- Use strong JWT secrets
- Configure proper database credentials
- Set up email service credentials
- Configure Redis and RabbitMQ connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the Swagger documentation at `/api`
- Review the code examples in the controllers

## 🔄 Changelog

### Version 0.0.1
- Initial release with basic authentication
- JWT token management
- Email verification system
- Session management
- User CRUD operations
- Microservices architecture with RabbitMQ