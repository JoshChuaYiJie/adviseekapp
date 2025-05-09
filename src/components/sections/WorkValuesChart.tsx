
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { calculateWorkValuesProfile, getUserId, inspectResponses } from '@/contexts/quiz/utils/databaseHelpers';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

export const WorkValuesChart = () => {
  const [workValuesData, setWorkValuesData] = useState<Array<{name: string, value: number, displayName: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Distinct color palette for Work Values
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  useEffect(() => {
    const loadWorkValuesProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = await getUserId();
        
        if (userId) {
          console.log("Got user ID for Work Values chart:", userId);
          
          // For debugging, inspect responses directly
          if (process.env.NODE_ENV !== 'production') {
            const responses = await inspectResponses(userId, 'work');
            console.log("Work Values-related responses:", responses);
          }
          
          const profile = await calculateWorkValuesProfile(userId);
          console.log('Raw Work Values Profile:', profile);
          
          // Calculate total for percentages
          const totalValue = Object.values(profile).reduce((sum, val) => sum + val, 0);
          
          // Convert to array format for chart data with display names
          const chartData = Object.entries(profile)
            .map(([name, value]) => {
              // Special case for Recognition
              let displayName = name === 'Recognition' ? 'Rc' : name.charAt(0);
              
              return {
                name,
                displayName,
                value: typeof value === 'number' ? value : 0
              };
            })
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value); // Sort by value descending

          console.log('Processed Work Values Chart Data:', chartData);
          setWorkValuesData(chartData);
          
          if (chartData.length === 0) {
            setError("No Work Values data available. Please complete the Work Values quiz.");
          } else {
            // Add slight delay for animation
            setTimeout(() => setShowAnimation(true), 100);
          }
        } else {
          setError("Please log in to see your Work Values profile.");
          console.log("No user ID available for Work Values chart");
        }
      } catch (error) {
        console.error("Error loading Work Values profile:", error);
        setError("Failed to load Work Values profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkValuesProfile();
  }, []);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  if (loading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-purple-500 rounded-full"></div>
      </Card>
    );
  }

  if (error || !workValuesData.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Work Values Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px]">
          <p className="text-gray-500 text-center mb-4">
            {error || "Complete the work values quiz to see your profile."}
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <Button variant="outline" size="sm" onClick={toggleDebugMode}>
              <Bug className="h-3 w-3 mr-1" />
              Debug Info
            </Button>
          )}
          {debugMode && (
            <div className="w-full mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono overflow-auto">
              <p>Make sure you've completed this quiz:</p>
              <ul className="list-disc pl-6">
                <li>Work Values</li>
              </ul>
              <p className="mt-2">Your responses should have component values like:</p>
              <ul className="list-disc pl-6">
                <li>Achievement</li>
                <li>Independence</li>
                <li>Recognition</li>
                <li>Relationships</li>
                <li>Support</li>
                <li>Working Conditions</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Calculate the total values for percentage display
  const totalValues = workValuesData.reduce((sum, item) => sum + item.value, 0);

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
                label={({ displayName, percent }) => `${displayName} (${(percent * 100).toFixed(0)}%)`}
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
              <Tooltip 
                formatter={(value, name, props) => {
                  // Calculate percentage
                  const percent = ((value as number) / totalValues * 100).toFixed(1);
                  return [`${percent}%`, props?.payload?.name || name];
                }}
              />
              <Legend formatter={(value, entry) => {
                // Type safety check to access the payload property
                if (entry && entry.payload && typeof entry.payload === 'object' && 'name' in entry.payload) {
                  return entry.payload.name as string;
                }
                return '';
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>A</strong>: Achievement - Results-oriented, sense of accomplishment</p>
          <p><strong>I</strong>: Independence - Autonomy, self-direction</p>
          <p><strong>Rc</strong>: Recognition - Visibility, status, appreciation</p>
          <p><strong>R</strong>: Relationships - Connection with colleagues</p>
          <p><strong>S</strong>: Support - Assistance and encouragement</p>
          <p><strong>W</strong>: Working Conditions - Environment, job security</p>
        </div>
      </CardContent>
    </Card>
  );
};
