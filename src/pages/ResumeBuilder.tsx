
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/contexts/ThemeContext";

// Resume template thumbnails (in a real application, these would be real templates)
const templates = [
  {
    id: 1,
    name: "Professional",
    description: "Clean and modern design suitable for any industry.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Professional",
    color: "bg-blue-600",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, LinkedIn" },
        { id: "summary", name: "Professional Summary", placeholder: "Write a brief summary of your qualifications and career goals" },
        { id: "experience", name: "Work Experience", placeholder: "Company, Position, Dates, Responsibilities and Achievements" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates, GPA" },
        { id: "skills", name: "Skills", placeholder: "List your technical and soft skills" },
      ]
    }
  },
  {
    id: 2,
    name: "Academic",
    description: "Perfect for academic positions and research roles.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Academic",
    color: "bg-emerald-600",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, Academic Profiles" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates, GPA, Relevant Coursework" },
        { id: "research", name: "Research Experience", placeholder: "Research Title, Institution, Dates, Description" },
        { id: "publications", name: "Publications", placeholder: "Publication citations in appropriate format" },
        { id: "teaching", name: "Teaching Experience", placeholder: "Course Title, Institution, Dates, Responsibilities" },
        { id: "skills", name: "Skills", placeholder: "List your technical and research skills" },
      ]
    }
  },
  {
    id: 3,
    name: "Creative",
    description: "Stand out with a unique design for creative fields.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Creative",
    color: "bg-purple-600",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, Portfolio Website" },
        { id: "profile", name: "Profile", placeholder: "Creative professional statement highlighting your unique approach" },
        { id: "portfolio", name: "Portfolio Highlights", placeholder: "Key projects and creative work with descriptions" },
        { id: "experience", name: "Experience", placeholder: "Company, Position, Dates, Creative Contributions" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates" },
        { id: "skills", name: "Skills", placeholder: "List your creative and technical skills" },
      ]
    }
  },
  {
    id: 4,
    name: "Executive",
    description: "Sophisticated layout for senior positions.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Executive",
    color: "bg-gray-800",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, LinkedIn" },
        { id: "executive-summary", name: "Executive Summary", placeholder: "Concise overview of leadership experience and strategic vision" },
        { id: "leadership", name: "Leadership Experience", placeholder: "Company, Position, Dates, Key Leadership Achievements" },
        { id: "achievements", name: "Key Accomplishments", placeholder: "Measurable achievements and business impacts" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates" },
        { id: "certifications", name: "Certifications", placeholder: "List relevant executive certifications" },
      ]
    }
  },
  {
    id: 5,
    name: "Technical",
    description: "Highlight your technical skills and projects.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Technical",
    color: "bg-orange-600",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, GitHub, LinkedIn" },
        { id: "technical-summary", name: "Technical Profile", placeholder: "Overview of technical expertise and specializations" },
        { id: "skills", name: "Technical Skills", placeholder: "Programming Languages, Tools, Technologies, Frameworks" },
        { id: "projects", name: "Key Projects", placeholder: "Project name, technologies used, your role, outcomes" },
        { id: "experience", name: "Work Experience", placeholder: "Company, Position, Dates, Technical Responsibilities" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates, Relevant Coursework" },
      ]
    }
  },
  {
    id: 6,
    name: "Minimalist",
    description: "Clean, simple layout focusing on content.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Minimalist",
    color: "bg-indigo-600",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone" },
        { id: "experience", name: "Experience", placeholder: "Company, Position, Dates, Key Responsibilities" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates" },
        { id: "skills", name: "Skills", placeholder: "List your key professional skills" },
      ]
    }
  }
];

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showFullTemplate, setShowFullTemplate] = useState(false);
  const { isCurrentlyDark } = useTheme();
  
  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplate(templateId);
    setShowFullTemplate(true);
    toast.success("Template selected! You can now edit this template.");
  };

  const handleCloseTemplate = () => {
    setShowFullTemplate(false);
  };

  const templateData = selectedTemplate !== null 
    ? templates.find(t => t.id === selectedTemplate)?.templateData 
    : null;
  
  return (
    <div className="container mx-auto py-10 max-w-7xl">
      {!showFullTemplate ? (
        <>
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
        </>
      ) : (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="container mx-auto py-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={handleCloseTemplate} className="mr-2">
                  <X className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">
                  {templates.find(t => t.id === selectedTemplate)?.name} Template
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Save Draft</Button>
                <Button>Download PDF</Button>
              </div>
            </div>
            
            <Alert className={`mb-6 ${isCurrentlyDark ? "bg-gray-800 border-gray-700 text-gray-100" : ""}`}>
              <AlertDescription>
                Click on any section to edit. Fill in your information following the guidelines in the placeholders.
              </AlertDescription>
            </Alert>
            
            <div className={`bg-white shadow-lg rounded-lg p-8 mx-auto max-w-4xl mb-10 ${isCurrentlyDark ? "bg-gray-800 text-white" : ""}`}>
              {/* Resume Template */}
              <div className="space-y-6">
                {templateData?.sections.map(section => (
                  <div key={section.id} className="border border-dashed border-gray-300 p-4 rounded">
                    <h3 className="font-semibold mb-2">{section.name}</h3>
                    <p className={`text-sm ${isCurrentlyDark ? "text-gray-300" : "text-gray-500"}`}>
                      {section.placeholder}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
