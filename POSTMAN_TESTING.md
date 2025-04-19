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

## Testing Flow

For a complete test of the API, follow this flow:

1. Register users (tutor and student)
2. Create a course
3. Upload videos to the course
4. Enroll a student in the course
5. Track video progress
6. Test chat functionality

## API Endpoints

### Authentication

#### Register a user

```
POST {{baseUrl}}/auth/register
```

Body:
```json
{
  "email": "tutor@example.com",
  "password": "password123",
  "fullName": "Professor Chad",
  "userType": "tutor"
}
```

After getting the response, save the tutor ID:
```
pm.environment.set("tutorId", pm.response.json().user.id);
```

Register a student:
```json
{
  "email": "student@example.com",
  "password": "password123",
  "fullName": "John Student",
  "userType": "student"
}
```

After getting the response, save the student ID:
```
pm.environment.set("studentId", pm.response.json().user.id);
```

#### Login a user

```
POST {{baseUrl}}/auth/login
```

Body:
```json
{
  "email": "tutor@example.com",
  "password": "password123"
}
```

#### Get user by ID

```
GET {{baseUrl}}/auth/user/{{tutorId}}
```

### Courses

#### Create a course

```
POST {{baseUrl}}/courses
```

Headers:
```
Content-Type: multipart/form-data
```

Body (form-data):
```
title: Introduction to Coding
description: Learn the basics of programming
price: 99.99
tutorId: {{tutorId}}
thumbnail: [upload an image file]
```

After getting the response, save the course ID:
```
pm.environment.set("courseId", pm.response.json().course.id);
```

#### Get all courses

```
GET {{baseUrl}}/courses
```

Response includes:
- Course title, description, and thumbnail
- Price
- Number of students enrolled (enrollmentCount)
- Total course duration (totalHours, totalMinutes, formattedDuration)
- Tutor name

#### Get a single course

```
GET {{baseUrl}}/courses/{{courseId}}
```

Response includes:
- Course title, description, and thumbnail
- Price
- Number of students enrolled (enrollmentCount)
- Total course duration (totalHours, totalMinutes, formattedDuration)
- Tutor information (name, bio, profile picture)
- List of videos with details

#### Update a course

```
PUT {{baseUrl}}/courses/{{courseId}}
```

Headers:
```
Content-Type: multipart/form-data
```

Body (form-data):
```
title: Introduction to Coding - Updated
description: Learn the basics of programming with updated content
price: 89.99
isPublished: true
tutorId: {{tutorId}}
thumbnail: [upload an image file, optional]
```

#### Get tutor's courses

```
GET {{baseUrl}}/courses/tutor/{{tutorId}}
```

#### Delete a course

```
DELETE {{baseUrl}}/courses/{{courseId}}
```

Body:
```json
{
  "tutorId": "{{tutorId}}"
}
```

### Videos

#### Upload a video

```
POST {{baseUrl}}/videos
```

Headers:
```
Content-Type: multipart/form-data
```

Body (form-data):
```
title: Introduction to Variables
description: Learn about variables in programming
courseId: {{courseId}}
sequenceOrder: 1
tutorId: {{tutorId}}
video: [upload a video file]
```

After getting the response, save the video ID:
```
pm.environment.set("videoId", pm.response.json().video.id);
```

#### Get all videos for a course

```
GET {{baseUrl}}/videos/course/{{courseId}}
```

#### Get a single video

```
GET {{baseUrl}}/videos/{{videoId}}
```

#### Update video details

```
PUT {{baseUrl}}/videos/{{videoId}}
```

Body:
```json
{
  "title": "Introduction to Variables - Updated",
  "description": "Learn about variables in programming with examples",
  "sequenceOrder": 1,
  "tutorId": "{{tutorId}}"
}
```

#### Update video progress

```
PUT {{baseUrl}}/videos/{{videoId}}/progress
```

Body:
```json
{
  "position": 120,
  "isCompleted": false,
  "studentId": "{{studentId}}"
}
```

#### Delete a video

```
DELETE {{baseUrl}}/videos/{{videoId}}
```

Body:
```json
{
  "tutorId": "{{tutorId}}"
}
```

### Enrollments

#### Enroll in a course

```
POST {{baseUrl}}/enrollments
```

Body:
```json
{
  "courseId": "{{courseId}}",
  "studentId": "{{studentId}}"
}
```

After getting the response, save the enrollment ID:
```
pm.environment.set("enrollmentId", pm.response.json().enrollment.id);
```

#### Get student enrollments

```
GET {{baseUrl}}/enrollments/student/{{studentId}}
```

#### Get a single enrollment

```
GET {{baseUrl}}/enrollments/{{enrollmentId}}
```

#### Get all enrollments for a course

```
GET {{baseUrl}}/enrollments/course/{{courseId}}
```

### Chat

First, you need to get the chat room ID:

```
GET {{baseUrl}}/chat/room/{{courseId}}
```

After getting the response, save the chat room ID:
```
pm.environment.set("chatRoomId", pm.response.json().room.id);
```

#### Send a message

```
POST {{baseUrl}}/chat/message
```

Body:
```json
{
  "roomId": "{{chatRoomId}}",
  "message": "Hello, I have a question about the course",
  "parentMessageId": null,
  "userId": "{{studentId}}"
}
```

After getting the response, save the message ID:
```
pm.environment.set("messageId", pm.response.json().message.id);
```

#### Get messages for a room

```
GET {{baseUrl}}/chat/messages/{{chatRoomId}}
```

### User Management

#### Update user profile

```
PUT {{baseUrl}}/users/profile
```

Headers:
```
Content-Type: multipart/form-data
```

Body (form-data):
```