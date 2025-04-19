# EdTech Platform API

Backend API for Professor Chad's EdTech platform.

## Features

- **Authentication and Authorization**: User registration, login, and role-based access control
- **Course Management**: Create, update, delete, and list courses
- **Video Uploads**: Upload and manage course videos with AI-based transcription
- **Enrollments**: Student course enrollments and progress tracking
- **Real-time Chat**: Chat rooms for course discussions
- **Payments**: Process payments for course enrollments

## Technologies

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Multer for file uploads

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. Clone the repository

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following
```
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=EdTech
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

# Uploads
UPLOAD_PATH=uploads/

# Authentication
JWT_SECRET=your_jwt_secret_key

# Payment
STRIPE_SECRET_KEY=your_stripe_secret_key
```

4. Create PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE EdTech;
```

5. Run the database schema script (use the provided SQL file)

6. Start the server
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/user/:id` - Get user by ID

### Courses

- `GET /api/courses` - Get all published courses with details including title, description, thumbnail, price, student count, and total duration
- `GET /api/courses/:id` - Get a single course with complete details including videos, student count, and total duration
- `POST /api/courses` - Create a new course (tutors only)
- `PUT /api/courses/:id` - Update a course (tutors only)
- `DELETE /api/courses/:id` - Delete a course (tutors only)
- `GET /api/courses/tutor/:tutorId` - Get all courses for a tutor (tutors only)

### Videos

- `GET /api/videos/course/:courseId` - Get all videos for a course
- `GET /api/videos/:id` - Get video details with transcript
- `POST /api/videos` - Upload a video (tutors only)
- `PUT /api/videos/:id` - Update video details (tutors only)
- `DELETE /api/videos/:id` - Delete a video (tutors only)
- `PUT /api/videos/:id/progress` - Update video progress (students only)

### Enrollments

- `POST /api/enrollments` - Enroll in a course (students only)
- `GET /api/enrollments/student/:studentId` - Get all courses a student is enrolled in (students only)
- `GET /api/enrollments/:id` - Get a single enrollment with course details (students only)
- `GET /api/enrollments/course/:courseId` - Get all enrollments for a course (tutors only)

### Chat

- `GET /api/chat/room/:courseId` - Get chat room for a course
- `POST /api/chat/message` - Send a message
- `GET /api/chat/messages/:roomId` - Get chat messages with pagination

### Payments

- `POST /api/payments/process` - Process a payment and enroll in a course (students only)
- `GET /api/payments/history` - Get payment history (students only)
- `GET /api/payments/earnings` - Get tutor earnings (tutors only)

### Users

- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change user password
- `GET /api/users/tutor/:id` - Get tutor profile (public)

## For More Information

See the `POSTMAN_TESTING.md` file for detailed examples of API requests and responses.

## License

This project is licensed under the ISC License.