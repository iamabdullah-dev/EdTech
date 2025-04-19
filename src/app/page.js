'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiBookOpen, FiUsers, FiVideo, FiAward, FiArrowRight } from 'react-icons/fi';
import { coursesAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getAllCourses();
        // Get the first 4 courses for featuring on the homepage
        setFeaturedCourses(response.data.courses.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const features = [
    {
      icon: <FiBookOpen className="h-6 w-6" />,
      title: 'Diverse Course Catalog',
      description: 'Access a wide range of courses taught by experienced tutors in various subjects.'
    },
    {
      icon: <FiUsers className="h-6 w-6" />,
      title: 'Interactive Learning',
      description: 'Engage with tutors and fellow students through our interactive chat features.'
    },
    {
      icon: <FiVideo className="h-6 w-6" />,
      title: 'Video Lessons',
      description: 'Watch high-quality video lessons with transcripts and progress tracking.'
    },
    {
      icon: <FiAward className="h-6 w-6" />,
      title: 'Certificates',
      description: 'Earn certificates upon course completion to showcase your skills.'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Learn Without Limits
            </h1>
            <p className="mt-6 text-xl">
              Join our modern learning platform to gain new skills, advance your career, and connect with expert tutors.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                Explore Courses
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose EdTech?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our platform offers everything you need for an effective learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Courses
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Explore our most popular courses and start learning today.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <FiBookOpen className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-medium">${course.price}</span>
                      <span className="text-gray-500 text-sm">{course.students_enrolled} students</span>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      View Course <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No courses available yet. Check back soon!</p>
              <Link
                href="/auth/register?role=tutor"
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                Become a tutor and create courses <FiArrowRight className="ml-1" />
              </Link>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to start learning?
          </h2>
          <p className="mt-4 text-xl">
            Join thousands of students who are already learning on our platform.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
            >
              Get Started Today
            </Link>
          </div>
    </div>
      </section>
    </>
  );
}
