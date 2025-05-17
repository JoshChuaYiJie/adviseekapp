
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Index from "./pages/Index";
import SegmentedQuiz from "./pages/SegmentedQuiz";
import OpenEndedQuiz from "./pages/OpenEndedQuiz";
import UniversitySelection from "./pages/UniversitySelection";
import NotFound from "./pages/NotFound";
import Recommendations from "./pages/Recommendations";
import ResumeBuilder from "./pages/ResumeBuilder";
import { QuizProvider } from "./contexts/quiz/QuizContext";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./contexts/ThemeContext";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import Achievements from "./pages/Achievements";
import QuizDebugPage from "./pages/QuizDebugPage";
import BasicResume from "./pages/BasicResume";
import { GlobalProfileProvider } from "./contexts/GlobalProfileContext";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <GlobalProfileProvider>
          <QuizProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/quiz" element={<SegmentedQuiz />} />
              {/* Step parameter route - ensure no space in the URL */}
              <Route path="/quiz/interest-part/:step" element={<SegmentedQuiz />} />
              <Route path="/open-ended" element={<OpenEndedQuiz />} />
              <Route path="/university-selection" element={<UniversitySelection />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/resumebuilder" element={<ResumeBuilder />} />
              <Route path="/basicresume" element={<BasicResume />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/community" element={<Community />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/debug" element={<QuizDebugPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </QuizProvider>
        </GlobalProfileProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
