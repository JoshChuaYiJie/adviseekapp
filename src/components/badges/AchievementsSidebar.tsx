
import React from 'react';
import { Award, Star, Trophy, Target, BookOpen, Users, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
};

export const AchievementsSidebar = () => {
  const { t } = useTranslation();
  const [badges, setBadges] = React.useState<Badge[]>([
    {
      id: "community_contributor",
      name: t('achievements.community_contributor.title'),
      description: t('achievements.community_contributor.description'),
      icon: <Users className="h-6 w-6 text-blue-500" />,
      unlocked: false,
      progress: 60
    },
    {
      id: "knowledge_seeker",
      name: t('achievements.knowledge_seeker.title'),
      description: t('achievements.knowledge_seeker.description'),
      icon: <BookOpen className="h-6 w-6 text-green-500" />,
      unlocked: true,
      progress: 100
    },
    {
      id: "first_milestone",
      name: t('achievements.first_milestone.title'),
      description: t('achievements.first_milestone.description'),
      icon: <Target className="h-6 w-6 text-purple-500" />,
      unlocked: false,
      progress: 0
    },
    {
      id: "academic_explorer",
      name: t('achievements.academic_explorer.title'),
      description: t('achievements.academic_explorer.description'),
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      unlocked: false,
      progress: 30
    },
    {
      id: "early-adopter",
      name: "Early Adopter",
      description: "Joined during the platform's first month",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      unlocked: true,
      progress: 100
    },
    {
      id: "champion",
      name: "Champion",
      description: "Got accepted to your dream university",
      icon: <Trophy className="h-6 w-6 text-amber-500" />,
      unlocked: false,
      progress: 0
    }
  ]);

  const unlockedBadges = badges.filter(badge => badge.unlocked);
  const lockedBadges = badges.filter(badge => !badge.unlocked);

  return (
    <div className="w-64 h-full bg-background border-r border-border p-4 flex flex-col gap-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Award className="mr-2 h-5 w-5 text-yellow-500" />
          {t('achievements.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('achievements.description')}</p>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{t('achievements.total_badges')}</span>
          <span className="font-medium">{unlockedBadges.length} / {badges.length}</span>
        </div>
        <Progress value={(unlockedBadges.length / badges.length) * 100} className="h-2" />
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">{t('achievements.unlocked')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {unlockedBadges.map(badge => (
            <div key={badge.id} className="flex flex-col items-center p-2 bg-accent/30 rounded-md">
              <div className="p-2 rounded-full bg-background mb-1">
                {badge.icon}
              </div>
              <span className="text-xs font-medium text-center">{badge.name}</span>
            </div>
          ))}
          {unlockedBadges.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-2">
              {t('achievements.no_badges')}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium mb-2">{t('achievements.next')}</h3>
        <div className="space-y-3">
          {lockedBadges.slice(0, 3).map(badge => (
            <div key={badge.id} className="p-3 border rounded-md">
              <div className="flex items-center mb-2">
                <div className="p-1 rounded-full bg-muted mr-2 opacity-70">
                  {badge.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{badge.name}</div>
                  <div className="text-xs text-muted-foreground">{badge.description}</div>
                </div>
              </div>
              <Progress value={badge.progress || 0} className="h-1.5" />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-muted-foreground">{badge.progress || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t">
        <button className="text-sm text-primary font-medium hover:underline">
          {t('achievements.view_all')}
        </button>
      </div>
    </div>
  );
};
