'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isTutor, getCurrentUser } from '@/lib/utils/auth';
import PageHeader from '@/components/common/PageHeader';
import { API_URL } from '@/lib/utils/constants';

export default function Stats() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    averageRating: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserAuth = () => {
      if (!isAuthenticated() || !isTutor()) {
        router.push('/login');
        return;
      }
      setUser(getCurrentUser());
    };

    checkUserAuth();
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/tutors/${user.id}/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
        // For demo purposes, set mock data if API doesn't exist yet
        setStats({
          totalCourses: 5,
          totalStudents: 120,
          totalEnrollments: 240,
          averageRating: 4.7,
          recentActivity: [
            { type: 'enrollment', course: 'Advanced JavaScript', student: 'John Doe', date: '2023-05-15' },
            { type: 'review', course: 'React Fundamentals', rating: 5, student: 'Jane Smith', date: '2023-05-14' },
            { type: 'message', course: 'Python Basics', student: 'Bob Johnson', date: '2023-05-13' },
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Tutor Statistics"
        description="Overview of your teaching performance and student engagement"
      />

      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Note: Using sample data for demonstration purposes
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard title="Total Courses" value={stats.totalCourses} icon="📚" />
        <StatCard title="Total Students" value={stats.totalStudents} icon="👨‍🎓" />
        <StatCard title="Total Enrollments" value={stats.totalEnrollments} icon="📝" />
        <StatCard title="Average Rating" value={`${stats.averageRating.toFixed(1)}/5`} icon="⭐" />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentActivity.map((activity, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{activity.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{activity.student}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{activity.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.type === 'review' && `Rating: ${activity.rating}/5`}
                    {activity.type === 'enrollment' && 'New enrollment'}
                    {activity.type === 'message' && 'New message'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 flex flex-col">
      <div className="flex items-center mb-2">
        <span className="text-3xl mr-2">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-blue-600">{value}</p>
    </div>
  );
} 