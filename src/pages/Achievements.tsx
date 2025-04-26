
import React, { useState, useEffect } from 'react';
import { AchievementsSidebar } from '@/components/badges/AchievementsSidebar';
import { Badge, Trophy, Star, Award, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Define achievement types
type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: string;
  unlocked_at?: string;
};

const AchievementsPage: React.FC = () => {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    
    // Placeholder achievements data
    const placeholderAchievements: Achievement[] = [
      {
        id: '1',
        title: 'First Steps',
        description: 'Complete your profile setup',
        icon: <Badge className="h-8 w-8 text-blue-500" />,
        unlocked: true,
        progress: 100,
        maxProgress: 100,
        category: 'Profile',
        unlocked_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Resume Master',
        description: 'Create 3 customized resumes',
        icon: <BookOpen className="h-8 w-8 text-green-500" />,
        unlocked: false,
        progress: 1,
        maxProgress: 3,
        category: 'Resume',
      },
      {
        id: '3',
        title: 'University Explorer',
        description: 'View details for 10 different universities',
        icon: <Award className="h-8 w-8 text-purple-500" />,
        unlocked: false,
        progress: 4,
        maxProgress: 10,
        category: 'Exploration',
      },
      {
        id: '4',
        title: 'Interview Ready',
        description: 'Complete 5 mock interviews',
        icon: <Target className="h-8 w-8 text-orange-500" />,
        unlocked: false,
        progress: 2,
        maxProgress: 5,
        category: 'Interviews',
      },
      {
        id: '5',
        title: 'Community Contributor',
        description: 'Make 10 helpful posts in the community',
        icon: <Star className="h-8 w-8 text-yellow-500" />,
        unlocked: false,
        progress: 3,
        maxProgress: 10,
        category: 'Community',
      },
      {
        id: '6',
        title: 'Application Champion',
        description: 'Submit 3 university applications',
        icon: <Trophy className="h-8 w-8 text-amber-500" />,
        unlocked: false,
        progress: 1,
        maxProgress: 3,
        category: 'Applications',
      },
    ];

    try {
      // Try to fetch from database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error fetching achievements:', error);
          setAchievements(placeholderAchievements);
        } else if (data && data.length > 0) {
          // If we have database achievements, use those
          // Transform the data as needed
          setAchievements(placeholderAchievements); // For now, still using placeholders
        } else {
          // No achievements in database, use placeholders
          setAchievements(placeholderAchievements);
        }
      } else {
        // Not logged in, use placeholders
        setAchievements(placeholderAchievements);
      }
    } catch (error) {
      console.error('Error in achievements logic:', error);
      setAchievements(placeholderAchievements);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AchievementsSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t('achievements.title', 'Achievements')}</h1>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-muted/20 animate-pulse h-40">
                  <div className="h-full" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{t('achievements.your_progress', 'Your Progress')}</h2>
                  <p className="text-muted-foreground">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} {t('achievements.completed', 'completed')}
                  </p>
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-md">
                  <span className="font-semibold text-primary">
                    {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className={`${achievement.unlocked ? 'border-primary/30 bg-primary/5' : ''} transition-all hover:shadow-md`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                          {achievement.icon}
                        </div>
                        {achievement.unlocked && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <CardTitle className="mt-2">{achievement.title}</CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{achievement.progress} / {achievement.maxProgress}</span>
                        <span className="text-muted-foreground">{Math.round((achievement.progress / achievement.maxProgress) * 100)}%</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                    </CardContent>
                    <CardFooter className="pt-1 text-xs text-muted-foreground">
                      {achievement.unlocked && achievement.unlocked_at && (
                        <>Unlocked on {new Date(achievement.unlocked_at).toLocaleDateString()}</>
                      )}
                      {!achievement.unlocked && (
                        <>Keep going to unlock this achievement</>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
