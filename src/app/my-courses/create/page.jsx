'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, isTutor } from '@/lib/utils/auth';
import { API_URL } from '@/lib/utils/constants';
import PageHeader from '@/components/common/PageHeader';
import { FiUpload, FiImage } from 'react-icons/fi';

export default function CreateCourse() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    level: 'beginner',
    category: '',
    isPublished: false,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check if user is authenticated and is a tutor
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Redirect students to courses page
    if (currentUser && currentUser.userType !== 'tutor') {
      router.push('/courses');
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({ 
          ...prev, 
          thumbnail: 'Only image files (JPEG, PNG, GIF) are allowed' 
        }));
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ 
          ...prev, 
          thumbnail: 'File size should be less than 10MB' 
        }));
        return;
      }
      
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
      
      // Clear error
      if (errors.thumbnail) {
        setErrors((prev) => ({ ...prev, thumbnail: '' }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      
      // Create FormData object for file upload
      const courseFormData = new FormData();
      courseFormData.append('title', formData.title);
      courseFormData.append('description', formData.description);
      courseFormData.append('price', formData.price);
      courseFormData.append('tutorId', user.id);
      courseFormData.append('isPublished', formData.isPublished);
      
      // Optional fields
      if (formData.level) {
        courseFormData.append('level', formData.level);
      }
      
      if (formData.category) {
        courseFormData.append('category', formData.category);
      }
      
      // Add thumbnail if available
      if (thumbnail) {
        courseFormData.append('thumbnail', thumbnail);
        console.log('Appending thumbnail to form data:', thumbnail.name, thumbnail.type, thumbnail.size);
      }
      
      console.log('Sending course creation request with data:', {
        title: formData.title,
        tutorId: user.id,
        hasThumbnail: !!thumbnail,
      });
      
      const response = await fetch(`${API_URL}/api/courses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          // Do NOT set Content-Type here, it will be set automatically with the boundary
        },
        body: courseFormData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course');
      }
      
      const data = await response.json();
      console.log('Course created successfully:', data);
      
      // Redirect to course management or newly created course
      router.push('/my-courses');
    } catch (error) {
      console.error('Error creating course:', error);
      setErrors((prev) => ({ ...prev, form: error.message || 'Failed to create course. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Create New Course" 
        description="Fill in the details to create a new course"
      />
      
      {errors.form && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.form}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Course Title*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            ></textarea>
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Thumbnail
            </label>
            <div 
              className={`border-2 border-dashed ${errors.thumbnail ? 'border-red-300' : 'border-gray-300'} rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              {thumbnailPreview ? (
                <div className="relative">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    className="mx-auto h-48 object-cover rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnail(null);
                      setThumbnailPreview('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="py-8">
                  <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2 flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        name="thumbnail"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleThumbnailChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
            {errors.thumbnail && <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)*
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
            
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Programming, Design, Business"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="isPublished"
                name="isPublished"
                type="checkbox"
                checked={formData.isPublished}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                Publish course immediately (if unchecked, course will be saved as draft)
              </label>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 