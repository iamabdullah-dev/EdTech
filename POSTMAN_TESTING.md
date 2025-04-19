# EdTech API - Postman Testing Guide

This document provides detailed instructions for testing the EdTech API using Postman.

## Setting Up Postman

1. Download and install [Postman](https://www.postman.com/downloads/)
2. Create a new collection named "EdTech API"
3. Set up environment variables:
   - Create a new environment (e.g., "EdTech Local")
   - Add the following variables:
     - `baseUrl`: `http://localhost:5000/api`
     - `studentId`: (leave empty, will be filled during testing)
     - `tutorId`: (leave empty, will be filled during testing)
     - `courseId`: (leave empty, will be filled during testing)
     - `videoId`: (leave empty, will be filled during testing)
     - `enrollmentId`: (leave empty, will be filled during testing)
     - `chatRoomId`: (leave empty, will be filled during testing)

## Common HTTP Methods Used

- **GET**: Used to retrieve data (read-only)
- **POST**: Used to create new resources
- **PUT**: Used to update existing resources
- **DELETE**: Used to remove resources

## Testing Flow

For a complete test of the API, follow this flow:

1. Register users (tutor and student)
2. Login to verify credentials
3. Create a course
4. Upload videos to the course
5. Enroll a student in the course
6. Track video progress
7. Test chat functionality

## API Endpoints

### Authentication

#### Register a tutor

**Method**: `POST`  
**URL**: `{{baseUrl}}/auth/register`  
**Content-Type**: `application/json`

Body:
```json
{
  "email": "tutor@example.com",
  "password": "password123",
  "fullName": "Professor Chad",
  "userType": "tutor"
}
```

Expected Response (201 Created):
```json
{
  "success": true,
  "user": {
    "id": "b0812ed9-94f3-48cd-be14-a3183219ad9d", 
    "email": "tutor@example.com",
    "fullName": "Professor Chad",
    "userType": "tutor"
  }
}
```

After getting the response, save the tutor ID:
```javascript
pm.environment.set("tutorId", pm.response.json().user.id);
```

#### Register a student

**Method**: `POST`  
**URL**: `{{baseUrl}}/auth/register`  
**Content-Type**: `application/json`

Body:
```json
{
  "email": "student@example.com",
  "password": "password123",
  "fullName": "John Student",
  "userType": "student"
}
```

Expected Response (201 Created):
```json
{
  "success": true,
  "user": {
    "id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
    "email": "student@example.com",
    "fullName": "John Student",
    "userType": "student"
  }
}
```

After getting the response, save the student ID:
```javascript
pm.environment.set("studentId", pm.response.json().user.id);
```

#### Login a user

**Method**: `POST`  
**URL**: `{{baseUrl}}/auth/login`  
**Content-Type**: `application/json`

Body:
```json
{
  "email": "tutor@example.com",
  "password": "password123"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
    "email": "tutor@example.com",
    "fullName": "Professor Chad",
    "userType": "tutor"
  }
}
```

#### Get user by ID

**Method**: `GET`  
**URL**: `{{baseUrl}}/auth/user/{{tutorId}}`  
**Content-Type**: `application/json`

Expected Response (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
    "email": "tutor@example.com",
    "fullName": "Professor Chad",
    "userType": "tutor",
    "profilePicture": null,
    "bio": null
  }
}
```

### Courses

#### Create a course

**Method**: `POST`  
**URL**: `{{baseUrl}}/courses`  
**Content-Type**: `multipart/form-data`

Body (form-data):
```
title: Introduction to Coding
description: Learn the basics of programming
price: 99.99
tutorId: {{tutorId}}
thumbnail: [upload an image file]
```

Expected Response (201 Created):
```json
{
  "success": true,
  "course": {
    "id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "tutor_id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
    "title": "Introduction to Coding",
    "description": "Learn the basics of programming",
    "thumbnail_url": "/uploads/1650123456789-example.jpg",
    "price": "99.99",
    "is_published": false,
    "created_at": "2023-04-20T08:30:45.123Z",
    "updated_at": "2023-04-20T08:30:45.123Z"
  }
}
```

After getting the response, save the course ID:
```javascript
pm.environment.set("courseId", pm.response.json().course.id);
```

#### Get all courses

**Method**: `GET`  
**URL**: `{{baseUrl}}/courses`

Response includes:
- Course title, description, and thumbnail
- Price
- Number of students enrolled (enrollmentCount)
- Total course duration (totalHours, totalMinutes, formattedDuration)
- Tutor name

Expected Response (200 OK):
```json
{
  "success": true,
  "count": 1,
  "courses": [
    {
      "id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "tutor_id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
      "title": "Introduction to Coding",
      "description": "Learn the basics of programming",
      "thumbnail_url": "/uploads/1650123456789-example.jpg",
      "price": "99.99",
      "is_published": true,
      "created_at": "2023-04-20T08:30:45.123Z",
      "updated_at": "2023-04-20T08:30:45.123Z",
      "tutor_name": "Professor Chad",
      "enrollmentCount": 0,
      "totalHours": 0,
      "totalMinutes": 0,
      "formattedDuration": "0h 0m"
    }
  ]
}
```

#### Get a single course

**Method**: `GET`  
**URL**: `{{baseUrl}}/courses/{{courseId}}`

Response includes:
- Course title, description, and thumbnail
- Price
- Number of students enrolled (enrollmentCount)
- Total course duration (totalHours, totalMinutes, formattedDuration)
- Tutor information (name, bio, profile picture)
- List of videos with details

Expected Response (200 OK):
```json
{
  "success": true,
  "course": {
    "id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "tutor_id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
    "title": "Introduction to Coding",
    "description": "Learn the basics of programming",
    "thumbnail_url": "/uploads/1650123456789-example.jpg",
    "price": "99.99",
    "is_published": true,
    "created_at": "2023-04-20T08:30:45.123Z",
    "updated_at": "2023-04-20T08:30:45.123Z",
    "tutor_name": "Professor Chad",
    "tutor_bio": null,
    "tutor_profile_picture": null,
    "videos": [],
    "enrollmentCount": 0,
    "totalHours": 0,
    "totalMinutes": 0,
    "formattedDuration": "0h 0m"
  }
}
```

#### Update a course

**Method**: `PUT`  
**URL**: `{{baseUrl}}/courses/{{courseId}}`  
**Content-Type**: `multipart/form-data`

Body (form-data):
```
title: Introduction to Coding - Updated
description: Learn the basics of programming with updated content
price: 89.99
isPublished: true
tutorId: {{tutorId}}
thumbnail: [upload an image file, optional]
```

Expected Response (200 OK):
```json
{
  "success": true,
  "course": {
    "id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "tutor_id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
    "title": "Introduction to Coding - Updated",
    "description": "Learn the basics of programming with updated content",
    "thumbnail_url": "/uploads/1650123456789-example.jpg",
    "price": "89.99",
    "is_published": true,
    "created_at": "2023-04-20T08:30:45.123Z",
    "updated_at": "2023-04-20T09:15:22.456Z"
  }
}
```

#### Get tutor's courses

**Method**: `GET`  
**URL**: `{{baseUrl}}/courses/tutor/{{tutorId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "count": 1,
  "courses": [
    {
      "id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "tutor_id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
      "title": "Introduction to Coding - Updated",
      "description": "Learn the basics of programming with updated content",
      "thumbnail_url": "/uploads/1650123456789-example.jpg",
      "price": "89.99",
      "is_published": true,
      "created_at": "2023-04-20T08:30:45.123Z",
      "updated_at": "2023-04-20T09:15:22.456Z",
      "enrollment_count": "0",
      "video_count": "0"
    }
  ]
}
```

#### Delete a course

**Method**: `DELETE`  
**URL**: `{{baseUrl}}/courses/{{courseId}}`  
**Content-Type**: `application/json`

Body:
```json
{
  "tutorId": "{{tutorId}}"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

### Videos

#### Upload a video

**Method**: `POST`  
**URL**: `{{baseUrl}}/videos`  
**Content-Type**: `multipart/form-data`

Body (form-data):
```
title: Introduction to Variables
description: Learn about variables in programming
courseId: {{courseId}}
sequenceOrder: 1
tutorId: {{tutorId}}
video: [upload a video file]
```

Expected Response (201 Created):
```json
{
  "success": true,
  "video": {
    "id": "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "title": "Introduction to Variables",
    "description": "Learn about variables in programming",
    "video_url": "/uploads/1650123456790-video.mp4",
    "sequence_order": 1,
    "duration": 300,
    "created_at": "2023-04-20T10:00:00.000Z",
    "updated_at": "2023-04-20T10:00:00.000Z"
  }
}
```

After getting the response, save the video ID:
```javascript
pm.environment.set("videoId", pm.response.json().video.id);
```

#### Get all videos for a course

**Method**: `GET`  
**URL**: `{{baseUrl}}/videos/course/{{courseId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "count": 1,
  "videos": [
    {
      "id": "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
      "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "title": "Introduction to Variables",
      "description": "Learn about variables in programming",
      "video_url": "/uploads/1650123456790-video.mp4",
      "sequence_order": 1,
      "duration": 300,
      "created_at": "2023-04-20T10:00:00.000Z",
      "updated_at": "2023-04-20T10:00:00.000Z"
    }
  ]
}
```

#### Get a single video

**Method**: `GET`  
**URL**: `{{baseUrl}}/videos/{{videoId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "video": {
    "id": "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "title": "Introduction to Variables",
    "description": "Learn about variables in programming",
    "video_url": "/uploads/1650123456790-video.mp4",
    "sequence_order": 1,
    "duration": 300,
    "created_at": "2023-04-20T10:00:00.000Z",
    "updated_at": "2023-04-20T10:00:00.000Z",
    "tutor_id": "b0812ed9-94f3-48cd-be14-a3183219ad9d"
  },
  "transcript": {
    "id": "9s8r7q-6p5o4n-3m2l1k-j0i9h8-g7f6e5d4c3b2a",
    "video_id": "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    "content": "This is a placeholder transcript. In a real implementation, this would be generated by an AI service.",
    "is_ai_generated": true,
    "created_at": "2023-04-20T10:00:00.000Z",
    "updated_at": "2023-04-20T10:00:00.000Z"
  },
  "timestamps": []
}
```

#### Update video details

**Method**: `PUT`  
**URL**: `{{baseUrl}}/videos/{{videoId}}`  
**Content-Type**: `application/json`

Body:
```json
{
  "title": "Introduction to Variables - Updated",
  "description": "Learn about variables in programming with examples",
  "sequenceOrder": 1,
  "tutorId": "{{tutorId}}"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "video": {
    "id": "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "title": "Introduction to Variables - Updated",
    "description": "Learn about variables in programming with examples",
    "video_url": "/uploads/1650123456790-video.mp4",
    "sequence_order": 1,
    "duration": 300,
    "created_at": "2023-04-20T10:00:00.000Z",
    "updated_at": "2023-04-20T10:15:30.000Z"
  }
}
```

#### Update video progress

**Method**: `PUT`  
**URL**: `{{baseUrl}}/videos/{{videoId}}/progress`  
**Content-Type**: `application/json`

Body:
```json
{
  "position": 120,
  "isCompleted": false,
  "studentId": "{{studentId}}"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "progress": {
    "id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
    "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
    "video_id": "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    "position": 120,
    "is_completed": false,
    "created_at": "2023-04-20T10:30:00.000Z",
    "updated_at": "2023-04-20T10:30:00.000Z"
  }
}
```

#### Delete a video

**Method**: `DELETE`  
**URL**: `{{baseUrl}}/videos/{{videoId}}`  
**Content-Type**: `application/json`

Body:
```json
{
  "tutorId": "{{tutorId}}"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

### Enrollments

#### Enroll in a course

**Method**: `POST`  
**URL**: `{{baseUrl}}/enrollments`  
**Content-Type**: `application/json`

Body:
```json
{
  "courseId": "{{courseId}}",
  "studentId": "{{studentId}}"
}
```

Expected Response (201 Created):
```json
{
  "success": true,
  "enrollment": {
    "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
    "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "created_at": "2023-04-20T11:00:00.000Z"
  }
}
```

After getting the response, save the enrollment ID:
```javascript
pm.environment.set("enrollmentId", pm.response.json().enrollment.id);
```

#### Get student enrollments

**Method**: `GET`  
**URL**: `{{baseUrl}}/enrollments/student/{{studentId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "enrollments": [
    {
      "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
      "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
      "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "created_at": "2023-04-20T11:00:00.000Z",
      "course": {
        "title": "Introduction to Coding - Updated",
        "description": "Learn the basics of programming with updated content",
        "thumbnail_url": "/uploads/1650123456789-example.jpg",
        "tutor_name": "Professor Chad"
      }
    }
  ]
}
```

#### Get a single enrollment

**Method**: `GET`  
**URL**: `{{baseUrl}}/enrollments/{{enrollmentId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "enrollment": {
    "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
    "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "created_at": "2023-04-20T11:00:00.000Z",
    "course": {
      "title": "Introduction to Coding - Updated",
      "description": "Learn the basics of programming with updated content",
      "thumbnail_url": "/uploads/1650123456789-example.jpg",
      "videos": [
        {
          "id": "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
          "title": "Introduction to Variables - Updated",
          "description": "Learn about variables in programming with examples",
          "sequence_order": 1,
          "duration": 300
        }
      ],
      "tutor": {
        "id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
        "fullName": "Professor Chad"
      }
    }
  }
}
```

#### Get all enrollments for a course

**Method**: `GET`  
**URL**: `{{baseUrl}}/enrollments/course/{{courseId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "enrollments": [
    {
      "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
      "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
      "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "created_at": "2023-04-20T11:00:00.000Z",
      "student": {
        "id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
        "fullName": "John Student",
        "email": "student@example.com"
      }
    }
  ]
}
```

### Chat

#### Get chat room for a course

**Method**: `GET`  
**URL**: `{{baseUrl}}/chat/room/{{courseId}}`  
**Query Parameters**: `userId={{studentId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "room": {
    "id": "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "name": "Introduction to Coding Discussion",
    "created_at": "2023-04-20T08:30:45.123Z"
  }
}
```

After getting the response, save the chat room ID:
```javascript
pm.environment.set("chatRoomId", pm.response.json().room.id);
```

#### Send a message

**Method**: `POST`  
**URL**: `{{baseUrl}}/chat/message`  
**Content-Type**: `application/json`

Body:
```json
{
  "roomId": "{{chatRoomId}}",
  "userId": "{{studentId}}",
  "content": "Hello, I have a question about the course"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "message": {
    "id": "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
    "room_id": "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
    "user_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
    "content": "Hello, I have a question about the course",
    "created_at": "2023-04-20T12:00:00.000Z",
    "user": {
      "id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
      "full_name": "John Student",
      "profile_picture": null,
      "user_type": "student"
    }
  }
}
```

#### Get messages for a room

**Method**: `GET`  
**URL**: `{{baseUrl}}/chat/messages/{{chatRoomId}}`  
**Query Parameters**: `userId={{studentId}}&limit=50&page=1`

Expected Response (200 OK):
```json
{
  "success": true,
  "messages": [
    {
      "id": "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
      "roomId": "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
      "content": "Hello, I have a question about the course",
      "createdAt": "2023-04-20T12:00:00.000Z",
      "user": {
        "id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
        "fullName": "John Student",
        "profilePicture": null,
        "userType": "student"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalMessages": 1,
    "totalPages": 1
  }
}
```

### User Management

#### Update user profile

**Method**: `PUT`  
**URL**: `{{baseUrl}}/users/profile`  
**Content-Type**: `multipart/form-data`

Body (form-data):
```
userId: {{tutorId}}
fullName: Professor Chad (Updated)
bio: Expert instructor with over 10 years of experience
profilePicture: [upload an image file, optional]
```

Expected Response (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
    "full_name": "Professor Chad (Updated)",
    "email": "tutor@example.com",
    "bio": "Expert instructor with over 10 years of experience",
    "profile_picture": "/uploads/1650123456791-profile.jpg",
    "user_type": "tutor",
    "created_at": "2023-04-20T08:00:00.000Z",
    "updated_at": "2023-04-20T13:00:00.000Z"
  }
}
```

#### Change password

**Method**: `PUT`  
**URL**: `{{baseUrl}}/users/password`  
**Content-Type**: `application/json`

Body:
```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

#### Get tutor profile

**Method**: `GET`  
**URL**: `{{baseUrl}}/users/tutor/{{tutorId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "tutor": {
    "id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
    "full_name": "Professor Chad (Updated)",
    "email": "tutor@example.com",
    "bio": "Expert instructor with over 10 years of experience",
    "profile_picture": "/uploads/1650123456791-profile.jpg",
    "created_at": "2023-04-20T08:00:00.000Z",
    "course_count": "1",
    "student_count": "1",
    "average_rating": "0",
    "courses": [
      {
        "id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
        "title": "Introduction to Coding - Updated",
        "description": "Learn the basics of programming with updated content",
        "thumbnail": "/uploads/1650123456789-example.jpg",
        "price": "89.99",
        "created_at": "2023-04-20T08:30:45.123Z",
        "student_count": "1",
        "average_rating": "0"
      }
    ]
  }
}
```

### Payments

#### Process a payment

**Method**: `POST`  
**URL**: `{{baseUrl}}/payments/process`  
**Content-Type**: `application/json`

Body:
```json
{
  "courseId": "{{courseId}}",
  "userId": "{{studentId}}",
  "paymentMethodId": "pm_card_visa"
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "payment": {
    "id": "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
    "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "amount": "89.99",
    "status": "completed",
    "created_at": "2023-04-20T14:00:00.000Z"
  },
  "enrollment": {
    "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
    "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
    "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
    "created_at": "2023-04-20T14:00:00.000Z"
  },
  "message": "Payment processed successfully"
}
```

#### Get payment history

**Method**: `GET`  
**URL**: `{{baseUrl}}/payments/history`  
**Query Parameters**: `studentId={{studentId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "payments": [
    {
      "id": "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
      "amount": "89.99",
      "status": "completed",
      "created_at": "2023-04-20T14:00:00.000Z",
      "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "course_title": "Introduction to Coding - Updated",
      "course_thumbnail": "/uploads/1650123456789-example.jpg",
      "tutor_id": "b0812ed9-94f3-48cd-be14-a3183219ad9d",
      "tutor_name": "Professor Chad (Updated)"
    }
  ]
}
```

#### Get tutor earnings

**Method**: `GET`  
**URL**: `{{baseUrl}}/payments/earnings`  
**Query Parameters**: `tutorId={{tutorId}}`

Expected Response (200 OK):
```json
{
  "success": true,
  "totalEarnings": "89.99",
  "courseEarnings": [
    {
      "id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "title": "Introduction to Coding - Updated",
      "total_sales": "1",
      "total_amount": "89.99"
    }
  ],
  "recentTransactions": [
    {
      "id": "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
      "amount": "89.99",
      "created_at": "2023-04-20T14:00:00.000Z",
      "status": "completed",
      "course_id": "f5a9c7e3-9d1b-4b80-8c7d-9e5f3a2b1c0d",
      "course_title": "Introduction to Coding - Updated",
      "student_id": "7c8f5c76-4c32-4a35-9f5a-38f875e11d4a",
      "student_name": "John Student"
    }
  ]
}
```

## Testing Tips

1. **Sequential Testing**: Follow the testing flow in order, as many endpoints depend on data created by earlier requests.

2. **Environment Variables**: Use Postman environment variables to store and reuse values returned from API responses.

3. **Tests Tab**: Write tests in the "Tests" tab of each request to validate responses:

   ```javascript
   // Example test to check if the response was successful
   pm.test("Status code is 200 or 201", function() {
     pm.expect(pm.response.code).to.be.oneOf([200, 201]);
   });
   
   // Example test to check if the response contains expected data
   pm.test("Response contains user data", function() {
     pm.expect(pm.response.json().user).to.be.an('object');
   });
   ```

4. **Collection Runner**: Use Postman's Collection Runner to run multiple requests in sequence.

5. **Handling Errors**: Check the response body for error messages when a request fails.

## Common HTTP Status Codes

- **200 OK**: The request has succeeded
- **201 Created**: The request has succeeded and a new resource has been created
- **400 Bad Request**: The server cannot process the request due to client error
- **401 Unauthorized**: Authentication is required and has failed or not been provided
- **403 Forbidden**: The client does not have permission to access the requested resource
- **404 Not Found**: The server cannot find the requested resource
- **500 Internal Server Error**: The server has encountered a situation it doesn't know how to handle

## Troubleshooting

1. **Database Connection**: Ensure PostgreSQL is running and the database exists.

2. **Missing IDs**: Make sure to include the required IDs (tutorId, studentId) in your requests.

3. **File Uploads**: For endpoints that require file uploads, use form-data and ensure the file field names match the expected names.

4. **Port Conflicts**: If port 5000 is already in use, modify the PORT in your .env file.