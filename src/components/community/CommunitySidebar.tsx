
import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export const CommunitySidebar = () => {
  const { t } = useTranslation();
  
  return (
    <div className="w-64 h-full bg-background border-r border-border p-4 flex flex-col gap-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Community</h2>
        <p className="text-sm text-muted-foreground">Join discussions with other students</p>
      </div>
      
      <Button variant="ghost" className="w-full justify-start" asChild>
        <Link to="/community">
          <MessageSquare className="mr-2 h-4 w-4" />
          {t('community.all_communities')}
        </Link>
      </Button>
      
      <div className="mt-auto pt-4 border-t text-xs text-muted-foreground">
        <p>© 2025 Adviseek Communities</p>
        <div className="flex gap-2 mt-1">
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
          <Link to="/help" className="hover:underline">Help</Link>
        </div>
      </div>
    </div>
  );
};
