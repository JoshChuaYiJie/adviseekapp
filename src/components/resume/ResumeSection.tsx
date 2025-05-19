
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChatWithAISection } from "@/components/ChatWithAISection";

interface ResumeSectionProps {
  id: string;
  name: string;
  content: string;
  placeholder: string;
  onSave: (id: string, content: string) => void;
  inputType?: "textarea" | "input";
}

export const ResumeSection = ({
  id,
  name,
  content,
  placeholder,
  onSave,
  inputType = "textarea",
}: ResumeSectionProps) => {
  const [editedContent, setEditedContent] = useState(content);
  const [showChat, setShowChat] = useState(false);

  const handleSave = () => {
    onSave(id, editedContent);
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2">{name}</h3>
      
      {inputType === "textarea" ? (
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[150px] mb-2"
        />
      ) : (
        <Input
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          placeholder={placeholder}
          className="mb-2"
        />
      )}
      
      <div className="flex space-x-2">
        <Button onClick={handleSave} size="sm">
          Save Changes
        </Button>
        
        <Button 
          onClick={toggleChat} 
          size="sm" 
          variant={showChat ? "secondary" : "outline"}
        >
          {showChat ? "Hide Chat" : "Chat with Adviseek"}
        </Button>
      </div>
      
      {showChat && (
        <div className="mt-4 border rounded-md">
          <ChatWithAISection sectionName={name} sectionContent={editedContent} />
        </div>
      )}
    </div>
  );
};
