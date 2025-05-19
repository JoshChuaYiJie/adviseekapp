
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DeepseekApiSettings } from "@/components/settings/DeepseekApiSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Settings = () => {
  const { isCurrentlyDark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Function to toggle between dark and light mode
  const toggleTheme = () => {
    setTheme(isCurrentlyDark ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-8 flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api">API Settings</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-8">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Appearance</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable dark mode for a more comfortable viewing experience in low light
                    </p>
                  </div>
                  <Switch 
                    id="dark-mode" 
                    checked={isCurrentlyDark}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Notifications</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your applications and account via email
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="deadline-reminders" className="text-base">Deadline Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notifications before important application deadlines
                    </p>
                  </div>
                  <Switch id="deadline-reminders" defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-8">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <DeepseekApiSettings />
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-8">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
              
              {/* Placeholder for account settings */}
              <p className="text-muted-foreground">
                You can update your personal information and manage your account here.
                This section is under development.
              </p>
            </div>
            
            <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
              <h2 className="text-xl font-semibold text-destructive mb-6">Danger Zone</h2>
              <div className="flex flex-col space-y-4">
                <Button variant="destructive">Delete My Account</Button>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete your account and all associated data.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
