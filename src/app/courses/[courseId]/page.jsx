'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCheck, FiClock, FiUser, FiVideo, FiCalendar, FiDollarSign, FiBookOpen } from 'react-icons/fi';
import { API_URL } from '@/lib/utils/constants';
import { isAuthenticated, getCurrentUser, isStudent } from '@/lib/utils/auth';
import PaymentModal from '@/components/payment/PaymentModal';
import toast from 'react-hot-toast';

export default function CourseDetailPage({ params }) {
  // Unwrap the params which are now a Promise in Next.js 15.3.1+
  const unwrappedParams = use(params);
  const { courseId } = unwrappedParams;
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setUser(getCurrentUser());
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/courses/${courseId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch course details');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCourse(data.course);
          
          // Check if user is enrolled in this course
          if (user && user.id) {
            checkEnrollmentStatus(user.id, data.course.id);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch course details');
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        setError(error.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, user]);
  
  const checkEnrollmentStatus = async (userId, courseId) => {
    try {
      const response = await fetch(`${API_URL}/api/enrollments/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: userId,
          courseId: courseId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsEnrolled(data.isEnrolled);
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    }
  };
  
  const handleEnrollClick = () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    
    if (!isStudent()) {
      setError('Only students can enroll in courses');
      return;
    }
    
    // For free courses, enroll directly
    if (course.price === 0 || course.price === "0.00" || parseFloat(course.price) === 0) {
      handleEnroll();
    } else {
      // For paid courses, show payment modal
      setShowPaymentModal(true);
    }
  };
  
  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      
      const currentUser = getCurrentUser();
      
      const response = await fetch(`${API_URL}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: currentUser.id,
          courseId: course.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsEnrolled(true);
        toast.success(`Successfully enrolled in ${course.title}`);
        router.push(`/my-learning/${course.id}`);
      } else {
        throw new Error(data.message || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError(error.message || 'Failed to enroll in course');
      toast.error('Failed to enroll in course');
    } finally {
      setEnrolling(false);
      setShowPaymentModal(false);
    }
  };
  
  const handlePaymentComplete = () => {
    // Payment was completed, redirect to course content page
    setIsEnrolled(true);
    setShowPaymentModal(false);
    router.push(`/my-learning/${course.id}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/courses" className="text-blue-600 hover:text-blue-800 font-medium">
            Back to All Courses
          </Link>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The requested course could not be found.</p>
          <Link href="/courses" className="text-blue-600 hover:text-blue-800 font-medium">
            Back to All Courses
          </Link>
        </div>
      </div>
    );
  }
  
  // Format thumbnail URL
  let thumbnailUrl = course.thumbnail || course.thumbnail_url;
  if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('data:')) {
    if (!thumbnailUrl.startsWith('/')) {
      thumbnailUrl = '/' + thumbnailUrl;
    }
    thumbnailUrl = `${API_URL}${thumbnailUrl}`;
  }
  
  const handleViewContent = () => {
    // Skip enrollment check and directly view content
    if (course && course.id) {
      router.push(`/my-learning/${course.id}`);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={course}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation link */}
        <Link href="/courses" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6">
          <FiArrowLeft className="mr-2" /> Back to Courses
        </Link>
        
        {/* Course header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative h-64 md:h-80 bg-gray-200">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://img.freepik.com/free-vector/online-certification-illustration_23-2148575636.jpg";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                <FiBookOpen className="h-24 w-24" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/70 to-transparent">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                {course.title}
              </h1>
              <div className="flex flex-wrap items-center text-white text-sm gap-4">
                <div className="flex items-center">
                  <FiUser className="mr-1" /> {course.tutor_name || "Instructor"}
                </div>
                <div className="flex items-center">
                  <FiVideo className="mr-1" /> {course.videos ? course.videos.length : 0} Videos
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-1" /> {course.formattedDuration || `${course.totalHours || 0}h ${course.totalMinutes || 0}m`}
                </div>
                <div className="flex items-center">
                  <FiCalendar className="mr-1" /> Updated {new Date(course.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 md:flex gap-8">
            <div className="md:w-2/3">
              {/* Course description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">About This Course</h2>
                <div className="prose max-w-none text-gray-600">
                  <p>{course.description}</p>
                </div>
              </div>
              
              {/* Video list preview - Display all videos instead of just 3 */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Course Content</h2>
                {course.videos && course.videos.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{course.videos.length} videos</span>
                        <span>{course.formattedDuration || `${course.totalHours || 0}h ${course.totalMinutes || 0}m`} total length</span>
                      </div>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {course.videos.map((video, index) => (
                        <li key={video.id} className="p-4 flex items-center">
                          <div className="mr-4 text-gray-400 font-medium">{index + 1}</div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{video.title}</h3>
                            <p className="text-sm text-gray-500">{video.description}</p>
                          </div>
                          <div className="ml-4 text-sm text-gray-500">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-500 text-center">
                    No videos available in this course yet
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-1/3 mt-8 md:mt-0">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-8">
                <div className="text-center mb-6">
                  {course.price === 0 || course.price === "0.00" ? (
                    <div className="text-3xl font-bold text-green-600">Free</div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-800">${parseFloat(course.price).toFixed(2)}</div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-700">
                      <FiCheck className="text-green-500 mr-2" /> Full lifetime access
                    </li>
                    <li className="flex items-center text-gray-700">
                      <FiCheck className="text-green-500 mr-2" /> {course.videos ? course.videos.length : 0} videos
                    </li>
                    <li className="flex items-center text-gray-700">
                      <FiCheck className="text-green-500 mr-2" /> Learn at your own pace
                    </li>
                  </ul>
                  
                  {/* Direct View Content Button */}
                  <button
                    onClick={handleViewContent}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center"
                  >
                    <FiVideo className="mr-2" /> View Course Content
                  </button>
                
                  {error && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Full Video Player Section */}
          {course.videos && course.videos.length > 0 && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Watch Preview</h2>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {course.videos[0] && (course.videos[0].video_url || course.videos[0].url) ? (
                  <iframe 
                    src={getEmbedUrl(course.videos[0].video_url || course.videos[0].url)} 
                    className="w-full h-full" 
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={course.videos[0].title}
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <FiVideo className="h-12 w-12 mx-auto mb-2" />
                      <p>No preview available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to convert video URLs to embed format
const getEmbedUrl = (url) => {
  if (!url) return '';
  
  // Convert YouTube URLs to embed format
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Convert Vimeo URLs to embed format
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('/').pop();
    return `https://player.vimeo.com/video/${videoId}`;
  }
  
  return url;
}; 