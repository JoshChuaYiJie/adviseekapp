
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const OpenEndedQuizPrompt = () => {
  const navigate = useNavigate();
  
  const handleOpenEndedQuiz = () => {
    navigate("/open-ended");
  };
  
  return (
    <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900">
      <h3 className="text-lg font-semibold mb-2">Open-ended Questions</h3>
      <p className="mb-4">
        Take our specialized quiz to answer questions about specific majors based on your RIASEC and Work Values profile.
      </p>
      <Button onClick={handleOpenEndedQuiz}>Take Open-ended Quiz</Button>
    </div>
  );
};
