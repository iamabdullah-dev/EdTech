import Link from 'next/link';
import { FiBookOpen, FiUsers, FiClock, FiArrowRight } from 'react-icons/fi';
import { API_URL } from '@/lib/utils/constants';

const CourseCard = ({ course }) => {
  // Handle both id and _id formats from different APIs
  const courseId = course._id || course.id;

  // Handle thumbnail URL
  let thumbnailSrc = course.thumbnail || course.thumbnail_url;
  
  // If the thumbnail is a relative path, prepend API_URL
  if (thumbnailSrc && !thumbnailSrc.startsWith('http') && !thumbnailSrc.startsWith('data:')) {
    if (!thumbnailSrc.startsWith('/')) {
      thumbnailSrc = '/' + thumbnailSrc;
    }
    thumbnailSrc = `${API_URL}${thumbnailSrc}`;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Course thumbnail */}
      <div className="h-48 bg-gray-200 relative">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://img.freepik.com/free-vector/online-certification-illustration_23-2148575636.jpg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
            <FiBookOpen className="h-12 w-12" />
          </div>
        )}
        {(!course.price || course.price === '0.00' || parseFloat(course.price) === 0) ? (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
            FREE
          </div>
        ) : (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            ${parseFloat(course.price).toFixed(2)}
          </div>
        )}
      </div>
      
      {/* Course content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{course.tutor_name}</span>
          <div className="flex items-center text-xs text-gray-500">
            <FiUsers className="mr-1" /> {course.students_enrolled || course.enrollment_count || 0}
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2 h-14">
          {course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
          {course.description}
        </p>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-500">
            <FiClock className="mr-1" /> 
            {course.formattedDuration || `${course.totalHours || 0}h ${course.totalMinutes || 0}m`}
          </div>
          
          <Link
            href={`/courses/${courseId}`}
            className="text-blue-600 font-medium hover:text-blue-800 flex items-center"
          >
            View Details <FiArrowRight className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard; 