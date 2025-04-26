
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './integrations/supabase/client';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { AppSidebar } from './components/layout/Sidebar';
import { Toaster } from "@/components/ui/sonner";
import { useTranslation } from 'react-i18next';
import CommunityPage from './pages/Community';
import { PostDetails } from "@/components/community/PostDetails";
import AchievementsPage from "@/pages/Achievements";
import { SidebarProvider } from "@/components/ui/sidebar";
import SignUpPage from './pages/SignUp';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [session, setSession] = useState(null);
  const [selectedSection, setSelectedSection] = useState('applied-programmes');
  const { t } = useTranslation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !session ? (
                <div className="flex justify-center items-center h-screen">
                  <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    localization={{
                      variables: {
                        sign_in: {
                          email_label: t('email_input_label', { ns: 'auth' }),
                          password_label: t('password_input_label', { ns: 'auth' }),
                        },
                      },
                    }}
                    redirectTo="http://localhost:5173/dashboard"
                  />
                </div>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !session ? (
                <SignUpPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              session ? (
                <SidebarProvider>
                  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex w-full">
                    <AppSidebar selectedSection={selectedSection} setSelectedSection={setSelectedSection} user={session.user} />
                    <div className="flex-1 p-4">
                      <Dashboard selectedSection={selectedSection} />
                      <Toaster />
                    </div>
                  </div>
                </SidebarProvider>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              session ? (
                <SidebarProvider>
                  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex w-full">
                    <AppSidebar selectedSection={selectedSection} setSelectedSection={setSelectedSection} user={session.user} />
                    <div className="flex-1 p-4">
                      <Settings />
                      <Toaster />
                    </div>
                  </div>
                </SidebarProvider>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/community"
            element={
              session ? (
                <CommunityPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/community/post/:postId" element={<PostDetails />} />
          <Route 
            path="/achievements" 
            element={
              session ? (
                <SidebarProvider>
                  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex w-full">
                    <AppSidebar selectedSection={selectedSection} setSelectedSection={setSelectedSection} user={session?.user} />
                    <div className="flex-1 p-4">
                      <AchievementsPage />
                      <Toaster />
                    </div>
                  </div>
                </SidebarProvider>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
