
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RiasecChart } from "../RiasecChart";
import { WorkValuesChart } from "../WorkValuesChart";
import { UserProfileDisplay } from "../majors/UserProfileDisplay";
import { ProfileInfo } from "./ProfileInfo";
import { RecommendedMajors } from "./RecommendedMajors";
import { RecommendedModules } from "./RecommendedModules";
import { OpenEndedQuizPrompt } from "./OpenEndedQuizPrompt";
import { useGlobalProfile } from "@/contexts/GlobalProfileContext";

interface ProfileContentProps {
  setActiveTab: (tab: "quiz" | "profile" | "resume") => void;
  isLoading: boolean;
}

export const ProfileContent = ({ setActiveTab, isLoading }: ProfileContentProps) => {
  const { 
    riasecCode, 
    workValueCode, 
    recommendedMajors, 
    recommendedModules, 
    isLoading: profileLoading, 
    error 
  } = useGlobalProfile();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RiasecChart />
      <WorkValuesChart />
      
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>My Competencies and Preferences</CardTitle>
          <CardDescription>Based on your quiz responses</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || profileLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Display profile codes */}
              <UserProfileDisplay riasecCode={riasecCode} workValueCode={workValueCode} />
              
              <ProfileInfo 
                riasecCode={riasecCode} 
                workValueCode={workValueCode} 
                isLoading={profileLoading} 
              />
              
              <Separator className="my-6" />
              
              {/* Recommended Majors Section */}
              <RecommendedMajors 
                recommendedMajors={recommendedMajors} 
                riasecCode={riasecCode} 
                workValueCode={workValueCode} 
              />
              
              {/* Recommended Modules Section */}
              {(recommendedModules.length > 0 || profileLoading) && (
                <RecommendedModules 
                  modules={recommendedModules} 
                  isLoading={profileLoading} 
                />
              )}
              
              <OpenEndedQuizPrompt />
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={() => setActiveTab("quiz")}>
            Take More Quizzes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
