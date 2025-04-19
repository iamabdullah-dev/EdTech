import React from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/utils/constants';

const CourseCard = ({ course, type = 'regular' }) => {
  // Handle both id and _id formats from different APIs
  const courseId = course._id || course.id;
  
  const {
    title,
    description,
    thumbnail,
    thumbnail_url, // Backend uses snake_case
    instructor,
    price,
    duration,
    level,
    enrollmentCount,
    enrollment_count, // Backend uses snake_case
    students_enrolled, // Another possible field name
    video_count, // Number of videos in course
    total_watch_time, // Total watch time in seconds
    totalHours,
    totalMinutes,
    formattedDuration,
    rating
  } = course;

  // Handle different thumbnail field names and construct proper URL
  let thumbnailSrc = thumbnail || thumbnail_url;
  
  // If the thumbnail is a relative path, prepend API_URL
  if (thumbnailSrc && !thumbnailSrc.startsWith('http') && !thumbnailSrc.startsWith('data:')) {
    thumbnailSrc = `${API_URL}${thumbnailSrc}`;
  }
  
  // Use a default image if no thumbnail is available
  if (!thumbnailSrc) {
    thumbnailSrc = 'https://img.freepik.com/free-vector/online-certification-illustration_23-2148575636.jpg';
  }
  
  // Handle different enrollment count field names
  const studentCount = enrollmentCount || enrollment_count || students_enrolled || 0;
  
  // Format price correctly
  const formattedPrice = typeof price === 'number' && price > 0 
    ? `$${parseFloat(price).toFixed(2)}` 
    : (typeof price === 'string' && parseFloat(price) > 0 
      ? `$${parseFloat(price).toFixed(2)}` 
      : 'Free');
  
  // Display course duration with appropriate fallbacks
  let displayHours = '';
  let displayUnit = '';
  
  if (totalHours !== undefined && totalMinutes !== undefined) {
    // If we have the computed hours/minutes from the backend
    if (totalHours > 0) {
      displayHours = totalHours;
      displayUnit = 'hours';
    } else if (totalMinutes > 0) {
      displayHours = totalMinutes;
      displayUnit = 'mins';
    } else {
      displayHours = '0';
      displayUnit = 'mins';
    }
  } else if (formattedDuration) {
    // If we have the formatted duration
    displayHours = formattedDuration.split('h')[0].trim();
    displayUnit = 'hours';
  } else if (duration) {
    // If we have some other duration format
    if (duration.includes('h')) {
      displayHours = duration.split('h')[0].trim();
      displayUnit = 'hours';
    } else {
      displayHours = duration;
      displayUnit = 'mins';
    }
  } else {
    // No duration info available
    displayHours = video_count ? video_count : '0';
    displayUnit = video_count === 1 ? 'video' : 'videos';
  }

  // Create default sample text if description is empty
  const sampleText = "This is a sample line bla bla bla bla ... more";

  // Determine the appropriate link based on the type of card
  let linkHref = '';
  if (type === 'tutor') {
    // For tutor's created courses
    linkHref = `/my-courses/${courseId}/videos`;
  } else if (type === 'enrolled') {
    // For student's enrolled courses
    linkHref = `/my-learning/${courseId}`;
  } else {
    // For regular course browsing
    linkHref = `/courses/${courseId}`;
  }

  return (
    <Link href={linkHref}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105 cursor-pointer">
        {/* Card Image Section */}
        <div className="relative w-full aspect-[4/3] bg-white">
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={title || "Course"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://img.freepik.com/free-vector/online-certification-illustration_23-2148575636.jpg";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <img 
                src="https://img.freepik.com/free-vector/online-certification-illustration_23-2148575636.jpg"
                alt="Default course"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Course Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <div className="font-bold text-lg text-white">{title}</div>
          </div>
          
          {/* Price Tag */}
          <div className="absolute bottom-3 right-3 bg-green-600 text-white px-3 py-1 rounded font-semibold">
            {formattedPrice}
          </div>
        </div>
        
        {/* Card Footer */}
        <div className="p-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 line-clamp-2">
            {description || sampleText}
          </p>
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center">
              <span className="text-gray-700 font-medium mr-1">{studentCount.toLocaleString()}</span>
              <span className="text-xs text-gray-500">enrolled</span>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-700 font-medium mr-1">{displayHours}</span>
              <span className="text-xs text-gray-500">{displayUnit}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard; 