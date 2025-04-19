'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { isAuthenticated, getCurrentUser, clearUserData, isTutor, isStudent } from '@/lib/utils/auth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Move ALL localStorage access into the effect
    const checkAuth = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setUserType(currentUser.userType);
      }
    };
    
    checkAuth();
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    clearUserData();
    setUser(null);
    setUserType(null);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">🏉 EdTech</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {/* Always render all links but conditionally set visibility */}
              <Link 
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 ${userType === 'tutor' ? 'hidden' : ''}`} 
                href="/courses"
              >
                Courses
              </Link>
              
              <Link 
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 ${userType === 'student' ? '' : 'hidden'}`}
                href="/my-learning"
              >
                My Learning
              </Link>
              
              <Link 
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 ${userType === 'tutor' ? '' : 'hidden'}`}
                href="/my-courses"
              >
                My Courses
              </Link>
              
              <Link 
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 ${userType === 'tutor' ? '' : 'hidden'}`}
                href="/stats"
              >
                Stats
              </Link>
            </div>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center">
            {user ? (
              <div className="ml-3 relative flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">{user.fullName || user.full_name || user.name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiLogOut className="mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" href="/auth/login">
                  Login
                </Link>
                <Link className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" href="/auth/register">
                  Register
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <FiX className="block h-6 w-6" /> : <FiMenu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {/* Mobile menu links with the same conditional approach */}
            <Link 
              className={`block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 ${userType === 'tutor' ? 'hidden' : ''}`}
              href="/courses"
            >
              Courses
            </Link>
            
            <Link 
              className={`block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 ${userType === 'student' ? '' : 'hidden'}`}
              href="/my-learning"
            >
              My Learning
            </Link>
            
            <Link 
              className={`block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 ${userType === 'tutor' ? '' : 'hidden'}`}
              href="/my-courses"
            >
              My Courses
            </Link>
            
            <Link 
              className={`block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 ${userType === 'tutor' ? '' : 'hidden'}`}
              href="/stats"
            >
              Stats
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <FiUser className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.fullName || user.full_name || user.name || user.email}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 px-4">
                <Link className="block text-center py-2 px-4 text-base font-medium text-blue-600 hover:bg-gray-100 rounded-md" href="/auth/login">
                  Login
                </Link>
                <Link className="block text-center py-2 px-4 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md" href="/auth/register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 