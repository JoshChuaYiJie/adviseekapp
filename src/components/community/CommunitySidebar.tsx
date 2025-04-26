
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const CommunitySidebar = () => {
  return (
    <div className="w-64 h-full bg-background border-r border-border p-4 flex flex-col gap-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Community</h2>
        <p className="text-sm text-muted-foreground">Join discussions with other students</p>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search discussions" className="pl-8" />
      </div>
      
      <div className="mb-4">
        <Button className="w-full flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Post
        </Button>
      </div>
      
      <div className="mt-auto text-xs text-muted-foreground">
        <div className="border-t pt-4">
          <p>© 2025 Adviseek Communities</p>
          <div className="flex gap-2 mt-1">
            <Link to="/terms-of-service" className="hover:underline">Terms</Link>
            <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
            <Link to="/help" className="hover:underline">Help</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
