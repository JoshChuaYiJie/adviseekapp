
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
import PickAI from "./pages/PickAI";
import Recommendations from "./pages/Recommendations";
import { QuizProvider } from "@/contexts/QuizContext";
import Pricing from "./pages/Pricing";
import FeedbackForm from "./components/FeedbackForm";
import Settings from "./pages/Settings";
import ResumeBuilder from "./pages/ResumeBuilder";
import { ChatWithAI } from "./components/ChatWithAI";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <QuizProvider>
        <Toaster />
        <Sonner position="top-right" />
        <FeedbackForm />
        <ChatWithAI />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/university-selection" element={<UniversitySelection />} />
            <Route path="/pickAI" element={<PickAI />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/resumebuilder" element={<ResumeBuilder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QuizProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
