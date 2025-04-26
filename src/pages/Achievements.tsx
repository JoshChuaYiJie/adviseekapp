
import React, { useEffect, useState } from 'react';
import { Award, Star, Trophy, Target, BookOpen, Users, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/sonner";

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  unlocked: boolean;
  key: string;
};

const AchievementsPage = () => {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const achievementDefinitions: Omit<Achievement, 'progress' | 'unlocked'>[] = [
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      description: 'Joined during the platform\'s first month',
      icon: <Star className="h-12 w-12 text-yellow-500" />,
      key: 'early_adopter'
    },
    {
      id: 'community-contributor',
      name: 'Community Contributor',
      description: 'Created 5 posts in the community',
      icon: <Users className="h-12 w-12 text-blue-500" />,
      key: 'community_contributor'
    },
    {
      id: 'knowledge-seeker',
      name: 'Knowledge Seeker',
      description: 'Completed all onboarding tutorials',
      icon: <BookOpen className="h-12 w-12 text-green-500" />,
      key: 'knowledge_seeker'
    },
    {
      id: 'first-milestone',
      name: 'First Milestone',
      description: 'Applied to your first university',
      icon: <Target className="h-12 w-12 text-purple-500" />,
      key: 'first_milestone'
    },
    {
      id: 'academic-explorer',
      name: 'Academic Explorer',
      description: 'Selected 10 courses for your study plan',
      icon: <Zap className="h-12 w-12 text-orange-500" />,
      key: 'academic_explorer'
    }
  ];

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const achievementsWithProgress = achievementDefinitions.map(achievement => {
        const userAchievement = data?.find(a => a.achievement_key === achievement.key);
        return {
          ...achievement,
          progress: userAchievement?.progress || 0,
          unlocked: userAchievement?.unlocked || false
        };
      });

      setAchievements(achievementsWithProgress);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  };

  const unlockedAchievements = achievements.filter(achievement => achievement.unlocked);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{t('achievements.title')}</h1>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{t('achievements.total')}</span>
          <span className="font-medium">{unlockedAchievements.length} / {achievements.length}</span>
        </div>
        <Progress value={(unlockedAchievements.length / achievements.length) * 100} className="h-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-6 rounded-lg border ${
              achievement.unlocked
                ? 'bg-primary/5 border-primary'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${
                achievement.unlocked ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{achievement.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  {achievement.description}
                </p>
                <Progress value={achievement.progress} className="h-1.5" />
                <span className="text-xs text-gray-500 mt-1 block">
                  {achievement.progress}% {t('achievements.progress')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsPage;
