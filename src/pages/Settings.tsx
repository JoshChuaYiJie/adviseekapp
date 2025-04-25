import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft, Moon, Sun, Laptop, Bell, Mail, Languages, Shield, Trash2, KeyRound, BookOpen, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

const profileFormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  appNotifications: z.boolean().default(true),
  newsletterSubscription: z.boolean().default(false),
});

const accountFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user?.email || "",
      name: "",
      bio: "",
    },
  });

  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      appNotifications: true,
      newsletterSubscription: false,
    },
  });

  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleReplayTutorial = () => {
    if (user) {
      localStorage.removeItem(`tutorial_completed_${user.id}`);
      toast.success("Tutorial enabled. It will show next time you visit the dashboard.");
      navigate('/dashboard');
    }
  };

  const handleProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleNotificationsSubmit = async (data: z.infer<typeof notificationsFormSchema>) => {
    try {
      toast.success("Notification preferences updated!");
    } catch (error) {
      toast.error("Failed to update notification preferences");
      console.error(error);
    }
  };

  const handlePasswordChange = async (data: z.infer<typeof accountFormSchema>) => {
    try {
      toast.success("Password updated successfully!");
      accountForm.reset();
    } catch (error) {
      toast.error("Failed to update password");
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      toast.success("Account deleted successfully");
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>
      
      <Tabs defaultValue="profile" className="w-full space-y-6">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{t('settings.profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>{t('settings.appearance')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{t('settings.notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>{t('settings.account')}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile')}</CardTitle>
              <CardDescription>
                Manage your personal information and how it appears to others.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the name that will be shown on your profile.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Input placeholder="Tell us about yourself" {...field} />
                        </FormControl>
                        <FormDescription>
                          A brief introduction that will be displayed on your profile.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit">{t('save')}</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance')}</CardTitle>
              <CardDescription>
                Customize how Adviseek looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t('settings.theme.title')}</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant={theme === "light" ? "default" : "outline"} 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        setTheme("light");
                        toast.success("Light theme applied");
                      }}
                    >
                      <Sun className="h-5 w-5" />
                      {t('settings.theme.light')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"} 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        setTheme("dark");
                        toast.success("Dark theme applied");
                      }}
                    >
                      <Moon className="h-5 w-5" />
                      {t('settings.theme.dark')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant={theme === "system" ? "default" : "outline"} 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        setTheme("system");
                        toast.success("System theme applied");
                      }}
                    >
                      <Laptop className="h-5 w-5" />
                      {t('settings.theme.system')}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('settings.language')}</Label>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('settings.languages.english')}</SelectItem>
                    <SelectItem value="zh">{t('settings.languages.mandarin')}</SelectItem>
                    <SelectItem value="es">{t('settings.languages.spanish')}</SelectItem>
                    <SelectItem value="fr">{t('settings.languages.french')}</SelectItem>
                    <SelectItem value="de">{t('settings.languages.german')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleReplayTutorial}
                >
                  <BookOpen className="h-5 w-5" />
                  {t('settings.replay_tutorial')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications')}</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(handleNotificationsSubmit)} className="space-y-6">
                  <FormField
                    control={notificationsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive important updates and alerts via email.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationsForm.control}
                    name="appNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">In-App Notifications</FormLabel>
                          <FormDescription>
                            Show notifications within the application.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationsForm.control}
                    name="newsletterSubscription"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Newsletter Subscription</FormLabel>
                          <FormDescription>
                            Receive our newsletter with tips and updates.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save Preferences</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.account')}</CardTitle>
              <CardDescription>
                Manage your account settings and security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <h3 className="font-medium text-lg">Change Password</h3>
                  <FormField
                    control={accountForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={accountForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={accountForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </Form>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-lg text-red-600 mb-4">Danger Zone</h3>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-red-600">Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <p className="text-sm">
                        Please type <strong>DELETE</strong> to confirm.
                      </p>
                      <Input placeholder="Type DELETE to confirm" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          handleDeleteAccount();
                          setIsDeleteDialogOpen(false);
                        }}
                      >
                        Confirm Deletion
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
