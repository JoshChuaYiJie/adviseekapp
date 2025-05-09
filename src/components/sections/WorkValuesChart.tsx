
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { calculateWorkValuesProfile, getUserId } from '@/contexts/quiz/utils/databaseHelpers';

export const WorkValuesChart = () => {
  const [workValuesData, setWorkValuesData] = useState<Array<{name: string, value: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkValuesProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = await getUserId();
        if (userId) {
          const profile = await calculateWorkValuesProfile(userId);
          // Convert to array format for chart, filter out zero values, ensure numbers
          const chartData = Object.entries(profile)
            .filter(([_, value]) => typeof value === 'number' && value > 0)
            .map(([name, value]) => ({
              name,
              value: Number(value) || 0
            }));
          
          console.log('Work Values Chart Data:', chartData); // Debug log
          setWorkValuesData(chartData);
          
          // Trigger animation after data loads
          setTimeout(() => {
            setShowAnimation(true);
          }, 100);
        } else {
          console.log('No user ID found - user may not be logged in');
          setError('Please log in to view your work values profile');
        }
      } catch (error) {
        console.error("Error loading Work Values profile:", error);
        setError("Could not load Work Values profile");
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkValuesProfile();
  }, []);

  // Distinct color palette for Work Values (different from RIASEC)
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  if (loading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-purple-500 rounded-full"></div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-[300px]">
        <CardHeader>
          <CardTitle>Work Values Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] flex-col">
          <p className="text-gray-500">{error}</p>
          <p className="text-sm text-gray-400 mt-2">Try refreshing the page or completing the work values quiz</p>
        </CardContent>
      </Card>
    );
  }

  if (workValuesData.length === 0) {
    return (
      <Card className="w-full h-[300px]">
        <CardHeader>
          <CardTitle>Work Values Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-gray-500">Complete work values quiz to see your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full transition-all duration-500 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <CardHeader>
        <CardTitle>Work Values Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={workValuesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {workValuesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`Score: ${value}`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>Achievement</strong>: Results-oriented, sense of accomplishment</p>
          <p><strong>Independence</strong>: Autonomy, self-direction</p>
          <p><strong>Recognition</strong>: Visibility, status, appreciation</p>
          <p><strong>Relationships</strong>: Connection with colleagues</p>
          <p><strong>Support</strong>: Assistance and encouragement</p>
          <p><strong>Working Conditions</strong>: Environment, job security</p>
        </div>
      </CardContent>
    </Card>
  );
};
