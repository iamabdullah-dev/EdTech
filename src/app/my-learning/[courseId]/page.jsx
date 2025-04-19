'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlay, FiClock, FiVideo, FiUsers, FiUser, FiSend, FiX, FiFileText, FiLoader } from 'react-icons/fi';
import { API_URL } from '@/lib/utils/constants';
import { isAuthenticated, getCurrentUser } from '@/lib/utils/auth';
import toast from 'react-hot-toast';

export default function CourseContent({ params }) {
  // Unwrap the params which are now a Promise in Next.js 15.3.1+
  const unwrappedParams = use(params);
  const { courseId } = unwrappedParams;
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  
  // Transcript state
  const [transcript, setTranscript] = useState([]);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatType, setChatType] = useState('group'); // 'group' or 'tutor'
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'John Doe', text: 'This course is great!', time: '5 mins ago', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, user: 'Sarah Wilson', text: 'Does anyone understand the concept at 2:30?', time: '10 mins ago', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 3, user: 'Tutor Mike', text: 'Hi everyone! Feel free to ask questions about the course here.', time: '15 mins ago', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', isTutor: true },
  ]);
  const [tutorChatMessages, setTutorChatMessages] = useState([
    { id: 1, user: 'Tutor Mike', text: 'Hello! How can I help you with this course?', time: '1 hour ago', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', isTutor: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  const transcriptRef = useRef(null);
  const currentUser = getCurrentUser() || { 
    id: 'guest123',
    full_name: 'Guest User',
    profile_image: 'https://randomuser.me/api/portraits/lego/1.jpg'
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Get course details directly - skip enrollment check
        const courseResponse = await fetch(`${API_URL}/api/courses/${courseId}`);
        
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course');
        }
        
        const courseData = await courseResponse.json();
        
        if (!courseData.success) {
          throw new Error(courseData.message || 'Failed to fetch course');
        }
        
        setCourse(courseData.course);
        
        // Set videos from course data
        if (courseData.course.videos && courseData.course.videos.length > 0) {
          setVideos(courseData.course.videos);
          setSelectedVideo(courseData.course.videos[0]);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError(error.message || 'Failed to load course content');
        toast.error('Error loading course content');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  // Auto-scroll chat to bottom when new messages are added
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, tutorChatMessages, showChat, chatType]);
  
  // Auto-scroll transcript to bottom when new entries are added
  useEffect(() => {
    if (showTranscript && transcriptRef.current && transcript.length > 0) {
      transcriptRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, showTranscript]);
  
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    // Reset transcript when selecting a new video
    setTranscript([]);
    setIsGeneratingTranscript(false);
    setShowTranscript(false);
    
    // Scroll to video player on mobile
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const getEmbedUrl = (url) => {
    // Convert YouTube URLs to embed format
    if (url && url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed format
    if (url && url.includes('vimeo.com/')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Add new message to chat
    const newChatMessage = {
      id: Date.now(),
      user: currentUser.full_name,
      text: newMessage,
      time: 'Just now',
      avatar: currentUser.profile_image || 'https://randomuser.me/api/portraits/lego/1.jpg'
    };
    
    if (chatType === 'group') {
      setChatMessages(prev => [...prev, newChatMessage]);
    } else {
      setTutorChatMessages(prev => [...prev, newChatMessage]);
      
      // Simulate tutor response in private chat after a delay
      setTimeout(() => {
        const tutorResponse = {
          id: Date.now() + 1,
          user: 'Tutor Mike',
          text: 'Thanks for your message! I\'ll get back to you as soon as possible.',
          time: 'Just now',
          avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
          isTutor: true
        };
        setTutorChatMessages(prev => [...prev, tutorResponse]);
      }, 1500);
    }
    
    setNewMessage('');
  };

  const toggleChatType = (type) => {
    setChatType(type);
  };
  
  // Add YouTube API script
  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    // Handle YouTube API ready event
    window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
    
    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);
  
  // Initialize YouTube player when API is ready and video changes
  useEffect(() => {
    if (selectedVideo && window.YT) {
      initializeYouTubePlayer();
    }
  }, [selectedVideo]);
  
  const initializeYouTubePlayer = () => {
    if (!selectedVideo || !window.YT || !window.YT.Player) return;
    
    // Get video element
    const videoIframe = document.querySelector('iframe');
    if (!videoIframe) return;
    
    // Get video ID
    let videoId = '';
    const videoUrl = selectedVideo.video_url || selectedVideo.url;
    
    if (videoUrl && videoUrl.includes('youtube.com/watch')) {
      try {
        videoId = new URL(videoUrl).searchParams.get('v');
      } catch (error) {
        console.error("Error parsing YouTube URL:", error);
        return;
      }
    } else {
      return; // Not a YouTube video
    }
    
    try {
      // Create new player
      const player = new window.YT.Player(videoIframe, {
        videoId: videoId,
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    } catch (error) {
      console.error("Error initializing YouTube player:", error);
    }
  };
  
  const onPlayerStateChange = (event) => {
    // State 1 means the video is playing
    if (event.data === 1) {
      // Auto-generate transcript when video starts playing
      if (transcript.length === 0 && !isGeneratingTranscript) {
        handleGenerateTranscript();
      }
    }
  };
  
  const handleGenerateTranscript = () => {
    if (isGeneratingTranscript || !selectedVideo) return;
    
    setIsGeneratingTranscript(true);
    setShowTranscript(true);
    setTranscript([]); // Clear existing transcript
    
    // Simulate transcript generation with predefined text for demo
    const demoTranscriptSegments = [
      { time: '0:00', text: 'Hello everyone, welcome to this lesson.' },
      { time: '0:05', text: 'Today we\'re going to cover the core concepts of this topic.' },
      { time: '0:12', text: 'Let\'s start by understanding the fundamental principles.' },
      { time: '0:20', text: 'The first key point to remember is that everything builds upon these basics.' },
      { time: '0:28', text: 'As you can see in this diagram, there are several interconnected components.' },
      { time: '0:35', text: 'Each component serves a specific purpose in the overall system.' },
      { time: '0:45', text: 'Now, let\'s look at some practical examples of how this works.' },
      { time: '0:55', text: 'Here\'s a real-world scenario where these principles apply directly.' },
      { time: '1:05', text: 'Notice how the theory translates into practice in this case.' },
      { time: '1:15', text: 'This is especially important when working with complex systems.' },
      { time: '1:25', text: 'Let\'s now explore some common challenges you might encounter.' },
      { time: '1:35', text: 'The first challenge is understanding how to troubleshoot effectively.' },
      { time: '1:45', text: 'Remember that documentation is your best friend in these situations.' },
      { time: '1:55', text: 'Another key tip is to break down problems into smaller, manageable parts.' },
      { time: '2:05', text: 'This approach helps avoid feeling overwhelmed by complexity.' },
      { time: '2:15', text: 'Let\'s summarize what we\'ve learned so far in this lesson.' },
      { time: '2:25', text: 'We\'ve covered the fundamental concepts, practical applications, and troubleshooting techniques.' },
      { time: '2:35', text: 'In our next session, we\'ll build upon these ideas and explore more advanced topics.' },
      { time: '2:45', text: 'Thank you for your attention, and I encourage you to practice these concepts on your own.' },
      { time: '2:55', text: 'See you in the next lesson!' },
    ];
    
    // Add transcript entries with a delay to simulate real-time generation
    let index = 0;
    const intervalId = setInterval(() => {
      if (index < demoTranscriptSegments.length) {
        setTranscript(prev => [...prev, demoTranscriptSegments[index]]);
        index++;
      } else {
        clearInterval(intervalId);
        setIsGeneratingTranscript(false);
        toast.success('Transcript generation completed');
      }
    }, 500);
    
    // Cleanup interval if component unmounts
    return () => clearInterval(intervalId);
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
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/courses" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
          </Link>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Course Not Found</h2>
          <p className="text-gray-700 mb-4">The course you're looking for doesn't exist.</p>
          <Link href="/courses" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button and course title */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/courses" className="mr-4 text-gray-500 hover:text-gray-700">
                <FiArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{course.title}</h1>
            </div>
            <div className="flex space-x-2">
              <button 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                onClick={() => { setShowChat(!showChat); setChatType('group'); setShowTranscript(false); }}
              >
                <FiUsers className="mr-2 h-4 w-4" />
                Group Chat
              </button>
              <button 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                onClick={() => { setShowChat(true); setChatType('tutor'); setShowTranscript(false); }}
              >
                <FiUser className="mr-2 h-4 w-4" />
                Chat with Tutor
              </button>
              <button 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                onClick={() => { setShowTranscript(!showTranscript); setShowChat(false); }}
              >
                <FiFileText className="mr-2 h-4 w-4" />
                {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`${showChat || showTranscript ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : 'md:flex gap-6 space-y-6 md:space-y-0'}`}>
          {/* Video player */}
          <div className={`${showChat || showTranscript ? 'lg:col-span-2' : 'md:w-2/3'}`}>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-video bg-black relative">
                {selectedVideo ? (
                  <iframe 
                    src={getEmbedUrl(selectedVideo.video_url || selectedVideo.url)} 
                    className="w-full h-full" 
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={selectedVideo.title}
                    ref={videoRef}
                    id="video-player"
                  ></iframe>
                ) : (
                  <div className="text-center text-gray-500 absolute inset-0 flex items-center justify-center">
                    <div>
                      <FiVideo className="mx-auto h-12 w-12" />
                      <p className="mt-2">No videos available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedVideo && (
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedVideo.title}</h2>
                  <p className="mt-2 text-gray-700">{selectedVideo.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="flex items-center mr-4">
                        <FiClock className="mr-1" />
                        {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}
                      </div>
                      <div>
                        Video {selectedVideo.sequence_order} of {videos.length}
                      </div>
                    </div>
                    <button
                      className="inline-flex items-center px-3 py-1 text-sm border border-purple-300 rounded-md text-purple-600 bg-purple-50 hover:bg-purple-100"
                      onClick={handleGenerateTranscript}
                      disabled={isGeneratingTranscript}
                    >
                      <FiFileText className="mr-1 h-4 w-4" />
                      {isGeneratingTranscript ? 'Generating...' : 'Generate Transcript'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Transcript panel */}
          {showTranscript && (
            <div className="lg:col-span-1 order-last lg:order-none">
              <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">Video Transcript</h3>
                  <div className="flex items-center">
                    {!isGeneratingTranscript && transcript.length === 0 && (
                      <button
                        onClick={handleGenerateTranscript}
                        className="mr-2 text-purple-600 hover:text-purple-800"
                      >
                        <span className="flex items-center text-sm">
                          <FiFileText className="mr-1 h-4 w-4" /> Generate
                        </span>
                      </button>
                    )}
                    <button 
                      onClick={() => setShowTranscript(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Transcript content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isGeneratingTranscript && transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                      <p className="text-gray-600">Generating transcript...</p>
                    </div>
                  )}
                  
                  {transcript.length === 0 && !isGeneratingTranscript && (
                    <div className="flex flex-col items-center justify-center h-40">
                      <FiFileText className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-600">Play the video to generate transcript</p>
                    </div>
                  )}
                  
                  {transcript.map((entry, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start">
                        <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2 min-w-[40px] text-center">
                          {entry.time}
                        </span>
                        <p className="text-gray-700 text-sm flex-1">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isGeneratingTranscript && transcript.length > 0 && (
                    <div className="flex items-center justify-center py-2">
                      <FiLoader className="animate-spin h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-600">Generating transcript...</span>
                    </div>
                  )}
                  
                  <div ref={transcriptRef} />
                </div>
                
                {/* Transcript controls */}
                <div className="border-t border-gray-200 p-4">
                  {!isGeneratingTranscript && (
                    <div className="text-sm text-gray-600">
                      {transcript.length > 0 ? `${transcript.length} lines of transcript generated` : ''}
                    </div>
                  )}
                  
                  {isGeneratingTranscript && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiLoader className="animate-spin h-4 w-4 text-purple-500 mr-2" />
                      <span>Transcribing audio...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Chat panel (visible on large screens or when toggled) */}
          {showChat && (
            <div className="lg:col-span-1 order-last lg:order-none">
              <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex space-x-4">
                    <button
                      className={`text-sm font-medium ${chatType === 'group' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => toggleChatType('group')}
                    >
                      <span className="flex items-center">
                        <FiUsers className="mr-1 h-4 w-4" /> Group Chat
                      </span>
                    </button>
                    <button
                      className={`text-sm font-medium ${chatType === 'tutor' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => toggleChatType('tutor')}
                    >
                      <span className="flex items-center">
                        <FiUser className="mr-1 h-4 w-4" /> Tutor Chat
                      </span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowChat(false)}
                    className="text-gray-400 hover:text-gray-500 lg:hidden"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatType === 'group' ? (
                    // Group chat messages
                    chatMessages.map(message => (
                      <div key={message.id} className="flex items-start">
                        <img 
                          src={message.avatar} 
                          alt={message.user} 
                          className="h-10 w-10 rounded-full mr-3"
                        />
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center">
                            <span className={`font-medium ${message.isTutor ? 'text-blue-600' : 'text-gray-900'}`}>
                              {message.user} {message.isTutor && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">Tutor</span>}
                            </span>
                            <span className="ml-auto text-xs text-gray-500">{message.time}</span>
                          </div>
                          <p className="text-gray-700 mt-1">{message.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Private tutor chat messages
                    tutorChatMessages.map(message => (
                      <div key={message.id} className={`flex items-start ${message.isTutor ? '' : 'justify-end'}`}>
                        {message.isTutor && (
                          <img 
                            src={message.avatar} 
                            alt={message.user} 
                            className="h-10 w-10 rounded-full mr-3"
                          />
                        )}
                        <div className={`flex-1 ${message.isTutor ? 'bg-gray-50' : 'bg-blue-50'} rounded-lg p-3 max-w-[80%]`}>
                          <div className="flex items-center">
                            <span className={`font-medium ${message.isTutor ? 'text-blue-600' : 'text-gray-900'}`}>
                              {message.isTutor && (
                                <>
                                  {message.user} <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">Tutor</span>
                                </>
                              )}
                            </span>
                            <span className="ml-auto text-xs text-gray-500">{message.time}</span>
                          </div>
                          <p className="text-gray-700 mt-1">{message.text}</p>
                        </div>
                        {!message.isTutor && (
                          <img 
                            src={message.avatar} 
                            alt={message.user} 
                            className="h-10 w-10 rounded-full ml-3"
                          />
                        )}
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {/* Chat input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${chatType === 'tutor' ? 'tutor' : 'everyone'}...`}
                      className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className={`${chatType === 'tutor' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-r-md p-2`}
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
          
          {/* Video list sidebar */}
          <div className={`${showChat || showTranscript ? 'lg:col-span-1' : 'md:w-1/3'}`}>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Course Content</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {videos.length} videos • {course.formattedDuration || `${course.totalHours || 0}h ${course.totalMinutes || 0}m`}
                </p>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {videos.map((video, index) => (
                  <div 
                    key={video.id} 
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedVideo && selectedVideo.id === video.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{video.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 truncate">{video.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <FiClock className="mr-1 h-3 w-3" />
                          <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <FiPlay className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 