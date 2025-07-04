import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { getAllStories, Story } from '../services/storyService';

const AnalyticsDashboard: React.FC = () => {
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
    { name: 'Drafts', value: stories.filter(s => s.status === 'Draft').length },
    { name: 'In Progress', value: stories.filter(s => s.status === 'Editing').length },
    { name: 'Completed', value: stories.filter(s => s.status === 'Completed').length },
    { name: 'AI Generated', value: stories.filter(s => s.authorName?.toLowerCase().includes('ai')).length },
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

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50'];

  if (loading) return <div className="p-8 text-center">Loading analytics…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-[#181c2a] dark:via-[#232946] dark:to-blue-950">
      <div className="w-full mx-auto p-4 md:p-8 md:max-w-5xl">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-orange-300 mb-6">Analytics Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="p-4">
            <h3 className="font-bold mb-2">Story Status</h3>
            {storyStats.length === 0 ? <div className="text-gray-400">No data available.</div> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={storyStats}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold mb-2">AI Usage Breakdown</h3>
            {aiUsage.length === 0 ? <div className="text-gray-400">No data available.</div> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={aiUsage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {aiUsage.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
        <Card className="p-4 mb-8">
          <h3 className="font-bold mb-2">Activity Over Time</h3>
          {activity.length === 0 ? <div className="text-gray-400">No data available.</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activity}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="stories" stroke="#82ca9d" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 