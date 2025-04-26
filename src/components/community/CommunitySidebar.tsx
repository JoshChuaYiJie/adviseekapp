
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, TrendingUp, Award, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const communities = [
  { name: "Computer Science", members: 4521, icon: "💻" },
  { name: "Engineering", members: 3218, icon: "🔧" },
  { name: "Business", members: 2896, icon: "📊" },
  { name: "Arts & Design", members: 1752, icon: "🎨" },
  { name: "Medicine", members: 1435, icon: "🩺" }
];

export const CommunitySidebar = () => {
  return (
    <div className="w-64 h-full bg-background border-r border-border p-4 flex flex-col gap-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Communities</h2>
        <p className="text-sm text-muted-foreground">Join discussions with other students</p>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search communities" className="pl-8" />
      </div>
      
      <div className="space-y-1 mb-4">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to="/community">
            <MessageSquare className="mr-2 h-4 w-4" />
            All Communities
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <TrendingUp className="mr-2 h-4 w-4" />
          Popular
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Award className="mr-2 h-4 w-4" />
          My Communities
        </Button>
      </div>
      
      <div className="mb-4">
        <Button className="w-full flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Community
        </Button>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-medium mb-2 text-sm text-muted-foreground">POPULAR COMMUNITIES</h3>
        <div className="space-y-2">
          {communities.map((community) => (
            <div key={community.name} className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer">
              <div className="flex items-center">
                <span className="mr-2 text-xl">{community.icon}</span>
                <span className="font-medium">{community.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{community.members.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-auto text-xs text-muted-foreground">
        <div className="border-t pt-4">
          <p>© 2025 Adviseek Communities</p>
          <div className="flex gap-2 mt-1">
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Help</a>
          </div>
        </div>
      </div>
    </div>
  );
};
