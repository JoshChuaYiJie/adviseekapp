
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { calculateRiasecProfile, getUserId } from '@/contexts/quiz/utils/databaseHelpers';

export const RiasecChart = () => {
  const [riasecData, setRiasecData] = useState<Array<{name: string, value: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRiasecProfile = async () => {
      try {
        setLoading(true);
        const userId = await getUserId();
        if (userId) {
          const profile = await calculateRiasecProfile(userId);
          
          // Convert to array format for chart
          const chartData = Object.entries(profile).map(([name, value]) => ({
            name,
            value: value || 0
          }));
          
          setRiasecData(chartData);
        }
      } catch (error) {
        console.error("Error loading RIASEC profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRiasecProfile();
  }, []);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  if (loading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-purple-500 rounded-full"></div>
      </Card>
    );
  }

  if (riasecData.length === 0) {
    return (
      <Card className="w-full h-[300px]">
        <CardHeader>
          <CardTitle>RIASEC Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-gray-500">Complete interest and competence quizzes to see your RIASEC profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>RIASEC Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riasecData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riasecData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`Score: ${value}`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>R</strong>: Realistic - Practical, physical, hands-on problem solver</p>
          <p><strong>I</strong>: Investigative - Analytical, intellectual, scientific</p>
          <p><strong>A</strong>: Artistic - Creative, original, independent</p>
          <p><strong>S</strong>: Social - Cooperative, supportive, helper</p>
          <p><strong>E</strong>: Enterprising - Competitive environments, leadership</p>
          <p><strong>C</strong>: Conventional - Detail-oriented, organizing, clerical</p>
        </div>
      </CardContent>
    </Card>
  );
};
