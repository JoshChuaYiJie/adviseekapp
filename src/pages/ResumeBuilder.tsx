
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/contexts/ThemeContext";

// Resume template thumbnails
const templates = [
  {
    id: 1,
    name: "Basic",
    description: "Simple, clean format suitable for all industries.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Basic",
    color: "bg-blue-600",
    path: "/resumebuilder/basic",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, Nationality" },
        { id: "education", name: "Education", placeholder: "Institution, Dates, Qualifications" },
        { id: "experience", name: "Work Experience", placeholder: "Role, Organization, Dates, Description" },
        { id: "awards", name: "Awards & Certificates", placeholder: "List your awards and certifications" },
        { id: "activities", name: "Extra-Curricular Activities", placeholder: "Role, Organization, Dates, Description" },
        { id: "additional", name: "Additional Information", placeholder: "Languages, Interests, IT Skills" },
      ]
    }
  },
  {
    id: 2,
    name: "STEM",
    description: "Technical focus with project-heavy, skills-driven format.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=STEM",
    color: "bg-emerald-600",
    path: "/resumebuilder/stem",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, GitHub/LinkedIn" },
        { id: "skills", name: "Technical Skills", placeholder: "Programming Languages, Tools, Technologies" },
        { id: "projects", name: "Technical Projects", placeholder: "Project Name, Technologies, Description" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates, Relevant Coursework" },
        { id: "experience", name: "Work Experience", placeholder: "Position, Company, Dates, Technical Achievements" },
        { id: "certifications", name: "Technical Certifications", placeholder: "List your technical certifications" },
      ]
    }
  },
  {
    id: 3,
    name: "Business",
    description: "Polished, results-oriented format for corporate roles.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Business",
    color: "bg-purple-600",
    path: "/resumebuilder/business",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, LinkedIn" },
        { id: "summary", name: "Professional Summary", placeholder: "Concise overview of professional experience and goals" },
        { id: "experience", name: "Professional Experience", placeholder: "Position, Company, Dates, Achievements with metrics" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates, GPA" },
        { id: "skills", name: "Core Competencies", placeholder: "Business skills, Software proficiency" },
        { id: "achievements", name: "Key Achievements", placeholder: "Notable business accomplishments with measurable results" },
      ]
    }
  },
  {
    id: 4,
    name: "Humanities",
    description: "Narrative emphasis for research and communication skills.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Humanities",
    color: "bg-amber-600",
    path: "/resumebuilder/humanities",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, LinkedIn/Portfolio" },
        { id: "research", name: "Research Focus", placeholder: "Areas of research interest and expertise" },
        { id: "publications", name: "Publications & Presentations", placeholder: "List of papers, books, and presentations" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates, Thesis/Dissertation" },
        { id: "experience", name: "Professional Experience", placeholder: "Position, Organization, Dates, Responsibilities" },
        { id: "skills", name: "Research & Communication Skills", placeholder: "Methodologies, languages, writing skills" },
      ]
    }
  },
  {
    id: 5,
    name: "Creative Arts",
    description: "Visual appeal that reflects professional skills yet remains ATS-friendly.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Creative+Arts",
    color: "bg-pink-600",
    path: "/resumebuilder/creative",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, Portfolio Website" },
        { id: "profile", name: "Creative Profile", placeholder: "Brief artistic statement and specialization" },
        { id: "portfolio", name: "Portfolio Highlights", placeholder: "Selected works with brief descriptions" },
        { id: "experience", name: "Professional Experience", placeholder: "Role, Studio/Company, Dates, Projects" },
        { id: "education", name: "Education & Training", placeholder: "Degree/Certification, Institution, Dates" },
        { id: "skills", name: "Creative & Technical Skills", placeholder: "Software, techniques, and creative abilities" },
      ]
    }
  },
  {
    id: 6,
    name: "Health Sciences",
    description: "Clinical precision with emphasis on certifications and qualifications.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Health+Sciences",
    color: "bg-red-600",
    path: "/resumebuilder/health",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone, Professional Registration Number" },
        { id: "qualifications", name: "Professional Qualifications", placeholder: "Licenses, certifications, registrations" },
        { id: "education", name: "Education", placeholder: "Degree, Institution, Dates, Clinical Focus" },
        { id: "experience", name: "Clinical Experience", placeholder: "Position, Healthcare Facility, Dates, Clinical Skills" },
        { id: "research", name: "Research & Publications", placeholder: "Studies, papers, presentations" },
        { id: "skills", name: "Specialized Skills", placeholder: "Clinical procedures, equipment proficiency, patient care" },
      ]
    }
  },
  {
    id: 7,
    name: "Education/Public Service",
    description: "Service-oriented format highlighting fieldwork and impact.",
    thumbnail: "https://placehold.co/300x400/f3f4f6/a3a3a3?text=Education/Public",
    color: "bg-indigo-600",
    path: "/resumebuilder/education",
    templateData: {
      sections: [
        { id: "header", name: "Contact Information", placeholder: "Your Name, Email, Phone" },
        { id: "education", name: "Education & Certification", placeholder: "Degree, Institution, Dates, Certifications" },
        { id: "experience", name: "Service Experience", placeholder: "Role, Organization, Dates, Impact and Contributions" },
        { id: "fieldwork", name: "Fieldwork & Community Engagement", placeholder: "Project, Location, Dates, Description" },
        { id: "skills", name: "Professional Skills", placeholder: "Teaching methods, program development, community outreach" },
        { id: "achievements", name: "Service Achievements", placeholder: "Awards, recognition, measurable community impacts" },
      ]
    }
  }
];

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showFullTemplate, setShowFullTemplate] = useState(false);
  const { isCurrentlyDark } = useTheme();
  
  const handleSelectTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      navigate(template.path);
      toast.success(`${template.name} template selected! You can now build your resume.`);
    }
  };

  const handleCloseTemplate = () => {
    setShowFullTemplate(false);
  };
  
  const handleBackNavigation = () => {
    // Navigate directly to dashboard
    navigate('/dashboard');
  };
  
  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleBackNavigation} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Resume Builder</h1>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Select a resume template tailored to your field of study or career path.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`overflow-hidden transition-all hover:shadow-lg ${selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''}`}
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
              >
                Use This Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumeBuilder;
