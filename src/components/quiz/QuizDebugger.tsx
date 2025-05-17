
import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface QuizDebuggerProps {
  userId: string;
  responses: any;
  quizType: string;
  debugData?: any;
}

const QuizDebugger: React.FC<QuizDebuggerProps> = ({ userId, responses, quizType, debugData }) => {
  const [showAll, setShowAll] = useState(false);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="debug">
        <AccordionTrigger>Debug Info</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold">User ID:</p>
              <p>{userId}</p>
            </div>
            <div>
              <p className="font-bold">Quiz Type:</p>
              <p>{quizType}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-bold">Responses:</p>
            {showAll ? (
              <pre>{JSON.stringify(responses, null, 2)}</pre>
            ) : (
              <pre>{JSON.stringify(Object.entries(responses).slice(0, 5).reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
              }, {}), null, 2)}</pre>
            )}
            {!showAll && Object.keys(responses).length > 5 && (
              <Button variant="link" onClick={() => setShowAll(true)}>Show All</Button>
            )}
          </div>
          {debugData && (
            <div className="mt-4">
              <p className="font-bold">Debug Data:</p>
              <pre>{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default QuizDebugger;
