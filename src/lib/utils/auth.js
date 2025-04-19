'use client';

// Authentication utilities for the EdTech platform

// Save user data to local storage after login/registration
export const setUserData = (userData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};

// Get the current user from local storage
export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

// Remove user data on logout
export const clearUserData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
};

// Save authentication token
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

// Get authentication token
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    const user = getCurrentUser();
    const token = getToken();
    return !!(user && token);
  }
  return false;
};

// Check if the user is a tutor
export const isTutor = () => {
  const user = getCurrentUser();
  return user?.userType === 'tutor';
};

// Check if the user is a student
export const isStudent = () => {
  const user = getCurrentUser();
  return user?.userType === 'student';
}; 