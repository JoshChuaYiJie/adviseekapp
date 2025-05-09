import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { calculateWorkValuesProfile, getUserId } from '@/contexts/quiz/utils/databaseHelpers';

export const WorkValuesChart = () => {
  const [workValuesData, setWorkValuesData] = useState<Array<{name: string, value: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Distinct color palette for Work Values
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  useEffect(() => {
    const loadWorkValuesProfile = async () => {
      try {
        setLoading(true);
        const userId = await getUserId();
        
        if (userId) {
          const profile = await calculateWorkValuesProfile(userId);
          console.log('Raw Work Values Profile:', profile);
          
          // Convert to array format for chart data
          const chartData = Object.entries(profile)
            .map(([name, value]) => ({
              name,
              value: typeof value === 'number' ? value : 0
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value); // Sort by value descending

          console.log('Processed Chart Data:', chartData);
          setWorkValuesData(chartData);
          
          // Add slight delay for animation
          setTimeout(() => setShowAnimation(true), 100);
        }
      } catch (error) {
        console.error("Error loading Work Values profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkValuesProfile();
  }, []);

  if (loading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-purple-500 rounded-full"></div>
      </Card>
    );
  }

  if (!workValuesData.length) {
    return (
      <Card className="w-full h-[300px]">
        <CardHeader>
          <CardTitle>Work Values Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-gray-500">Complete the work values quiz to see your profile.</p>
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
