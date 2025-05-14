
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { calculateRiasecProfile, getUserId, inspectResponses } from '@/contexts/quiz/utils/databaseHelpers';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Expose this data for other components to use
export const processRiasecData = async (userId: string) => {
  try {
    const profile = await calculateRiasecProfile(userId);
    console.log('Raw RIASEC Profile:', profile);
    
    // Skip empty profiles
    if (Object.keys(profile).length === 0) {
      console.log("Empty RIASEC profile, returning empty array");
      return [];
    }
    
    // Calculate total for percentages
    const totalValue = Object.values(profile).reduce((sum, val) => sum + val, 0);
    
    // Convert to array format for chart data with percentages
    const chartData = Object.entries(profile)
      .map(([name, value]) => ({
        name,
        value: typeof value === 'number' ? value : 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort by value descending

    console.log('Processed RIASEC Chart Data:', chartData);
    return chartData;
  } catch (error) {
    console.error("Error processing RIASEC data:", error);
    return [];
  }
};

export const RiasecChart = () => {
  const { toast } = useToast();
  const [riasecData, setRiasecData] = useState<Array<{name: string, value: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Distinct color palette for RIASEC
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  useEffect(() => {
    const loadRiasecProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = await getUserId();
        
        if (userId) {
          console.log("Got user ID for RIASEC chart:", userId);
          
          // For debugging, inspect responses directly
          const responses = await inspectResponses(userId, 'RIASEC');
          console.log("RIASEC-related responses:", responses);
          
          const chartData = await processRiasecData(userId);
          setRiasecData(chartData);
          
          if (chartData.length === 0) {
            setError("No RIASEC data available. Please complete the interest and competence quizzes.");
            toast({
              title: "No RIASEC Data",
              description: "Please complete the interest and competence quizzes to see your RIASEC profile.",
              variant: "default"
            });
          } else {
            // Add slight delay for animation
            setTimeout(() => setShowAnimation(true), 100);
          }
        } else {
          setError("Please log in to see your RIASEC profile.");
          console.log("No user ID available for RIASEC chart");
        }
      } catch (error) {
        console.error("Error loading RIASEC profile:", error);
        setError("Failed to load RIASEC profile. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load RIASEC profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadRiasecProfile();
  }, [toast]);

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

  if (error || !riasecData.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>RIASEC Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px]">
          <p className="text-gray-500 text-center mb-4">
            {error || "Complete interest and competence quizzes to see your RIASEC profile."}
          </p>
          <Button variant="outline" size="sm" onClick={toggleDebugMode}>
            <Bug className="h-3 w-3 mr-1" />
            Debug Info
          </Button>
          {debugMode && (
            <div className="w-full mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono overflow-auto">
              <p>Make sure you've completed these quizzes:</p>
              <ul className="list-disc pl-6">
                <li>Interest - Part 1</li>
                <li>Interest - Part 2</li>
                <li>Competence</li>
              </ul>
              <p className="mt-2">Your responses should have component values like:</p>
              <ul className="list-disc pl-6">
                <li>Realistic</li>
                <li>Investigative</li>
                <li>Artistic</li>
                <li>Social</li>
                <li>Enterprising</li>
                <li>Conventional</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Calculate total value for percentages
  const totalValue = riasecData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={`w-full transition-all duration-500 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
                animationBegin={0}
                animationDuration={1000}
              >
                {riasecData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => {
                  // Show raw value and percentage on hover
                  const percent = ((value as number) / totalValue * 100).toFixed(1);
                  return [`${percent}%`, name];
                }} 
              />
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
