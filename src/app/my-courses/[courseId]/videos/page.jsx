'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated, isTutor, getCurrentUser } from '@/lib/utils/auth';
import { API_URL } from '@/lib/utils/constants';
import PageHeader from '@/components/common/PageHeader';
import { FiUpload, FiLink, FiVideo, FiTrash, FiEdit, FiPlay, FiPlus } from 'react-icons/fi';

export default function CourseVideos() {
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef(null);
  
  // Form states
  const [videoType, setVideoType] = useState('link'); // 'link' or 'upload'
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    url: '',
    duration: 0,
    sequence_order: 1,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [errors, setErrors] = useState({});

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
    const fetchCourseAndVideos = async () => {
      if (!user || !params.courseId) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await fetch(`${API_URL}/api/courses/${params.courseId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.course || courseData);
        
        // Fetch course videos
        const videosResponse = await fetch(`${API_URL}/api/courses/${params.courseId}/videos`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!videosResponse.ok) {
          throw new Error('Failed to fetch videos');
        }

        const videosData = await videosResponse.json();
        const videosList = Array.isArray(videosData) ? videosData : (videosData.videos || []);
        setVideos(videosList);
        
        // Set next sequence order
        if (videosList.length > 0) {
          const maxOrder = Math.max(...videosList.map(v => v.sequence_order || 0));
          setVideoFormData(prev => ({
            ...prev,
            sequence_order: maxOrder + 1
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndVideos();
  }, [user, params.courseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVideoFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          file: 'Only video files (MP4, WebM, OGG) are allowed'
        }));
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          file: 'File size should be less than 100MB'
        }));
        return;
      }
      
      setVideoFile(file);
      
      // Clear error
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!videoFormData.title) {
      newErrors.title = 'Title is required';
    }
    
    if (videoType === 'link' && !videoFormData.url) {
      newErrors.url = 'Video URL is required';
    } else if (videoType === 'link' && !isValidVideoUrl(videoFormData.url)) {
      newErrors.url = 'Please enter a valid YouTube or Vimeo URL';
    }
    
    if (videoType === 'upload' && !videoFile) {
      newErrors.file = 'Please select a video file to upload';
    }
    
    if (!videoFormData.duration || videoFormData.duration <= 0) {
      newErrors.duration = 'Please enter a valid duration in seconds';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidVideoUrl = (url) => {
    // Check for YouTube URLs
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      // YouTube URLs should contain a video ID
      const videoId = url.includes('youtube.com/watch') 
        ? url.split('v=')[1]?.split('&')[0] 
        : url.split('youtu.be/')[1]?.split('?')[0];
      
      return !!videoId && videoId.length > 0;
    }
    
    // Check for Vimeo URLs
    if (url.includes('vimeo.com/')) {
      // Vimeo URLs should contain a numeric ID
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0];
      return !!videoId && /^\d+$/.test(videoId);
    }
    
    // For other video platforms, just check if it looks like a URL
    return url.startsWith('http') || url.startsWith('https');
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setVideoLoading(true);
      
      // Prepare form data for API
      const formData = new FormData();
      formData.append('title', videoFormData.title);
      formData.append('description', videoFormData.description || '');
      formData.append('sequence_order', videoFormData.sequence_order);
      formData.append('duration', videoFormData.duration);
      
      // Add the tutorId from the logged-in user
      const currentUser = getCurrentUser();
      formData.append('tutorId', currentUser?.id);
      
      if (videoType === 'link') {
        formData.append('url', videoFormData.url);
        formData.append('type', 'external');
      } else {
        formData.append('video', videoFile);
        formData.append('type', 'uploaded');
      }
      
      const response = await fetch(`${API_URL}/api/courses/${params.courseId}/videos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          // Content-Type will be set automatically with boundary for FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add video');
      }
      
      const data = await response.json();
      
      // Add the new video to the videos list
      const newVideo = data.video;
      setVideos(prev => [...prev, newVideo]);
      
      // Select the newly added video to display it
      setSelectedVideo(newVideo);
      
      // Reset form
      setVideoFormData({
        title: '',
        description: '',
        url: '',
        duration: 0,
        sequence_order: videoFormData.sequence_order + 1,
      });
      setVideoFile(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Error adding video:', err);
      setErrors(prev => ({ ...prev, form: err.message || 'Failed to add video. Please try again.' }));
    } finally {
      setVideoLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }
    
    try {
      // Get the current user for tutorId
      const currentUser = getCurrentUser();
      
      const response = await fetch(`${API_URL}/api/courses/${params.courseId}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tutorId: currentUser?.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete video');
      }
      
      // Remove video from state
      setVideos(prev => prev.filter(v => v.id !== videoId));
      if (selectedVideo && selectedVideo.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video: ' + err.message);
    }
  };

  const handleAddNewVideo = () => {
    setSelectedVideo(null);
    setIsEditing(true);
    setVideoFormData({
      title: '',
      description: '',
      url: '',
      duration: 0,
      sequence_order: videos.length > 0 
        ? Math.max(...videos.map(v => v.sequence_order || 0)) + 1 
        : 1,
    });
    setVideoFile(null);
  };

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
    setIsEditing(false);
  };

  const handleEditVideo = (video) => {
    setSelectedVideo(video);
    setIsEditing(true);
    setVideoFormData({
      title: video.title,
      description: video.description || '',
      url: video.url || '',
      duration: video.duration || 0,
      sequence_order: video.sequence_order || 1,
    });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setVideoLoading(true);
      
      // Prepare form data for API
      const formData = new FormData();
      formData.append('title', videoFormData.title);
      formData.append('description', videoFormData.description || '');
      formData.append('sequence_order', videoFormData.sequence_order);
      formData.append('duration', videoFormData.duration);
      
      // Add the tutorId from the logged-in user
      const currentUser = getCurrentUser();
      formData.append('tutorId', currentUser?.id);
      
      if (videoType === 'link') {
        formData.append('url', videoFormData.url);
        formData.append('type', 'external');
      } else if (videoFile) {
        formData.append('video', videoFile);
        formData.append('type', 'uploaded');
      }
      
      const response = await fetch(`${API_URL}/api/courses/${params.courseId}/videos/${selectedVideo.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update video');
      }
      
      const data = await response.json();
      
      // Update videos list
      setVideos(prev => prev.map(v => 
        v.id === selectedVideo.id ? data.video : v
      ));
      
      setSelectedVideo(data.video);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating video:', err);
      setErrors(prev => ({ ...prev, form: err.message || 'Failed to update video. Please try again.' }));
    } finally {
      setVideoLoading(false);
    }
  };

  const getEmbedUrl = (url) => {
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.split('v=')[1] || url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Welcome back, {user?.name || 'Databot'}</h1>
        <h2 className="text-xl font-bold mt-4">{course?.title || 'Course Videos'}</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar: Video List */}
        <div className="w-full md:w-1/4">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium">Videos</h3>
              <button 
                onClick={handleAddNewVideo}
                className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                aria-label="Add new video"
              >
                <FiPlus />
              </button>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
              {videos
                .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
                .map(video => (
                  <li 
                    key={video.id || video._id} 
                    className={`cursor-pointer hover:bg-gray-50 ${selectedVideo && (video.id === selectedVideo.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-900">
                        Video {video.sequence_order}: {video.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </li>
                ))}
                
              {videos.length === 0 && (
                <li className="p-4 text-center text-gray-500">
                  No videos yet
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-full md:w-3/4">
          {/* Video Preview Area */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="aspect-video bg-gray-200 relative">
              {selectedVideo && selectedVideo.video_url ? (
                <iframe 
                  src={getEmbedUrl(selectedVideo.video_url)} 
                  className="w-full h-full" 
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={selectedVideo.title}
                ></iframe>
              ) : selectedVideo && selectedVideo.url ? (
                <iframe 
                  src={getEmbedUrl(selectedVideo.url)} 
                  className="w-full h-full" 
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={selectedVideo.title}
                ></iframe>
              ) : (
                <div className="text-center text-gray-500 absolute inset-0 flex items-center justify-center">
                  <div>
                    <FiVideo className="mx-auto h-12 w-12" />
                    <p className="mt-2">
                      {selectedVideo ? 'No preview available' : 'Select a video to preview'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {selectedVideo && (
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="mt-2 text-gray-600">{selectedVideo.description}</p>
                )}
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="flex items-center mr-4">
                    <FiPlay className="mr-1" /> 
                    {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="flex items-center">
                    Video #{selectedVideo.sequence_order}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-white shadow rounded-lg p-6">
            {errors.form && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errors.form}
              </div>
            )}
            
            <form onSubmit={isEditing && selectedVideo ? handleSaveChanges : handleAddVideo}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={videoFormData.title}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEditing ? 'bg-gray-100' : ''}`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={videoFormData.description}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEditing ? 'bg-gray-100' : ''}`}
                ></textarea>
              </div>
              
              {isEditing && (
                <>
                  <div className="mb-4">
                    <div className="flex border-b border-gray-200 mb-4">
                      <button
                        type="button"
                        className={`pb-2 px-4 ${videoType === 'link' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                        onClick={() => setVideoType('link')}
                      >
                        <FiLink className="inline mr-1" /> Video Link
                      </button>
                      <button
                        type="button"
                        className={`pb-2 px-4 ${videoType === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                        onClick={() => setVideoType('upload')}
                      >
                        <FiUpload className="inline mr-1" /> Upload Video
                      </button>
                    </div>
                    
                    {videoType === 'link' ? (
                      <div className="mb-4">
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                          Video URL* (YouTube or Vimeo)
                        </label>
                        <input
                          type="text"
                          id="url"
                          name="url"
                          value={videoFormData.url}
                          onChange={handleInputChange}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className={`w-full px-3 py-2 border ${errors.url ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Video File*
                        </label>
                        <div 
                          className={`border-2 border-dashed ${errors.file ? 'border-red-300' : 'border-gray-300'} rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {videoFile ? (
                            <div className="text-left">
                              <p className="font-medium">{videoFile.name}</p>
                              <p className="text-sm text-gray-500">
                                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div className="py-4">
                              <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                              <div className="mt-2 flex text-sm text-gray-600 justify-center">
                                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                                  <span>Upload a video file</span>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="video"
                                    accept="video/mp4,video/webm,video/ogg"
                                    onChange={handleVideoFileChange}
                                    className="sr-only"
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">MP4, WebM, OGG up to 100MB</p>
                            </div>
                          )}
                        </div>
                        {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (in seconds)*
                        </label>
                        <input
                          type="number"
                          id="duration"
                          name="duration"
                          min="1"
                          value={videoFormData.duration}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          For example: 10 minutes = 600 seconds
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="sequence_order" className="block text-sm font-medium text-gray-700 mb-1">
                          Sequence Order
                        </label>
                        <input
                          type="number"
                          id="sequence_order"
                          name="sequence_order"
                          min="1"
                          value={videoFormData.sequence_order}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-end mt-6">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedVideo) {
                          setIsEditing(false);
                        } else {
                          setIsEditing(false);
                          setSelectedVideo(null);
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={videoLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {videoLoading ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : selectedVideo && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(selectedVideo.id)}
                      className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 mr-2"
                    >
                      <FiTrash className="inline mr-1" /> Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditVideo(selectedVideo)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FiEdit className="inline mr-1" /> Edit
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 