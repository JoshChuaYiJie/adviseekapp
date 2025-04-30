
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star, BookOpen, Target, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AchievementsSidebar } from "@/components/badges/AchievementsSidebar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

type Achievement = {
  id: number;
  achievement_key: string;
  progress: number;
  max_progress: number | null; // Making this nullable to match database schema
  unlocked: boolean;
  unlocked_at: string | null;
  user_id: string;
  created_at: string;
};

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data: achievementsData, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && achievementsData) {
        // Map database objects to our Achievement type and provide default values for missing fields
        const processedAchievements = achievementsData.map(achievement => ({
          ...achievement,
          // Since max_progress doesn't exist in the database, we'll assign default values
          max_progress: 100 // Default to 100 if max_progress is not present
        }));
        
        setAchievements(processedAchievements);
      }
    };

    fetchAchievements();
  }, []);

  // Map the achievement_key to the correct translation key
  const getAchievementTranslationKey = (key: string) => {
    // This mapping converts the database achievement_key to the translation key format
    const keyMap: Record<string, string> = {
      'community_contributor': 'community_contributor',
      'knowledge_seeker': 'knowledge_seeker',
      'first_milestone': 'first_milestone',
      'academic_explorer': 'academic_explorer'
    };
    return keyMap[key] || key;
  };

  // Calculate total progress
  const totalProgress = achievements.length > 0 
    ? achievements.reduce((sum, achievement) => sum + (achievement.progress || 0), 0) / achievements.length 
    : 0;

  // Get unlocked badges
  const unlockedBadges = achievements.filter(achievement => achievement.unlocked);

  return (
    <div className="flex h-screen bg-background">
      <AchievementsSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="mr-4" 
              onClick={() => navigate("/dashboard")}
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">{t('achievements.title')}</h1>
          </div>
          
          <p className="text-muted-foreground mb-8">{t('achievements.description')}</p>
          
          <div className="grid gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-6 rounded-lg border ${
                  achievement.unlocked ? 'bg-primary/10 border-primary' : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    {achievement.achievement_key === 'community_contributor' && <Award className="h-6 w-6 text-primary" />}
                    {achievement.achievement_key === 'knowledge_seeker' && <Star className="h-6 w-6 text-primary" />}
                    {achievement.achievement_key === 'first_milestone' && <Target className="h-6 w-6 text-primary" />}
                    {achievement.achievement_key === 'academic_explorer' && <BookOpen className="h-6 w-6 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {t(`achievements.${getAchievementTranslationKey(achievement.achievement_key)}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`achievements.${getAchievementTranslationKey(achievement.achievement_key)}.description`)}
                    </p>
                    <div className="mt-2">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(achievement.progress / achievement.max_progress) * 100}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.progress} / {achievement.max_progress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* New right sidebar for Achievements */}
      <div className="w-64 h-full bg-background border-l border-border p-4 flex flex-col gap-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold">{t('achievements.total_badges')}</h2>
          <div className="mt-2">
            <div className="flex justify-between mb-1 text-sm">
              <span>{unlockedBadges.length} / {achievements.length}</span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
        </div>
        
        <h3 className="font-medium mb-2">{t('achievements.unlocked')}</h3>
        <div className="space-y-3">
          {unlockedBadges.length > 0 ? (
            unlockedBadges.map(badge => (
              <Card key={badge.id} className="p-3 flex items-center">
                <div className="p-1 rounded-full bg-primary/20 mr-2">
                  {badge.achievement_key === 'community_contributor' && <Award className="h-4 w-4 text-primary" />}
                  {badge.achievement_key === 'knowledge_seeker' && <Star className="h-4 w-4 text-primary" />}
                  {badge.achievement_key === 'first_milestone' && <Target className="h-4 w-4 text-primary" />}
                  {badge.achievement_key === 'academic_explorer' && <BookOpen className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-sm font-medium">
                  {t(`achievements.${getAchievementTranslationKey(badge.achievement_key)}.title`)}
                </div>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t('achievements.no_badges')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
