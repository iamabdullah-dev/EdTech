'use client';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getUser: (userId) => api.get(`/api/auth/user/${userId}`),
};

// Courses API
export const coursesAPI = {
  getAllCourses: () => api.get('/api/courses'),
  getCourse: (courseId) => api.get(`/api/courses/${courseId}`),
  createCourse: (courseData) => api.post('/api/courses', courseData),
  updateCourse: (courseId, courseData) => api.put(`/api/courses/${courseId}`, courseData),
  deleteCourse: (courseId, tutorId) => api.delete(`/api/courses/${courseId}`, { data: { tutorId } }),
  getTutorCourses: (tutorId) => api.get(`/api/courses/tutor/${tutorId}`),
};

// Videos API
export const videosAPI = {
  getCourseVideos: (courseId) => api.get(`/api/videos/course/${courseId}`),
  getVideo: (videoId) => api.get(`/api/videos/${videoId}`),
  uploadVideo: (videoData) => api.post('/api/videos', videoData),
  updateVideo: (videoId, videoData) => api.put(`/api/videos/${videoId}`, videoData),
  deleteVideo: (videoId, tutorId) => api.delete(`/api/videos/${videoId}`, { data: { tutorId } }),
  updateProgress: (videoId, progressData) => api.put(`/api/videos/${videoId}/progress`, progressData),
};

// Enrollments API
export const enrollmentsAPI = {
  enrollInCourse: (enrollmentData) => api.post('/api/enrollments', enrollmentData),
  getStudentEnrollments: (studentId) => api.get(`/api/enrollments/student/${studentId}`),
  getEnrollment: (enrollmentId) => api.get(`/api/enrollments/${enrollmentId}`),
  getCourseEnrollments: (courseId) => api.get(`/api/enrollments/course/${courseId}`),
};

// Chat API
export const chatAPI = {
  getChatRoom: (courseId, userId) => api.get(`/api/chat/room/${courseId}?userId=${userId}`),
  sendMessage: (messageData) => api.post('/api/chat/message', messageData),
  getMessages: (roomId, userId, limit = 50, page = 1) => 
    api.get(`/api/chat/messages/${roomId}?userId=${userId}&limit=${limit}&page=${page}`),
};

export default api; 