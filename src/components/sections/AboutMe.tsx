
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { QuizSegments } from "./QuizSegments";
import { RiasecChart } from "./RiasecChart";
import { WorkValuesChart } from "./WorkValuesChart";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { MyResume } from "./MyResume";

export const AboutMe = () => {
  const [activeTab, setActiveTab] = useState<"quiz" | "profile" | "resume">("quiz");
  const navigate = useNavigate();

  const handleResumeClick = () => {
    navigate("/resumebuilder");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">About Me</h2>
          <p className="text-muted-foreground">
            Complete quizzes to learn more about your interests and strengths
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === "quiz" ? "default" : "outline"} 
            onClick={() => setActiveTab("quiz")}
          >
            Quizzes
          </Button>
          <Button 
            variant={activeTab === "profile" ? "default" : "outline"} 
            onClick={() => setActiveTab("profile")}
          >
            My Profile
          </Button>
          <Button 
            variant={activeTab === "resume" ? "default" : "outline"} 
            onClick={() => setActiveTab("resume")}
          >
            <FileText className="mr-2 h-4 w-4" />
            My Resume
          </Button>
        </div>
      </div>

      {activeTab === "quiz" ? (
        <QuizSegments />
      ) : activeTab === "profile" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiasecChart />
          <WorkValuesChart />
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>My Competencies and Preferences</CardTitle>
              <CardDescription>Based on your quiz responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Strengths</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Analytical thinking and problem-solving</li>
                    <li>Creative approaches to challenges</li>
                    <li>Strong communication and interpersonal skills</li>
                    <li>Detail-oriented with good organizational abilities</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Work Environment Preferences</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Collaborative team settings</li>
                    <li>Opportunities for continuous learning</li>
                    <li>Balance between structure and innovation</li>
                    <li>Recognition for contributions and achievements</li>
                  </ul>
                </div>
              </div>
              <Separator className="my-6" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Recommended Study Areas</h3>
                <p>Based on your profile, you might be well-suited for:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Computer Science or Information Technology</li>
                  <li>Business Administration or Management</li>
                  <li>Psychology or Social Sciences</li>
                  <li>Design or Creative Arts</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => setActiveTab("quiz")}>Take More Quizzes</Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <MyResume />
      )}
    </div>
  );
};
