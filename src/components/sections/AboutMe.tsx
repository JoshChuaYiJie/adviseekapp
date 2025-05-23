import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AboutMe: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Manage your profile information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Customize your profile to get the most relevant recommendations.</p>
          <div className="flex space-x-4 mt-4">
            <Button variant="outline" onClick={() => navigate("/my-profile")}>
              My Major Preferences
            </Button>
            <Button variant="outline" onClick={() => navigate("/recommendations")}>
              Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume Builder</CardTitle>
          <CardDescription>Create a professional resume to showcase your skills and experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Use our resume builder to create a standout resume for your applications.</p>
          <Button variant="outline" onClick={() => navigate("/resume-builder")}>
            Build Resume
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Statement</CardTitle>
          <CardDescription>Craft a compelling personal statement to highlight your unique qualities.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Write a personal statement that captures your personality and aspirations.</p>
          <Button variant="outline" onClick={() => navigate("/personal-statement")}>
            Write Statement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
