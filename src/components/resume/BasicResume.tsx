
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Plus, 
  Minus,
  Edit,
  Trash2
} from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Json } from "@/integrations/supabase/types";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  dates: string;
  description: string;
}

interface WorkExperienceItem {
  id: string;
  role: string;
  organization: string;
  dates: string;
  description: string;
}

interface ActivityItem {
  id: string;
  role: string;
  organization: string;
  dates: string;
  description: string;
}

interface ResumeData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  educationItems: EducationItem[];
  work_experience: WorkExperienceItem[];
  activities: ActivityItem[];
  awards: string;
  languages: string;
  interests: string;
  it_skills: string;
  user_id?: string;
  template_type?: string;
}

// Helper functions to convert between typed arrays and Json
const parseJsonArray = <T,>(jsonArray: Json | null | undefined, fallback: T[]): T[] => {
  if (!jsonArray) return fallback;
  try {
    if (Array.isArray(jsonArray)) {
      return jsonArray as T[];
    }
    return fallback;
  } catch (error) {
    console.error("Error parsing JSON array:", error);
    return fallback;
  }
};

const BasicResume = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCurrentlyDark } = useTheme();
  const pdfCanvasRef = useRef<HTMLDivElement>(null);
  const searchParams = new URLSearchParams(location.search);
  const resumeId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'create';
  const isPdfSource = searchParams.get('source') === 'pdf';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Initial empty resume state
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: '',
    email: '',
    phone: '',
    nationality: '',
    educationItems: [
      { id: '1', institution: '', degree: '', dates: '', description: '' }
    ],
    work_experience: [
      { id: '1', role: '', organization: '', dates: '', description: '' }
    ],
    activities: [
      { id: '1', role: '', organization: '', dates: '', description: '' }
    ],
    awards: '',
    languages: '',
    interests: '',
    it_skills: ''
  });

  // Load existing resume data if editing
  useEffect(() => {
    const loadResumeData = async () => {
      if (!resumeId) return;
      
      setLoading(true);
      try {
        console.log("Loading resume with ID:", resumeId);
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .single();
          
        if (error) {
          console.error("Error loading resume:", error);
          toast.error("Failed to load resume");
          return;
        }
        
        if (!data) {
          toast.error("Resume not found");
          return;
        }
        
        console.log("Resume data loaded:", data);
        
        // Default values for arrays if they're null or not arrays
        const defaultEducationItem: EducationItem = { id: '1', institution: '', degree: '', dates: '', description: '' };
        const defaultWorkExperience: WorkExperienceItem = { id: '1', role: '', organization: '', dates: '', description: '' };
        const defaultActivity: ActivityItem = { id: '1', role: '', organization: '', dates: '', description: '' };
        
        // Parse JSON arrays with proper typing
        const educationItems = parseJsonArray<EducationItem>(data.educationItems, [defaultEducationItem]);
        const workExperience = parseJsonArray<WorkExperienceItem>(data.work_experience, [defaultWorkExperience]);
        const activities = parseJsonArray<ActivityItem>(data.activities, [defaultActivity]);
        
        // Clean resumeData and set defaults for missing fields
        const cleanedData: ResumeData = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          nationality: data.nationality || '',
          educationItems,
          work_experience: workExperience,
          activities,
          awards: data.awards || '',
          languages: data.languages || '',
          interests: data.interests || '',
          it_skills: data.it_skills || '',
          user_id: data.user_id,
          template_type: data.template_type || 'basic'
        };
        
        setResumeData(cleanedData);
        setResumeName(data.name || 'My Resume');
        
      } catch (error) {
        console.error("Exception loading resume:", error);
        toast.error("An error occurred while loading the resume");
      } finally {
        setLoading(false);
      }
    };
    
    if (resumeId && (mode === 'edit' || mode === 'view')) {
      loadResumeData();
    }
  }, [resumeId, mode]);

  // Handle basic field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle education item changes
  const handleEducationChange = (index: number, field: keyof EducationItem, value: string) => {
    setResumeData(prev => {
      const newEducationItems = [...prev.educationItems];
      newEducationItems[index] = {
        ...newEducationItems[index],
        [field]: value
      };
      return {
        ...prev,
        educationItems: newEducationItems
      };
    });
  };

  // Add new education item
  const addEducationItem = () => {
    setResumeData(prev => ({
      ...prev,
      educationItems: [
        ...prev.educationItems,
        {
          id: `edu-${Date.now()}`,
          institution: '',
          degree: '',
          dates: '',
          description: ''
        }
      ]
    }));
  };

  // Remove education item
  const removeEducationItem = (index: number) => {
    if (resumeData.educationItems.length <= 1) return;
    
    setResumeData(prev => {
      const newItems = [...prev.educationItems];
      newItems.splice(index, 1);
      return {
        ...prev,
        educationItems: newItems
      };
    });
  };

  // Handle work experience changes
  const handleWorkExperienceChange = (index: number, field: keyof WorkExperienceItem, value: string) => {
    setResumeData(prev => {
      const newItems = [...prev.work_experience];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return {
        ...prev,
        work_experience: newItems
      };
    });
  };

  // Add new work experience item
  const addWorkExperienceItem = () => {
    setResumeData(prev => ({
      ...prev,
      work_experience: [
        ...prev.work_experience,
        {
          id: `work-${Date.now()}`,
          role: '',
          organization: '',
          dates: '',
          description: ''
        }
      ]
    }));
  };

  // Remove work experience item
  const removeWorkExperienceItem = (index: number) => {
    if (resumeData.work_experience.length <= 1) return;
    
    setResumeData(prev => {
      const newItems = [...prev.work_experience];
      newItems.splice(index, 1);
      return {
        ...prev,
        work_experience: newItems
      };
    });
  };

  // Handle activity changes
  const handleActivityChange = (index: number, field: keyof ActivityItem, value: string) => {
    setResumeData(prev => {
      const newItems = [...prev.activities];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return {
        ...prev,
        activities: newItems
      };
    });
  };

  // Add new activity item
  const addActivityItem = () => {
    setResumeData(prev => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          id: `act-${Date.now()}`,
          role: '',
          organization: '',
          dates: '',
          description: ''
        }
      ]
    }));
  };

  // Remove activity item
  const removeActivityItem = (index: number) => {
    if (resumeData.activities.length <= 1) return;
    
    setResumeData(prev => {
      const newItems = [...prev.activities];
      newItems.splice(index, 1);
      return {
        ...prev,
        activities: newItems
      };
    });
  };

  // Save resume to Supabase
  const saveResume = async () => {
    try {
      setSaving(true);
      
      // Check for user authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to save a resume");
        return;
      }
      
      console.log("Saving resume with data:", resumeData);
      
      // Prepare data for saving, ensuring all fields are present
      const dataToSave = {
        name: resumeName || 'My Resume',
        user_id: session.user.id,
        template_type: 'basic',
        email: resumeData.email || '',
        phone: resumeData.phone || '',
        nationality: resumeData.nationality || '',
        // Convert complex objects to JSON for database storage
        educationItems: resumeData.educationItems as unknown as Json,
        work_experience: resumeData.work_experience as unknown as Json,
        activities: resumeData.activities as unknown as Json,
        awards: resumeData.awards || '',
        languages: resumeData.languages || '',
        interests: resumeData.interests || '',
        it_skills: resumeData.it_skills || ''
      };
      
      console.log("Data being saved to Supabase:", dataToSave);
      
      // If resumeId exists, update, otherwise insert
      let result;
      if (resumeId) {
        result = await supabase
          .from('resumes')
          .update(dataToSave)
          .eq('id', resumeId);
      } else {
        result = await supabase
          .from('resumes')
          .insert([dataToSave]);
      }
      
      const { error, data } = result;
      
      if (error) {
        console.error("Error saving resume:", error);
        toast.error("Failed to save resume");
        return;
      }
      
      console.log("Resume saved successfully:", data);
      toast.success("Resume saved successfully!");
      
      // Close the dialog if it was open
      setShowSaveDialog(false);
      
      // Navigate back to resume page if this was a new resume
      if (!resumeId) {
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error("Exception saving resume:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  // Generate and download PDF
  const generatePDF = () => {
    if (!pdfCanvasRef.current) return;
    
    const element = pdfCanvasRef.current;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add name as title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(resumeData.name || 'Resume', margin, margin);
    
    // Add contact details
    let yPos = margin + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const contactInfo = [
      resumeData.email,
      resumeData.phone,
      resumeData.nationality
    ].filter(Boolean).join(' | ');
    
    doc.text(contactInfo, margin, yPos);
    
    // Education section
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Education', margin, yPos);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPos + 1, margin + contentWidth, yPos + 1);
    
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    resumeData.educationItems.forEach(item => {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(item.institution, margin, yPos);
      
      if (item.degree) {
        doc.setFont('helvetica', 'italic');
        yPos += 4;
        doc.text(item.degree, margin, yPos);
      }
      
      if (item.dates) {
        doc.setFont('helvetica', 'normal');
        yPos += 4;
        doc.text(item.dates, margin, yPos);
      }
      
      if (item.description) {
        yPos += 4;
        const lines = doc.splitTextToSize(item.description, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 4;
      }
      
      yPos += 3;
    });
    
    // Work Experience section
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Work Experience', margin, yPos);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPos + 1, margin + contentWidth, yPos + 1);
    
    yPos += 5;
    doc.setFontSize(10);
    
    resumeData.work_experience.forEach(item => {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.role}${item.organization ? ' at ' + item.organization : ''}`, margin, yPos);
      
      if (item.dates) {
        doc.setFont('helvetica', 'normal');
        yPos += 4;
        doc.text(item.dates, margin, yPos);
      }
      
      if (item.description) {
        yPos += 4;
        const lines = doc.splitTextToSize(item.description, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 4;
      }
      
      yPos += 3;
    });
    
    // Check if we need a new page before adding activities
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }
    
    // Activities section
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Extra-curricular Activities', margin, yPos);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPos + 1, margin + contentWidth, yPos + 1);
    
    yPos += 5;
    doc.setFontSize(10);
    
    resumeData.activities.forEach(item => {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.role}${item.organization ? ' at ' + item.organization : ''}`, margin, yPos);
      
      if (item.dates) {
        doc.setFont('helvetica', 'normal');
        yPos += 4;
        doc.text(item.dates, margin, yPos);
      }
      
      if (item.description) {
        yPos += 4;
        const lines = doc.splitTextToSize(item.description, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 4;
      }
      
      yPos += 3;
    });
    
    // Check if we need a new page before adding additional info
    if (yPos > 240) {
      doc.addPage();
      yPos = margin;
    }
    
    // Additional Information section
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Information', margin, yPos);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPos + 1, margin + contentWidth, yPos + 1);
    
    yPos += 8;
    doc.setFontSize(10);
    
    if (resumeData.awards) {
      doc.setFont('helvetica', 'bold');
      doc.text('Awards & Certificates:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 4;
      const lines = doc.splitTextToSize(resumeData.awards, contentWidth - 5);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4 + 3;
    }
    
    if (resumeData.languages) {
      doc.setFont('helvetica', 'bold');
      doc.text('Languages:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 4;
      const lines = doc.splitTextToSize(resumeData.languages, contentWidth - 5);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4 + 3;
    }
    
    if (resumeData.interests) {
      doc.setFont('helvetica', 'bold');
      doc.text('Interests:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 4;
      const lines = doc.splitTextToSize(resumeData.interests, contentWidth - 5);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4 + 3;
    }
    
    if (resumeData.it_skills) {
      doc.setFont('helvetica', 'bold');
      doc.text('IT Skills:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 4;
      const lines = doc.splitTextToSize(resumeData.it_skills, contentWidth - 5);
      doc.text(lines, margin + 5, yPos);
    }
    
    // Save the PDF
    const fileName = (resumeName || resumeData.name || 'resume').replace(/\s+/g, '_').toLowerCase() + '.pdf';
    doc.save(fileName);
    toast.success("PDF downloaded successfully!");
  };

  const renderForm = () => {
    const isViewMode = mode === 'view';
    
    return (
      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Enter your contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={resumeData.name} 
                  onChange={handleChange} 
                  placeholder="John Doe"
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-100" : ""}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    value={resumeData.email} 
                    onChange={handleChange} 
                    placeholder="john.doe@example.com"
                    readOnly={isViewMode}
                    className={isViewMode ? "bg-gray-100" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={resumeData.phone} 
                    onChange={handleChange} 
                    placeholder="+65 1234 5678"
                    readOnly={isViewMode}
                    className={isViewMode ? "bg-gray-100" : ""}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input 
                  id="nationality" 
                  name="nationality" 
                  value={resumeData.nationality} 
                  onChange={handleChange} 
                  placeholder="Singaporean"
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-100" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
            <CardDescription>Your academic background</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['education-0']}>
              {resumeData.educationItems.map((item, index) => (
                <AccordionItem key={item.id || index} value={`education-${index}`}>
                  <AccordionTrigger className="text-base font-medium hover:no-underline">
                    {item.institution || `Education #${index + 1}`}
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Institution</Label>
                        <Input 
                          value={item.institution} 
                          onChange={(e) => handleEducationChange(index, 'institution', e.target.value)} 
                          placeholder="University or School Name"
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Degree/Qualification</Label>
                        <Input 
                          value={item.degree} 
                          onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} 
                          placeholder="Bachelor of Science, Diploma, etc."
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Dates</Label>
                        <Input 
                          value={item.dates} 
                          onChange={(e) => handleEducationChange(index, 'dates', e.target.value)} 
                          placeholder="2018 - 2022"
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={item.description} 
                          onChange={(e) => handleEducationChange(index, 'description', e.target.value)} 
                          placeholder="Relevant courses, achievements, etc."
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      {!isViewMode && (
                        <div className="flex justify-end">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeEducationItem(index)}
                            disabled={resumeData.educationItems.length <= 1}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {!isViewMode && (
              <div className="mt-4">
                <Button variant="outline" onClick={addEducationItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Education
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Work Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Work Experience</CardTitle>
            <CardDescription>Your professional background</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['work-0']}>
              {resumeData.work_experience.map((item, index) => (
                <AccordionItem key={item.id || index} value={`work-${index}`}>
                  <AccordionTrigger className="text-base font-medium hover:no-underline">
                    {item.role || `Experience #${index + 1}`}
                    {item.organization && ` at ${item.organization}`}
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Role/Position</Label>
                        <Input 
                          value={item.role} 
                          onChange={(e) => handleWorkExperienceChange(index, 'role', e.target.value)} 
                          placeholder="Software Engineer, Marketing Intern, etc."
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Organization</Label>
                        <Input 
                          value={item.organization} 
                          onChange={(e) => handleWorkExperienceChange(index, 'organization', e.target.value)} 
                          placeholder="Company or Organization Name"
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Dates</Label>
                        <Input 
                          value={item.dates} 
                          onChange={(e) => handleWorkExperienceChange(index, 'dates', e.target.value)} 
                          placeholder="Jan 2020 - Present"
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={item.description} 
                          onChange={(e) => handleWorkExperienceChange(index, 'description', e.target.value)} 
                          placeholder="Responsibilities, achievements, skills used, etc."
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      {!isViewMode && (
                        <div className="flex justify-end">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeWorkExperienceItem(index)}
                            disabled={resumeData.work_experience.length <= 1}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {!isViewMode && (
              <div className="mt-4">
                <Button variant="outline" onClick={addWorkExperienceItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Work Experience
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Extra-curricular Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Extra-curricular Activities</CardTitle>
            <CardDescription>Your involvement outside of work and academics</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['activity-0']}>
              {resumeData.activities.map((item, index) => (
                <AccordionItem key={item.id || index} value={`activity-${index}`}>
                  <AccordionTrigger className="text-base font-medium hover:no-underline">
                    {item.role || `Activity #${index + 1}`}
                    {item.organization && ` at ${item.organization}`}
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Role/Position</Label>
                        <Input 
                          value={item.role} 
                          onChange={(e) => handleActivityChange(index, 'role', e.target.value)} 
                          placeholder="Volunteer, Club President, etc."
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Organization</Label>
                        <Input 
                          value={item.organization} 
                          onChange={(e) => handleActivityChange(index, 'organization', e.target.value)} 
                          placeholder="Club, Society, Volunteer Group, etc."
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Dates</Label>
                        <Input 
                          value={item.dates} 
                          onChange={(e) => handleActivityChange(index, 'dates', e.target.value)} 
                          placeholder="2019 - 2021"
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={item.description} 
                          onChange={(e) => handleActivityChange(index, 'description', e.target.value)} 
                          placeholder="Responsibilities, achievements, skills developed, etc."
                          readOnly={isViewMode}
                          className={isViewMode ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      {!isViewMode && (
                        <div className="flex justify-end">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeActivityItem(index)}
                            disabled={resumeData.activities.length <= 1}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {!isViewMode && (
              <div className="mt-4">
                <Button variant="outline" onClick={addActivityItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Activity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Other relevant details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="awards">Awards & Certificates</Label>
                <Textarea 
                  id="awards" 
                  name="awards" 
                  value={resumeData.awards} 
                  onChange={handleChange} 
                  placeholder="List your awards and certifications"
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-100" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="languages">Languages</Label>
                <Textarea 
                  id="languages" 
                  name="languages" 
                  value={resumeData.languages} 
                  onChange={handleChange} 
                  placeholder="English (Native), Mandarin (Fluent), etc."
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-100" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="interests">Interests</Label>
                <Textarea 
                  id="interests" 
                  name="interests" 
                  value={resumeData.interests} 
                  onChange={handleChange} 
                  placeholder="Your hobbies and interests"
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-100" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="it_skills">IT Skills</Label>
                <Textarea 
                  id="it_skills" 
                  name="it_skills" 
                  value={resumeData.it_skills} 
                  onChange={handleChange} 
                  placeholder="Programming languages, software, tools, etc."
                  readOnly={isViewMode}
                  className={isViewMode ? "bg-gray-100" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-5 w-5" /> Back
          </Button>
          <h1 className="text-2xl font-bold ml-2">Loading Resume...</h1>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded-md dark:bg-gray-700 w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-md dark:bg-gray-700"></div>
          <div className="h-32 bg-gray-200 rounded-md dark:bg-gray-700"></div>
          <div className="h-32 bg-gray-200 rounded-md dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 md:p-8 ${isCurrentlyDark ? 'dark' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-2">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === 'view' ? 'View Resume' : mode === 'edit' ? 'Edit Resume' : 'Create Resume'}
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {mode !== 'view' && (
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Save className="mr-2 h-5 w-5" /> Save Resume
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Resume</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="resumeName">Resume Name</Label>
                  <Input 
                    id="resumeName"
                    value={resumeName} 
                    onChange={(e) => setResumeName(e.target.value)}
                    placeholder={resumeData.name || "My Resume"}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                  <Button onClick={saveResume} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          <Button variant="outline" onClick={generatePDF}>
            <Download className="mr-2 h-5 w-5" /> Download PDF
          </Button>
          
          {mode === 'view' && (
            <Button onClick={() => navigate(`/resumebuilder/basic?id=${resumeId}&mode=edit`)}>
              <Edit className="mr-2 h-5 w-5" /> Edit
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Section */}
        <div className="w-full lg:w-1/2 space-y-6">
          {renderForm()}
        </div>
        
        {/* Preview Section */}
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>How your resume will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={pdfCanvasRef}
                  className="bg-white text-black p-8 min-h-[1000px] shadow-sm border border-gray-200 mx-auto max-w-[650px] overflow-auto"
                >
                  {/* PDF Preview Content */}
                  <div className="text-2xl font-bold mb-2">{resumeData.name || 'Your Name'}</div>
                  
                  <div className="text-sm mb-6">
                    {[resumeData.email, resumeData.phone, resumeData.nationality]
                      .filter(Boolean)
                      .join(' | ')}
                  </div>
                  
                  {/* Education Section */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold border-b border-gray-300 mb-2">Education</h2>
                    {resumeData.educationItems.map((item, index) => (
                      <div key={item.id || index} className="mb-3">
                        <div className="font-bold">{item.institution || 'Institution Name'}</div>
                        {item.degree && <div className="italic">{item.degree}</div>}
                        {item.dates && <div className="text-sm">{item.dates}</div>}
                        {item.description && <div className="text-sm mt-1">{item.description}</div>}
                      </div>
                    ))}
                  </div>
                  
                  {/* Work Experience Section */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold border-b border-gray-300 mb-2">Work Experience</h2>
                    {resumeData.work_experience.map((item, index) => (
                      <div key={item.id || index} className="mb-3">
                        <div className="font-bold">
                          {item.role || 'Position'}
                          {item.organization && ` at ${item.organization}`}
                        </div>
                        {item.dates && <div className="text-sm">{item.dates}</div>}
                        {item.description && <div className="text-sm mt-1">{item.description}</div>}
                      </div>
                    ))}
                  </div>
                  
                  {/* Activities Section */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold border-b border-gray-300 mb-2">
                      Extra-curricular Activities
                    </h2>
                    {resumeData.activities.map((item, index) => (
                      <div key={item.id || index} className="mb-3">
                        <div className="font-bold">
                          {item.role || 'Role'}
                          {item.organization && ` at ${item.organization}`}
                        </div>
                        {item.dates && <div className="text-sm">{item.dates}</div>}
                        {item.description && <div className="text-sm mt-1">{item.description}</div>}
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Information Section */}
                  <div>
                    <h2 className="text-lg font-bold border-b border-gray-300 mb-2">
                      Additional Information
                    </h2>
                    
                    {resumeData.awards && (
                      <div className="mb-2">
                        <span className="font-bold">Awards & Certificates:</span> {resumeData.awards}
                      </div>
                    )}
                    
                    {resumeData.languages && (
                      <div className="mb-2">
                        <span className="font-bold">Languages:</span> {resumeData.languages}
                      </div>
                    )}
                    
                    {resumeData.interests && (
                      <div className="mb-2">
                        <span className="font-bold">Interests:</span> {resumeData.interests}
                      </div>
                    )}
                    
                    {resumeData.it_skills && (
                      <div className="mb-2">
                        <span className="font-bold">IT Skills:</span> {resumeData.it_skills}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicResume;
