
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash, Download, Save } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface WorkExperience {
  id: string;
  role: string;
  organization: string;
  dates: string;
  description: string;
}

interface Activity {
  id: string;
  role: string;
  organization: string;
  dates: string;
  description: string;
}

interface ResumeData {
  name: string;
  phone: string;
  email: string;
  nationality: string;
  institution: string;
  educationDates: string;
  qualifications: string;
  workExperience: WorkExperience[];
  awards: string;
  activities: Activity[];
  languages: string;
  interests: string;
  itSkills: string;
}

// Define the resume table structure to match our Supabase table
interface ResumeRecord {
  id: string;
  user_id: string;
  template_type: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  institution: string | null;
  education_dates: string | null;
  qualifications: string | null;
  work_experience: WorkExperience[] | null;
  awards: string | null;
  activities: Activity[] | null;
  languages: string | null;
  interests: string | null;
  it_skills: string | null;
  created_at: string;
  updated_at: string;
}

const BasicResume = () => {
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: "",
    phone: "",
    email: "",
    nationality: "",
    institution: "",
    educationDates: "",
    qualifications: "",
    workExperience: [{ id: "work-1", role: "", organization: "", dates: "", description: "" }],
    awards: "",
    activities: [{ id: "activity-1", role: "", organization: "", dates: "", description: "" }],
    languages: "",
    interests: "",
    itSkills: ""
  });

  // Check for user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      
      // If user is authenticated, try to load their saved resume
      if (data.session?.user) {
        loadResumeData(data.session.user.id);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        loadResumeData(session.user.id);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load resume data from Supabase
  const loadResumeData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Use the correct typings with a raw query to the resumes table
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .eq('template_type', 'basic')
        .maybeSingle() as { data: ResumeRecord | null, error: any };
      
      if (error) throw error;
      
      if (data) {
        // Parse the data from JSON stored in Supabase
        setResumeData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          nationality: data.nationality || "",
          institution: data.institution || "",
          educationDates: data.education_dates || "",
          qualifications: data.qualifications || "",
          workExperience: data.work_experience || [{ id: "work-1", role: "", organization: "", dates: "", description: "" }],
          awards: data.awards || "",
          activities: data.activities || [{ id: "activity-1", role: "", organization: "", dates: "", description: "" }],
          languages: data.languages || "",
          interests: data.interests || "",
          itSkills: data.it_skills || ""
        });
      }
    } catch (error) {
      console.error('Error loading resume data:', error);
      toast.error("Failed to load your resume data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle work experience changes
  const handleWorkExperienceChange = (id: string, field: keyof WorkExperience, value: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new work experience
  const addWorkExperience = () => {
    const newId = `work-${Date.now()}`;
    setResumeData(prev => ({
      ...prev,
      workExperience: [
        ...prev.workExperience, 
        { id: newId, role: "", organization: "", dates: "", description: "" }
      ]
    }));
  };

  // Remove work experience
  const removeWorkExperience = (id: string) => {
    if (resumeData.workExperience.length <= 1) {
      toast.error("You must have at least one work experience entry.");
      return;
    }
    
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(item => item.id !== id)
    }));
  };

  // Handle activity changes
  const handleActivityChange = (id: string, field: keyof Activity, value: string) => {
    setResumeData(prev => ({
      ...prev,
      activities: prev.activities.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new activity
  const addActivity = () => {
    const newId = `activity-${Date.now()}`;
    setResumeData(prev => ({
      ...prev,
      activities: [
        ...prev.activities, 
        { id: newId, role: "", organization: "", dates: "", description: "" }
      ]
    }));
  };

  // Remove activity
  const removeActivity = (id: string) => {
    if (resumeData.activities.length <= 1) {
      toast.error("You must have at least one activity entry.");
      return;
    }
    
    setResumeData(prev => ({
      ...prev,
      activities: prev.activities.filter(item => item.id !== id)
    }));
  };

  // Save resume data to Supabase
  const saveResume = async () => {
    if (!user) {
      toast.error("Please log in to save your resume.", {
        action: {
          label: "Login",
          onClick: () => navigate('/dashboard')
        }
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use a type assertion to handle the custom table
      const { error } = await supabase
        .from('resumes')
        .upsert({
          user_id: user.id,
          template_type: 'basic',
          name: resumeData.name,
          phone: resumeData.phone,
          email: resumeData.email,
          nationality: resumeData.nationality,
          institution: resumeData.institution,
          education_dates: resumeData.educationDates,
          qualifications: resumeData.qualifications,
          work_experience: resumeData.workExperience,
          awards: resumeData.awards,
          activities: resumeData.activities,
          languages: resumeData.languages,
          interests: resumeData.interests,
          it_skills: resumeData.itSkills,
          updated_at: new Date()
        } as any);
      
      if (error) throw error;
      
      toast.success("Resume saved successfully!");
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error("Failed to save your resume.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate and download PDF
  const downloadPDF = () => {
    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });
      
      // Page dimensions and margins (0.75in = ~54pt)
      const margin = 54;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      
      // Colors and styling
      const tealColor = [46/255, 107/255, 143/255]; // #2e6b8f in RGB
      
      // Set font to Calibri-like
      doc.setFont("helvetica"); // Helvetica is the closest to Calibri available in jsPDF
      
      // Current vertical position
      let y = margin;
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text(resumeData.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      
      y += 30;
      
      // Contact info
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const contactInfo = `${resumeData.phone} | ${resumeData.email} | ${resumeData.nationality}`;
      doc.text(contactInfo, pageWidth / 2, y, { align: 'center' });
      
      y += 30;
      
      // Section: Education
      doc.setFontSize(12);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text("EDUCATION", margin, y);
      
      // Draw line under section header
      y += 5;
      doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 20;
      
      // Education details
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(resumeData.institution, margin, y);
      
      doc.setFont("helvetica", "italic");
      doc.text(resumeData.educationDates, pageWidth - margin, y, { align: 'right' });
      
      y += 15;
      
      // Qualifications - Convert to list with bullet points
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      const qualLines = resumeData.qualifications.split("\n").filter(Boolean);
      qualLines.forEach(qual => {
        doc.text(`• ${qual}`, margin + 10, y);
        y += 15;
      });
      
      y += 15;
      
      // Section: Work Experience
      doc.setFontSize(12);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text("WORK EXPERIENCE", margin, y);
      
      // Draw line under section header
      y += 5;
      doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 20;
      
      // Work experience details
      resumeData.workExperience.forEach((work, index) => {
        if (index > 0) y += 15;
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(work.role, margin, y);
        
        doc.setFont("helvetica", "italic");
        doc.text(work.dates, pageWidth - margin, y, { align: 'right' });
        
        y += 15;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(work.organization, margin, y);
        
        y += 15;
        
        // Description - Convert to list with bullet points
        doc.setFont("helvetica", "normal");
        const descLines = work.description.split("\n").filter(Boolean);
        descLines.forEach(line => {
          doc.text(`• ${line}`, margin + 10, y);
          y += 15;
        });
        
        y += 5;
      });
      
      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        y = margin;
      } else {
        y += 15;
      }
      
      // Section: Awards & Certificates
      doc.setFontSize(12);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text("AWARDS & CERTIFICATES", margin, y);
      
      // Draw line under section header
      y += 5;
      doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 20;
      
      // Awards - Convert to list with bullet points
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const awardLines = resumeData.awards.split("\n").filter(Boolean);
      awardLines.forEach(award => {
        doc.text(`• ${award}`, margin + 10, y);
        y += 15;
      });
      
      y += 15;
      
      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 150) {
        doc.addPage();
        y = margin;
      }
      
      // Section: Extra-Curricular Activities
      doc.setFontSize(12);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text("EXTRA-CURRICULAR ACTIVITIES", margin, y);
      
      // Draw line under section header
      y += 5;
      doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 20;
      
      // Activities details
      resumeData.activities.forEach((activity, index) => {
        if (index > 0) y += 15;
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(activity.role, margin, y);
        
        doc.setFont("helvetica", "italic");
        doc.text(activity.dates, pageWidth - margin, y, { align: 'right' });
        
        y += 15;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(activity.organization, margin, y);
        
        y += 15;
        
        // Description - Convert to list with bullet points
        doc.setFont("helvetica", "normal");
        const descLines = activity.description.split("\n").filter(Boolean);
        descLines.forEach(line => {
          doc.text(`• ${line}`, margin + 10, y);
          y += 15;
        });
        
        y += 5;
      });
      
      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 150) {
        doc.addPage();
        y = margin;
      } else {
        y += 15;
      }
      
      // Section: Additional Information
      doc.setFontSize(12);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text("ADDITIONAL INFORMATION", margin, y);
      
      // Draw line under section header
      y += 5;
      doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 20;
      
      // Languages
      if (resumeData.languages) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Languages:", margin, y);
        
        y += 15;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const languages = resumeData.languages.split(",").map(lang => lang.trim());
        doc.text(languages.join(", "), margin + 10, y);
        
        y += 20;
      }
      
      // Interests
      if (resumeData.interests) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Interests:", margin, y);
        
        y += 15;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const interests = resumeData.interests.split(",").map(interest => interest.trim());
        doc.text(interests.join(", "), margin + 10, y);
        
        y += 20;
      }
      
      // IT Skills
      if (resumeData.itSkills) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("IT Skills:", margin, y);
        
        y += 15;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const itSkills = resumeData.itSkills.split(",").map(skill => skill.trim());
        doc.text(itSkills.join(", "), margin + 10, y);
      }
      
      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Created with Adviseek © 2025", pageWidth / 2, footerY, { align: 'center' });
      
      // Save the PDF
      doc.save(`${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`);
      
      toast.success("Resume downloaded as PDF!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/resumebuilder')} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Basic Resume Builder</h1>
      </div>
      
      {/* Main content with form and preview */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Form */}
        <div className="w-full lg:w-1/2 space-y-6">
          <Card className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-gray-200' : ''}`}>
            <CardContent className="p-0 space-y-6">
              {/* Header Section */}
              <div>
                <h3 className={`font-semibold text-lg mb-4 ${isCurrentlyDark ? 'text-gray-200' : 'text-gray-800'}`}>Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name"
                      name="name"
                      value={resumeData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone"
                      name="phone"
                      type="tel"
                      value={resumeData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={resumeData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input 
                      id="nationality"
                      name="nationality"
                      value={resumeData.nationality}
                      onChange={handleInputChange}
                      placeholder="e.g. American"
                    />
                  </div>
                </div>
              </div>
              
              {/* Education Section */}
              <div>
                <h3 className={`font-semibold text-lg mb-4 ${isCurrentlyDark ? 'text-gray-200' : 'text-gray-800'}`}>Education</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input 
                      id="institution"
                      name="institution"
                      value={resumeData.institution}
                      onChange={handleInputChange}
                      placeholder="Harvard University"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="educationDates">Dates</Label>
                    <Input 
                      id="educationDates"
                      name="educationDates"
                      value={resumeData.educationDates}
                      onChange={handleInputChange}
                      placeholder="Sep 2018 - Jun 2022"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications (one per line)</Label>
                    <Textarea 
                      id="qualifications"
                      name="qualifications"
                      rows={4}
                      value={resumeData.qualifications}
                      onChange={handleInputChange}
                      placeholder="Bachelor of Science in Computer Science&#10;GPA: 3.8/4.0&#10;Relevant Coursework: Data Structures, Algorithms"
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
              
              {/* Work Experience Section */}
              <div>
                <h3 className={`font-semibold text-lg mb-4 ${isCurrentlyDark ? 'text-gray-200' : 'text-gray-800'}`}>Work Experience</h3>
                {resumeData.workExperience.map((work, index) => (
                  <div key={work.id} className="space-y-4 mb-6 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                      <h4 className={`font-medium ${isCurrentlyDark ? 'text-gray-300' : 'text-gray-700'}`}>Position {index + 1}</h4>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeWorkExperience(work.id)}
                        disabled={resumeData.workExperience.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`role-${work.id}`}>Role/Position</Label>
                        <Input 
                          id={`role-${work.id}`}
                          value={work.role}
                          onChange={(e) => handleWorkExperienceChange(work.id, 'role', e.target.value)}
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`organization-${work.id}`}>Organization/Company</Label>
                        <Input 
                          id={`organization-${work.id}`}
                          value={work.organization}
                          onChange={(e) => handleWorkExperienceChange(work.id, 'organization', e.target.value)}
                          placeholder="Google Inc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`dates-${work.id}`}>Dates</Label>
                        <Input 
                          id={`dates-${work.id}`}
                          value={work.dates}
                          onChange={(e) => handleWorkExperienceChange(work.id, 'dates', e.target.value)}
                          placeholder="Jul 2022 - Present"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`description-${work.id}`}>Description (one achievement per line)</Label>
                      <Textarea 
                        id={`description-${work.id}`}
                        value={work.description}
                        onChange={(e) => handleWorkExperienceChange(work.id, 'description', e.target.value)}
                        placeholder="Developed a new feature that increased user engagement by 30%&#10;Led a team of 5 engineers to deliver project ahead of schedule&#10;Optimized database queries resulting in 25% faster load times"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className={`w-full ${isCurrentlyDark ? 'border-gray-700 hover:bg-gray-700' : ''}`}
                  onClick={addWorkExperience}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Work Experience
                </Button>
              </div>
              
              {/* Awards & Certificates Section */}
              <div>
                <h3 className={`font-semibold text-lg mb-4 ${isCurrentlyDark ? 'text-gray-200' : 'text-gray-800'}`}>Awards & Certificates</h3>
                <div className="space-y-2">
                  <Label htmlFor="awards">List your awards and certificates (one per line)</Label>
                  <Textarea 
                    id="awards"
                    name="awards"
                    rows={4}
                    value={resumeData.awards}
                    onChange={handleInputChange}
                    placeholder="AWS Certified Solutions Architect, 2023&#10;Employee of the Month, June 2022&#10;Dean's List, Fall 2020"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              
              {/* Extra-Curricular Activities Section */}
              <div>
                <h3 className={`font-semibold text-lg mb-4 ${isCurrentlyDark ? 'text-gray-200' : 'text-gray-800'}`}>Extra-Curricular Activities</h3>
                {resumeData.activities.map((activity, index) => (
                  <div key={activity.id} className="space-y-4 mb-6 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                      <h4 className={`font-medium ${isCurrentlyDark ? 'text-gray-300' : 'text-gray-700'}`}>Activity {index + 1}</h4>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeActivity(activity.id)}
                        disabled={resumeData.activities.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`role-${activity.id}`}>Role/Position</Label>
                        <Input 
                          id={`role-${activity.id}`}
                          value={activity.role}
                          onChange={(e) => handleActivityChange(activity.id, 'role', e.target.value)}
                          placeholder="Volunteer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`organization-${activity.id}`}>Organization</Label>
                        <Input 
                          id={`organization-${activity.id}`}
                          value={activity.organization}
                          onChange={(e) => handleActivityChange(activity.id, 'organization', e.target.value)}
                          placeholder="Red Cross"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`dates-${activity.id}`}>Dates</Label>
                        <Input 
                          id={`dates-${activity.id}`}
                          value={activity.dates}
                          onChange={(e) => handleActivityChange(activity.id, 'dates', e.target.value)}
                          placeholder="Jan 2021 - Dec 2021"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`description-${activity.id}`}>Description (one point per line)</Label>
                      <Textarea 
                        id={`description-${activity.id}`}
                        value={activity.description}
                        onChange={(e) => handleActivityChange(activity.id, 'description', e.target.value)}
                        placeholder="Organized fundraising events that raised $10,000&#10;Coordinated a team of 20 volunteers&#10;Managed social media campaign with 50,000+ impressions"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className={`w-full ${isCurrentlyDark ? 'border-gray-700 hover:bg-gray-700' : ''}`}
                  onClick={addActivity}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Activity
                </Button>
              </div>
              
              {/* Additional Information Section */}
              <div>
                <h3 className={`font-semibold text-lg mb-4 ${isCurrentlyDark ? 'text-gray-200' : 'text-gray-800'}`}>Additional Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages (comma separated)</Label>
                    <Input 
                      id="languages"
                      name="languages"
                      value={resumeData.languages}
                      onChange={handleInputChange}
                      placeholder="English (Native), Spanish (Fluent), Mandarin (Basic)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests (comma separated)</Label>
                    <Input 
                      id="interests"
                      name="interests"
                      value={resumeData.interests}
                      onChange={handleInputChange}
                      placeholder="Photography, Hiking, Chess"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itSkills">IT Skills (comma separated)</Label>
                    <Input 
                      id="itSkills"
                      name="itSkills"
                      value={resumeData.itSkills}
                      onChange={handleInputChange}
                      placeholder="MS Office, Adobe Photoshop, HTML/CSS"
                    />
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={saveResume} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" /> Save & Preview
                </Button>
                <Button 
                  variant="outline"
                  onClick={downloadPDF} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Preview */}
        <div className="w-full lg:w-1/2">
          <Card className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-gray-200' : 'bg-white'}`}>
            <CardContent className="p-0">
              <div className={`border rounded-md p-8 ${isCurrentlyDark ? 'border-gray-700 bg-gray-900' : 'bg-white'}`} style={{ minHeight: "1120px", maxWidth: "100%", margin: "0 auto" }}>
                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold uppercase text-teal-600" style={{ color: "#2e6b8f" }}>
                    {resumeData.name || "FULL NAME"}
                  </h1>
                  <p className="text-sm mt-1">
                    {[resumeData.phone, resumeData.email, resumeData.nationality].filter(Boolean).join(" | ") || "Phone | Email | Nationality"}
                  </p>
                </div>
                
                {/* Education Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                    Education
                  </h2>
                  <div className="ml-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold">{resumeData.institution || "Institution"}</span>
                      <span className="italic">{resumeData.educationDates || "Dates"}</span>
                    </div>
                    <ul className="list-disc ml-5 mt-2 text-sm">
                      {resumeData.qualifications ? 
                        resumeData.qualifications.split("\n").filter(Boolean).map((qual, index) => (
                          <li key={index}>{qual}</li>
                        )) : 
                        <li>Qualifications will appear here</li>
                      }
                    </ul>
                  </div>
                </div>
                
                {/* Work Experience Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                    Work Experience
                  </h2>
                  {resumeData.workExperience.map((work, index) => (
                    <div key={work.id} className="ml-2 mb-4">
                      <div className="flex justify-between items-start">
                        <span className="font-bold">{work.role || "Role/Position"}</span>
                        <span className="italic">{work.dates || "Dates"}</span>
                      </div>
                      <div className="font-bold text-sm">{work.organization || "Organization/Company"}</div>
                      <ul className="list-disc ml-5 mt-1 text-sm">
                        {work.description ? 
                          work.description.split("\n").filter(Boolean).map((desc, i) => (
                            <li key={i}>{desc}</li>
                          )) : 
                          <li>Description will appear here</li>
                        }
                      </ul>
                    </div>
                  ))}
                </div>
                
                {/* Awards & Certificates Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                    Awards & Certificates
                  </h2>
                  <ul className="list-disc ml-7 text-sm">
                    {resumeData.awards ? 
                      resumeData.awards.split("\n").filter(Boolean).map((award, index) => (
                        <li key={index}>{award}</li>
                      )) : 
                      <li>Awards will appear here</li>
                    }
                  </ul>
                </div>
                
                {/* Extra-Curricular Activities Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                    Extra-Curricular Activities
                  </h2>
                  {resumeData.activities.map((activity, index) => (
                    <div key={activity.id} className="ml-2 mb-4">
                      <div className="flex justify-between items-start">
                        <span className="font-bold">{activity.role || "Role/Position"}</span>
                        <span className="italic">{activity.dates || "Dates"}</span>
                      </div>
                      <div className="font-bold text-sm">{activity.organization || "Organization"}</div>
                      <ul className="list-disc ml-5 mt-1 text-sm">
                        {activity.description ? 
                          activity.description.split("\n").filter(Boolean).map((desc, i) => (
                            <li key={i}>{desc}</li>
                          )) : 
                          <li>Description will appear here</li>
                        }
                      </ul>
                    </div>
                  ))}
                </div>
                
                {/* Additional Information Section */}
                <div>
                  <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                    Additional Information
                  </h2>
                  <div className="ml-2 space-y-3 text-sm">
                    {resumeData.languages && (
                      <div>
                        <span className="font-bold">Languages: </span>
                        {resumeData.languages}
                      </div>
                    )}
                    {resumeData.interests && (
                      <div>
                        <span className="font-bold">Interests: </span>
                        {resumeData.interests}
                      </div>
                    )}
                    {resumeData.itSkills && (
                      <div>
                        <span className="font-bold">IT Skills: </span>
                        {resumeData.itSkills}
                      </div>
                    )}
                    {!resumeData.languages && !resumeData.interests && !resumeData.itSkills && (
                      <p>Additional information will appear here</p>
                    )}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="mt-16 text-center text-xs text-gray-500">
                  Created with Adviseek © 2025
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BasicResume;
