
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

// Resume template thumbnails (in a real application, these would be real templates)
const templates = [
  {
    id: 1,
    name: "Professional",
    description: "Clean and modern design suitable for any industry.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Professional",
    color: "bg-blue-600"
  },
  {
    id: 2,
    name: "Academic",
    description: "Perfect for academic positions and research roles.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Academic",
    color: "bg-emerald-600"
  },
  {
    id: 3,
    name: "Creative",
    description: "Stand out with a unique design for creative fields.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Creative",
    color: "bg-purple-600"
  },
  {
    id: 4,
    name: "Executive",
    description: "Sophisticated layout for senior positions.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Executive",
    color: "bg-gray-800"
  },
  {
    id: 5,
    name: "Technical",
    description: "Highlight your technical skills and projects.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Technical",
    color: "bg-orange-600"
  },
  {
    id: 6,
    name: "Minimalist",
    description: "Clean, simple layout focusing on content.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Minimalist",
    color: "bg-indigo-600"
  }
];

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  
  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplate(templateId);
    toast.success("Template selected! In a complete implementation, you would now be able to edit this template.");
    // In a real app, we would navigate to an editor for this template
    // navigate(`/resumebuilder/edit/${templateId}`);
  };
  
  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Resume Builder</h1>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Select a template below to start building your resume. You can customize it later.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`overflow-hidden transition-all ${selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className={`h-2 ${template.color}`}></div>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <img 
                  src={template.thumbnail} 
                  alt={`${template.name} template preview`}
                  className="w-full h-auto object-cover aspect-[3/4] transition-transform hover:scale-105"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleSelectTemplate(template.id)}
                variant={selectedTemplate === template.id ? "default" : "outline"}
              >
                {selectedTemplate === template.id ? "Selected" : "Use This Template"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumeBuilder;
