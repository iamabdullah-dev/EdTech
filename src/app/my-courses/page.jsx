'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isTutor, getCurrentUser } from '@/lib/utils/auth';
import CourseCard from '@/components/courses/CourseCard';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { API_URL } from '@/lib/utils/constants';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserAuth = () => {
      if (!isAuthenticated() || !isTutor()) {
        router.push('/auth/login');
        return;
      }
      setUser(getCurrentUser());
    };

    checkUserAuth();
  }, [router]);

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Get the correct ID field from the user object
        const tutorId = user.id || user._id || user.userId;
        
        // Log user object for debugging
        console.log('Current user:', user);
        console.log('Using tutor ID:', tutorId);
        
        const response = await fetch(`${API_URL}/api/courses/tutor/${tutorId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        
        // Handle both response formats (direct array or nested in 'courses' property)
        let coursesData = Array.isArray(data) ? data : data.courses;
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        
        // Log courses for debugging
        console.log('Fetched courses:', coursesData);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [user]);

  // Add a function to create a new course directly from this page
  const handleCreateCourse = () => {
    router.push('/my-courses/create');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <PageHeader 
          title="My Courses"
          description={user ? `All courses created by ${user.fullName || user.firstName + ' ' + user.lastName}` : "Your created courses"}
        />
        <button
          onClick={handleCreateCourse}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Course
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <EmptyState 
          message="You haven't created any courses yet"
          actionText="Create New Course"
          actionLink="/my-courses/create"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {courses.map((course, index) => (
            <CourseCard key={course.id || course._id || index} course={course} />
          ))}
        </div>
      )}
    </div>
  );
} 