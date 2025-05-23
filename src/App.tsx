
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import UniversitySelection from "./pages/UniversitySelection";
import SegmentedQuiz from "./pages/SegmentedQuiz";
import Recommendations from "./pages/Recommendations";
import { QuizProvider } from "@/contexts/QuizContext";
import Pricing from "./pages/Pricing";
import { FeedbackForm } from "./components/FeedbackForm";
import Settings from "./pages/Settings";
import ResumeBuilder from "./pages/ResumeBuilder";
import BasicResume from "./pages/BasicResume";
import { ChatWithAI } from "./components/ChatWithAI";
import Community from "./pages/Community";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Achievements from "./pages/Achievements";
import QuizDebugPage from "./pages/QuizDebugPage";
import OpenEndedQuiz from "./pages/OpenEndedQuiz";
import { RecommendationProvider } from "@/contexts/RecommendationContext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RecommendationProvider>
          <BrowserRouter>
            <TooltipProvider>
              <QuizProvider>
                <Toaster />
                <Sonner position="top-right" />
                <FeedbackForm />
                <ChatWithAI />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/university-selection" element={<UniversitySelection />} />
                  <Route path="/quiz/:segmentId" element={<SegmentedQuiz />} />
                  <Route path="/open-ended" element={<OpenEndedQuiz />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/resumebuilder" element={<ResumeBuilder />} />
                  <Route path="/resumebuilder/basic" element={<BasicResume />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/debug/quiz" element={<QuizDebugPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </QuizProvider>
            </TooltipProvider>
          </BrowserRouter>
        </RecommendationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
