import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { getAllStories, Story } from '../services/storyService';
import { FiArrowLeft, FiBarChart2, FiPieChart, FiTrendingUp, FiFileText, FiEdit, FiCheckCircle, FiZap } from 'react-icons/fi';

const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStories().then(data => {
      setStories(data);
      setLoading(false);
    });
  }, []);

  // Compute stats
  const storyStats = [
    { name: 'Drafts', value: stories.filter(s => s.status === 'Draft').length, color: '#3B82F6' },
    { name: 'In Progress', value: stories.filter(s => s.status === 'Editing').length, color: '#F59E0B' },
    { name: 'Completed', value: stories.filter(s => s.status === 'Completed').length, color: '#10B981' },
    { name: 'AI Generated', value: stories.filter(s => s.authorName?.toLowerCase().includes('ai')).length, color: '#8B5CF6' },
  ].filter(stat => stat.value > 0);

  const aiUsage = Object.entries(
    stories.reduce((acc, s) => {
      const agent = s.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);

  const activityMap: Record<string, number> = {};
  stories.forEach(s => {
    const date = s.createdAt?.toDate ? s.createdAt.toDate().toISOString().slice(0, 10) : '';
    if (date) activityMap[date] = (activityMap[date] || 0) + 1;
  });
  const activity = Object.entries(activityMap).map(([date, stories]) => ({ date, stories }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Summary metrics
  const totalStories = stories.length;
  const completedStories = stories.filter(s => s.status === 'Completed').length;
  const aiGeneratedStories = stories.filter(s => s.authorName?.toLowerCase().includes('ai')).length;
  const completionRate = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;

  if (loading) {
    return (
      <div className="w-full animate-fadeIn">
        <div className="flex items-center justify-center py-12">
          <Loader size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Go back to Dashboard"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Track your writing progress and AI usage</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-0 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Stories</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalStories}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-0 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completedStories}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-0 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <FiZap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">AI Generated</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{aiGeneratedStories}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-0 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Completion Rate</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{completionRate}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Story Status Chart */}
          <Card className="p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <FiBarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Story Status Distribution</h3>
            </div>
            {storyStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FiBarChart2 className="w-12 h-12 opacity-50 mb-4" />
                <p className="text-lg font-medium">No data available</p>
                <p className="text-sm">Start creating stories to see analytics</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storyStats}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {storyStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* AI Usage Chart */}
          <Card className="p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <FiPieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Usage Breakdown</h3>
            </div>
            {aiUsage.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FiPieChart className="w-12 h-12 opacity-50 mb-4" />
                <p className="text-lg font-medium">No AI usage data</p>
                <p className="text-sm">Use AI features to see usage analytics</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={aiUsage} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {aiUsage.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Activity Chart */}
        <Card className="p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <FiTrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Over Time</h3>
          </div>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <FiTrendingUp className="w-12 h-12 opacity-50 mb-4" />
              <p className="text-lg font-medium">No activity data</p>
              <p className="text-sm">Create stories to see your activity timeline</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activity}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="stories" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 