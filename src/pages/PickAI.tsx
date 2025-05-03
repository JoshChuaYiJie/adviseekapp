import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from "@/contexts/QuizContext";

const Question = ({ 
  question, 
  id, 
  index, 
  value, 
  onChange, 
  onVisible, 
  onIntersect 
}: { 
  question: any, 
  id: string, 
  index: number, 
  value: any, 
  onChange: (value: any) => void,
  onVisible: () => void,
  onIntersect: (isIntersecting: boolean, index: number) => void 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [otherDialogOpen, setOtherDialogOpen] = useState(false);
  const [resultType, setResultType] = useState<string>("");
  const [showResultDialog, setShowResultDialog] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          onIntersect(entry.isIntersecting, index);
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            onVisible();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [index, onIntersect, onVisible, isVisible]);

  const handleOptionChange = (option: string, checked: boolean = true) => {
    if (question.id === "academic_results") {
      setResultType(option);
      setShowResultDialog(true);
      return;
    }

    if (option === "Other" && checked) {
      setOtherDialogOpen(true);
      return;
    }

    if (question.question_type === "multi-select") {
      const currentValues = value || [];
      const newValues = checked 
        ? [...currentValues, option] 
        : currentValues.filter(v => v !== option);
      onChange(newValues);
    } else {
      onChange(option);
    }
  };

  const handleResultSubmit = (result: string) => {
    onChange({ type: resultType, value: result });
    setShowResultDialog(false);
  };

  const handleOtherConfirm = () => {
    if (!otherText) return;
    
    if (question.question_type === "multi-select") {
      const currentValues = value || [];
      if (!currentValues.includes("Other")) {
        onChange([...currentValues, `Other: ${otherText}`]);
      } else {
        const filteredValues = currentValues.filter(v => !v.startsWith("Other:"));
        onChange([...filteredValues, `Other: ${otherText}`]);
      }
    } else {
      onChange(`Other: ${otherText}`);
    }
    
    setOtherDialogOpen(false);
  };

  const renderQuestionContent = () => {
    if (question.id === "academic_results") {
      return (
        <RadioGroup 
          value={value?.type || ""} 
          onValueChange={(val) => handleOptionChange(val)}
          className="space-y-3 mt-2"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem id={`${id}-gpa`} value="GPA" />
            <Label htmlFor={`${id}-gpa`} className="text-lg">GPA</Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem id={`${id}-rank`} value="Rank Points" />
            <Label htmlFor={`${id}-rank`} className="text-lg">Rank Points</Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem id={`${id}-other`} value="Other" />
            <Label htmlFor={`${id}-other`} className="text-lg">Other</Label>
          </div>
        </RadioGroup>
      );
    }

    switch (question.question_type) {
      case "single-select":
        return (
          <RadioGroup 
            value={value || ""} 
            onValueChange={handleOptionChange}
            className="space-y-3 mt-2"
          >
            {question.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-3">
                <RadioGroupItem id={`${id}-${option}`} value={option} />
                <Label htmlFor={`${id}-${option}`} className="text-lg">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "multi-select":
        const selectedValues = value || [];
        return (
          <div className="space-y-3 mt-2">
            <div className="flex items-center text-sm text-blue-500 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Pick multiple options
            </div>
            
            {question.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-3">
                <Checkbox 
                  id={`${id}-${option}`} 
                  checked={option === "Other" 
                    ? selectedValues.some(v => v.startsWith("Other:"))
                    : selectedValues.includes(option)
                  }
                  onCheckedChange={(checked) => handleOptionChange(option, !!checked)} 
                />
                <Label htmlFor={`${id}-${option}`} className="text-lg">{option}</Label>
              </div>
            ))}
          </div>
        );
      
      case "text":
        return (
          <Input 
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            className="mt-4"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <div 
        ref={ref}
        className={`min-h-screen flex flex-col justify-center p-8 md:p-16 transition-all duration-700
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
      >
        <h2 className="text-3xl font-bold mb-4">{question.section}</h2>
        <div className="max-w-3xl bg-white/5 backdrop-blur-md p-8 rounded-lg border border-white/10 shadow-xl">
          <h3 className="text-2xl font-semibold mb-6">{question.question_text}</h3>
          {renderQuestionContent()}
        </div>
      </div>

      <Dialog open={otherDialogOpen} onOpenChange={setOtherDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Please specify your answer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Please specify your answer"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              className="w-full"
              autoFocus
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleOtherConfirm}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter your {resultType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={`Enter your ${resultType}`}
              type={resultType === "GPA" ? "number" : "text"}
              onChange={(e) => handleResultSubmit(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const PickAI = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    questions, 
    isLoading, 
    error, 
    responses, 
    handleResponse, 
    submitResponses 
  } = useQuiz();
  
  const [visibleCount, setVisibleCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [groupedQuestions, setGroupedQuestions] = useState<Record<string, any[]>>({});
  const [orderedSections, setOrderedSections] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const questionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!questionsRef.current) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = questionsRef.current.scrollHeight;
      const scrolled = window.scrollY;
      
      const progress = Math.min(100, Math.round((scrolled / (documentHeight - windowHeight)) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const grouped: Record<string, any[]> = {};
    const sections: string[] = [];
    
    questions.forEach(question => {
      if (!grouped[question.section]) {
        grouped[question.section] = [];
        sections.push(question.section);
      }
      grouped[question.section].push(question);
    });
    
    setGroupedQuestions(grouped);
    setOrderedSections(sections);
  }, [questions]);

  const handleQuestionVisible = () => {
    setVisibleCount(prev => prev + 1);
  };

  const handleIntersect = (isIntersecting: boolean, index: number) => {
    if (isIntersecting) {
      setCurrentIndex(index);
    }
  };

  const findFirstUnansweredQuestion = () => {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!responses[question.id]) {
        const questionElement = document.getElementById(`question-${question.id}`);
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast({
            title: "Question required",
            description: "Please answer all questions before submitting.",
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!findFirstUnansweredQuestion()) {
      return;
    }

    setSubmitting(true);
    try {
      await submitResponses();
      // Navigate back to dashboard with the about-me section selected
      navigate("/?section=about-me");
    } catch (error) {
      console.error("Error submitting responses:", error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <div className="animate-spin w-12 h-12 border-t-2 border-purple-400 border-r-2 rounded-full mb-4"></div>
        <h2 className="text-2xl font-semibold">Loading questions...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <h2 className="text-3xl font-bold text-red-400 mb-4">Error</h2>
        <p className="mb-8">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 font-poppins">
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-purple-100 p-4 shadow-sm">
        <div className="container mx-auto">
          <div className="mb-2 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold text-purple-700 font-poppins drop-shadow-sm">Module Selection Quiz</h1>
            <span className="text-lg font-medium text-purple-400">{scrollProgress}% Complete</span>
          </div>
          <Progress value={scrollProgress} className="h-2 bg-purple-100" />
        </div>
      </div>

      <div ref={questionsRef} className="pb-20">
        {orderedSections.map(section => (
          groupedQuestions[section]?.map((question, idx) => (
            <div key={question.id} id={`question-${question.id}`}>
              <Question
                question={question}
                id={`question-${question.id}`}
                index={idx}
                value={responses[question.id]}
                onChange={(value) => handleResponse(question.id, value)}
                onVisible={handleQuestionVisible}
                onIntersect={handleIntersect}
              />
            </div>
          ))
        ))}
      </div>

      <div className="fixed bottom-8 flex justify-center w-full z-40">
        <Button 
          onClick={handleSubmit} 
          disabled={submitting}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-6 px-12 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-bold"
        >
          {submitting ? (
            <>
              <span className="animate-spin mr-2">↻</span> Submitting...
            </>
          ) : (
            'Submit Answers'
          )}
        </Button>
      </div>
    </div>
  );
};

export default PickAI;
