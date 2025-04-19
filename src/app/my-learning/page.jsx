'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiBook, FiClock, FiVideo, FiUser } from 'react-icons/fi';
import { API_URL } from '@/lib/utils/constants';
import { isAuthenticated, getCurrentUser, isStudent } from '@/lib/utils/auth';
import CourseCard from '@/components/courses/CourseCard';

export default function MyLearningPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return false;
      }
      
      if (!isStudent()) {
        router.push('/dashboard');
        return false;
      }
      
      return true;
    };
    
    const hasAuth = checkAuth();
    if (!hasAuth) return;
    
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser();
        
        const response = await fetch(`${API_URL}/api/enrollments/student/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch enrollments');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setEnrollments(data.enrollments || []);
        } else {
          throw new Error(data.message || 'Failed to fetch enrollments');
        }
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        setError(error.message || 'Failed to load your courses');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnrollments();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">My Learning</h1>
          <p className="mt-4 text-lg text-gray-600">
            Continue learning your enrolled courses
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <FiBook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-4">
              You haven't enrolled in any courses yet.
            </p>
            <Link href="/courses" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              You are enrolled in {enrollments.length} {enrollments.length === 1 ? 'course' : 'courses'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <CourseCard key={enrollment.id} course={enrollment.course || enrollment} type="enrolled" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 