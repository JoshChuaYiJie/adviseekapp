
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star, BookOpen, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AchievementsSidebar } from "@/components/badges/AchievementsSidebar";

type Achievement = {
  id: number;
  achievement_key: string;  // Changed from 'type' to 'achievement_key' to match DB
  progress: number;
  max_progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
  user_id: string;
  created_at: string;
};

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data: achievements, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && achievements) {
        setAchievements(achievements);
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

  return (
    <div className="flex h-screen bg-background">
      <AchievementsSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('achievements.title')}</h1>
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
    </div>
  );
};

export default Achievements;
