import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash, Download, Save, X, Edit } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

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

interface Education {
  id: string;
  institution: string;
  dates: string;
  qualifications: string;
}

interface Award {
  id: string;
  title: string;
  date: string;
}

interface ResumeData {
  resumeName: string;
  name: string;
  phone: string;
  email: string;
  nationality: string;
  educationItems: Education[];
  workExperience: WorkExperience[];
  awards: Award[];
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
  resumeName: string | null;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  educationItems: Education[] | null;
  work_experience: WorkExperience[] | null;
  awards: Award[] | null;
  activities: Activity[] | null;
  languages: string | null;
  interests: string | null;
  it_skills: string | null;
  created_at: string;
  updated_at: string;
}

type EditSection = 
  | "personal"
  | "resumeName"
  | "education"
  | "educationItem"
  | "workExperience"
  | "workExperienceItem"
  | "awards"
  | "awardItem"
  | "activities"
  | "activitiesItem"
  | "additional"
  | null;

interface EditDialogProps {
  section: EditSection;
  workIndex?: number;
  activityIndex?: number;
  educationIndex?: number;
  awardIndex?: number;
  onClose: () => void;
}

const BasicResume = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCurrentlyDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>({
    resumeName: "Untitled Resume",
    name: "",
    phone: "",
    email: "",
    nationality: "",
    educationItems: [{ id: "education-1", institution: "", dates: "", qualifications: "" }],
    workExperience: [{ id: "work-1", role: "", organization: "", dates: "", description: "" }],
    awards: [{ id: "award-1", title: "", date: "" }],
    activities: [{ id: "activity-1", role: "", organization: "", dates: "", description: "" }],
    languages: "",
    interests: "",
    itSkills: ""
  });
  
  const [editingSection, setEditingSection] = useState<EditSection>(null);
  const [editingWorkIndex, setEditingWorkIndex] = useState<number>(-1);
  const [editingActivityIndex, setEditingActivityIndex] = useState<number>(-1);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number>(-1);
  const [editingAwardIndex, setEditingAwardIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isPdfUpload, setIsPdfUpload] = useState(false);

  // Parse URL parameters for resume ID and view mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const mode = params.get('mode');
    const source = params.get('source');
    
    if (id) {
      setResumeId(id);
      // We'll load the specific resume later
    }
    
    if (mode === 'view') {
      setViewMode(true);
    }
    
    if (source === 'pdf') {
      setIsPdfUpload(true);
    }
  }, [location]);

  // Check for user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      
      // If user is authenticated and we have a resume ID, load that specific resume
      if (data.session?.user && resumeId) {
        loadSpecificResume(resumeId);
      }
      // If user is authenticated but no specific resume, try to load their default resume
      else if (data.session?.user && !resumeId) {
        loadResumeData(data.session.user.id);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        if (resumeId) {
          loadSpecificResume(resumeId);
        } else {
          loadResumeData(session.user.id);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [resumeId]);

  // Load specific resume by ID
  const loadSpecificResume = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .single() as { data: ResumeRecord, error: any };
      
      if (error) throw error;
      
      if (data) {
        // Parse the data from JSON stored in Supabase
        setResumeData({
          resumeName: data.resumeName || "Untitled Resume",
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          nationality: data.nationality || "",
          educationItems: Array.isArray(data.educationItems) ? data.educationItems : [{ id: "education-1", institution: "", dates: "", qualifications: "" }],
          workExperience: Array.isArray(data.work_experience) ? data.work_experience : [{ id: "work-1", role: "", organization: "", dates: "", description: "" }],
          awards: Array.isArray(data.awards) ? data.awards : [{ id: "award-1", title: "", date: "" }],
          activities: Array.isArray(data.activities) ? data.activities : [{ id: "activity-1", role: "", organization: "", dates: "", description: "" }],
          languages: data.languages || "",
          interests: data.interests || "",
          itSkills: data.it_skills || ""
        });
      }
    } catch (error) {
      console.error('Error loading specific resume:', error);
      toast.error("Failed to load the requested resume.");
    } finally {
      setIsLoading(false);
    }
  };

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
          resumeName: data.resumeName || "Untitled Resume",
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          nationality: data.nationality || "",
          educationItems: Array.isArray(data.educationItems) ? data.educationItems : [{ id: "education-1", institution: "", dates: "", qualifications: "" }],
          workExperience: Array.isArray(data.work_experience) ? data.work_experience : [{ id: "work-1", role: "", organization: "", dates: "", description: "" }],
          awards: Array.isArray(data.awards) ? data.awards : [{ id: "award-1", title: "", date: "" }],
          activities: Array.isArray(data.activities) ? data.activities : [{ id: "activity-1", role: "", organization: "", dates: "", description: "" }],
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

  // Handle education changes
  const handleEducationChange = (id: string, field: keyof Education, value: string) => {
    setResumeData(prev => ({
      ...prev,
      educationItems: prev.educationItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new education item
  const addEducationItem = () => {
    const newId = `education-${Date.now()}`;
    setResumeData(prev => ({
      ...prev,
      educationItems: [
        ...prev.educationItems, 
        { id: newId, institution: "", dates: "", qualifications: "" }
      ]
    }));
  };

  // Remove education item
  const removeEducationItem = (id: string) => {
    if (resumeData.educationItems.length <= 1) {
      toast.error("You must have at least one education entry.");
      return;
    }
    
    setResumeData(prev => ({
      ...prev,
      educationItems: prev.educationItems.filter(item => item.id !== id)
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

  // Handle award changes
  const handleAwardChange = (id: string, field: keyof Award, value: string) => {
    setResumeData(prev => ({
      ...prev,
      awards: prev.awards.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new award
  const addAward = () => {
    const newId = `award-${Date.now()}`;
    setResumeData(prev => ({
      ...prev,
      awards: [
        ...prev.awards, 
        { id: newId, title: "", date: "" }
      ]
    }));
  };

  // Remove award
  const removeAward = (id: string) => {
    if (resumeData.awards.length <= 1) {
      toast.error("You must have at least one award entry.");
      return;
    }
    
    setResumeData(prev => ({
      ...prev,
      awards: prev.awards.filter(item => item.id !== id)
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

  // Open section editing dialog
  const openEditDialog = (section: EditSection, workIndex?: number, activityIndex?: number, educationIndex?: number, awardIndex?: number) => {
    if (viewMode) return;
    
    setEditingSection(section);
    if (workIndex !== undefined) setEditingWorkIndex(workIndex);
    if (activityIndex !== undefined) setEditingActivityIndex(activityIndex);
    if (educationIndex !== undefined) setEditingEducationIndex(educationIndex);
    if (awardIndex !== undefined) setEditingAwardIndex(awardIndex);
  };

  // Close section editing dialog
  const closeEditDialog = () => {
    setEditingSection(null);
    setEditingWorkIndex(-1);
    setEditingActivityIndex(-1);
    setEditingEducationIndex(-1);
    setEditingAwardIndex(-1);
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
      const { data, error } = await supabase
        .from('resumes')
        .upsert({
          id: resumeId || undefined, // If we have a resumeId, update that record
          user_id: user.id,
          template_type: 'basic',
          resumeName: resumeData.resumeName,
          name: resumeData.name,
          phone: resumeData.phone,
          email: resumeData.email,
          nationality: resumeData.nationality,
          educationItems: resumeData.educationItems,
          work_experience: resumeData.workExperience,
          awards: resumeData.awards,
          activities: resumeData.activities,
          languages: resumeData.languages,
          interests: resumeData.interests,
          it_skills: resumeData.itSkills,
          updated_at: new Date()
        } as any)
        .select('id')
        .single();
      
      if (error) throw error;
      
      // If this was a new resume, update the resumeId
      if (data && !resumeId) {
        setResumeId(data.id);
        // Update the URL to include the new ID without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('id', data.id);
        window.history.replaceState({}, '', url.toString());
      }
      
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
      doc.text(resumeData.name.toUpperCase() || "YOUR NAME", pageWidth / 2, y, { align: 'center' });
      
      y += 30;
      
      // Contact info
      doc.setFontSize(10);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      const contactInfo = `${resumeData.phone || "Phone"} | ${resumeData.email || "Email"} | ${resumeData.nationality || "Nationality"}`;
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
      resumeData.educationItems.forEach((edu, index) => {
        if (index > 0) y += 15;
        
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(edu.institution || "Institution", margin, y);
        
        doc.setFont("helvetica", "italic");
        doc.text(edu.dates || "Dates", pageWidth - margin, y, { align: 'right' });
        
        y += 15;
        
        // Qualifications - Convert to list with bullet points
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const qualLines = edu.qualifications.split("\n").filter(Boolean);
        qualLines.forEach(qual => {
          doc.text(`• ${qual}`, margin + 10, y);
          y += 15;
        });
        
        y += 5;
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
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text(work.role || "Role", margin, y);
        
        doc.setFont("helvetica", "italic");
        doc.text(work.dates || "Dates", pageWidth - margin, y, { align: 'right' });
        
        y += 15;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(work.organization || "Organization", margin, y);
        
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
      
      // Awards - Display as list with titles and dates
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      
      resumeData.awards.forEach((award, index) => {
        const awardText = award.title || "Award Title";
        const dateText = award.date ? `(${award.date})` : "";
        doc.text(`• ${awardText} ${dateText}`, margin + 10, y);
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
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text(activity.role || "Role", margin, y);
        
        doc.setFont("helvetica", "italic");
        doc.text(activity.dates || "Dates", pageWidth - margin, y, { align: 'right' });
        
        y += 15;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(activity.organization || "Organization", margin, y);
        
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
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
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
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
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
        doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
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
      doc.save(`${resumeData.resumeName.replace(/\s+/g, '_')}.pdf`);
      
      toast.success("Resume downloaded as PDF!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF.");
    }
  };

  // Render the edit dialog for each section
  const renderEditDialog = () => {
    if (!editingSection) return null;

    return (
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection === 'resumeName' && 'Edit Resume Name'}
              {editingSection === 'personal' && 'Edit Personal Information'}
              {editingSection === 'education' && 'Manage Education Details'}
              {editingSection === 'educationItem' && 'Edit Education'}
              {editingSection === 'workExperience' && 'Manage Work Experience'}
              {editingSection === 'workExperienceItem' && 'Edit Work Experience'}
              {editingSection === 'awards' && 'Manage Awards & Certificates'}
              {editingSection === 'awardItem' && 'Edit Award/Certificate'}
              {editingSection === 'activities' && 'Manage Activities'}
              {editingSection === 'activitiesItem' && 'Edit Activity'}
              {editingSection === 'additional' && 'Edit Additional Information'}
            </DialogTitle>
            <DialogDescription>
              Make changes to your resume information below.
            </DialogDescription>
          </DialogHeader>

          {/* Resume Name Section */}
          {editingSection === 'resumeName' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resumeName">Resume Name</Label>
                <Input 
                  id="resumeName"
                  name="resumeName"
                  value={resumeData.resumeName}
                  onChange={handleInputChange}
                  placeholder="Resume for XYZ Company"
                />
                <p className="text-sm text-muted-foreground">This name will be shown in your list of resumes.</p>
              </div>
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button>Save Changes</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Personal Information Section */}
          {editingSection === 'personal' && (
            <div className="space-y-4">
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
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button>Save Changes</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Education Management Section */}
          {editingSection === 'education' && (
            <div className="space-y-4">
              {resumeData.educationItems.map((edu, index) => (
                <div key={edu.id} className="flex justify-between items-center border p-3 rounded-md">
                  <div>
                    <p className="font-medium">{edu.institution || "Institution"}</p>
                    <p className="text-sm text-gray-500">{edu.dates || "Dates"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEducationIndex(index);
                        setEditingSection('educationItem');
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      disabled={resumeData.educationItems.length <= 1}
                      onClick={() => removeEducationItem(edu.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                onClick={addEducationItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Education
              </Button>
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Done</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Education Item Edit Section */}
          {editingSection === 'educationItem' && editingEducationIndex >= 0 && editingEducationIndex < resumeData.educationItems.length && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input 
                  id="institution"
                  value={resumeData.educationItems[editingEducationIndex].institution}
                  onChange={(e) => handleEducationChange(resumeData.educationItems[editingEducationIndex].id, 'institution', e.target.value)}
                  placeholder="Harvard University"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dates">Dates</Label>
                <Input 
                  id="dates"
                  value={resumeData.educationItems[editingEducationIndex].dates}
                  onChange={(e) => handleEducationChange(resumeData.educationItems[editingEducationIndex].id, 'dates', e.target.value)}
                  placeholder="Sep 2018 - Jun 2022"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications (one per line)</Label>
                <Textarea 
                  id="qualifications"
                  rows={4}
                  value={resumeData.educationItems[editingEducationIndex].qualifications}
                  onChange={(e) => handleEducationChange(resumeData.educationItems[editingEducationIndex].id, 'qualifications', e.target.value)}
                  placeholder="Bachelor of Science in Computer Science&#10;GPA: 3.8/4.0&#10;Relevant Coursework: Data Structures, Algorithms"
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button>Save Changes</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Work Experience Management Section */}
          {editingSection === 'workExperience' && (
            <div className="space-y-4">
              {resumeData.workExperience.map((work, index) => (
                <div key={work.id} className="flex justify-between items-center border p-3 rounded-md">
                  <div>
                    <p className="font-medium">{work.role || "Untitled Role"}</p>
                    <p className="text-sm text-gray-500">{work.organization || "Organization"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingWorkIndex(index);
                        setEditingSection('workExperienceItem');
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      disabled={resumeData.workExperience.length <= 1}
                      onClick={() => removeWorkExperience(work.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                onClick={addWorkExperience}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Work Experience
              </Button>
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Done</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Work Experience Item Edit Section */}
          {editingSection === 'workExperienceItem' && editingWorkIndex >= 0 && editingWorkIndex < resumeData.workExperience.length && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`role`}>Role/Position</Label>
                  <Input 
                    id={`role`}
                    value={resumeData.workExperience[editingWorkIndex].role}
                    onChange={(e) => handleWorkExperienceChange(resumeData.workExperience[editingWorkIndex].id, 'role', e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`organization`}>Organization/Company</Label>
                  <Input 
                    id={`organization`}
                    value={resumeData.workExperience[editingWorkIndex].organization}
                    onChange={(e) => handleWorkExperienceChange(resumeData.workExperience[editingWorkIndex].id, 'organization', e.target.value)}
                    placeholder="Google Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`dates`}>Dates</Label>
                  <Input 
                    id={`dates`}
                    value={resumeData.workExperience[editingWorkIndex].dates}
                    onChange={(e) => handleWorkExperienceChange(resumeData.workExperience[editingWorkIndex].id, 'dates', e.target.value)}
                    placeholder="Jul 2022 - Present"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`description`}>Description (one achievement per line)</Label>
                <Textarea 
                  id={`description`}
                  value={resumeData.workExperience[editingWorkIndex].description}
                  onChange={(e) => handleWorkExperienceChange(resumeData.workExperience[editingWorkIndex].id, 'description', e.target.value)}
                  placeholder="Developed a new feature that increased user engagement by 30%&#10;Led a team of 5 engineers to deliver project ahead of schedule&#10;Optimized database queries resulting in 25% faster load times"
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Save Changes</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Awards Management Section */}
          {editingSection === 'awards' && (
            <div className="space-y-4">
              {resumeData.awards.map((award, index) => (
                <div key={award.id} className="flex justify-between items-center border p-3 rounded-md">
                  <div>
                    <p className="font-medium">{award.title || "Award Title"}</p>
                    <p className="text-sm text-gray-500">{award.date || "Date"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAwardIndex(index);
                        setEditingSection('awardItem');
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      disabled={resumeData.awards.length <= 1}
                      onClick={() => removeAward(award.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                onClick={addAward}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Award/Certificate
              </Button>
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Done</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Award Item Edit Section */}
          {editingSection === 'awardItem' && editingAwardIndex >= 0 && editingAwardIndex < resumeData.awards.length && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="awardTitle">Award/Certificate Title</Label>
                <Input 
                  id="awardTitle"
                  value={resumeData.awards[editingAwardIndex].title}
                  onChange={(e) => handleAwardChange(resumeData.awards[editingAwardIndex].id, 'title', e.target.value)}
                  placeholder="AWS Certified Solutions Architect"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="awardDate">Date Received</Label>
                <Input 
                  id="awardDate"
                  value={resumeData.awards[editingAwardIndex].date}
                  onChange={(e) => handleAwardChange(resumeData.awards[editingAwardIndex].id, 'date', e.target.value)}
                  placeholder="June 2022"
                />
              </div>
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Save Changes</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Activities Management Section */}
          {editingSection === 'activities' && (
            <div className="space-y-4">
              {resumeData.activities.map((activity, index) => (
                <div key={activity.id} className="flex justify-between items-center border p-3 rounded-md">
                  <div>
                    <p className="font-medium">{activity.role || "Untitled Role"}</p>
                    <p className="text-sm text-gray-500">{activity.organization || "Organization"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingActivityIndex(index);
                        setEditingSection('activitiesItem');
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      disabled={resumeData.activities.length <= 1}
                      onClick={() => removeActivity(activity.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                onClick={addActivity}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Activity
              </Button>
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Done</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Activity Item Edit Section */}
          {editingSection === 'activitiesItem' && editingActivityIndex >= 0 && editingActivityIndex < resumeData.activities.length && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`role`}>Role/Position</Label>
                  <Input 
                    id={`role`}
                    value={resumeData.activities[editingActivityIndex].role}
                    onChange={(e) => handleActivityChange(resumeData.activities[editingActivityIndex].id, 'role', e.target.value)}
                    placeholder="Volunteer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`organization`}>Organization</Label>
                  <Input 
                    id={`organization`}
                    value={resumeData.activities[editingActivityIndex].organization}
                    onChange={(e) => handleActivityChange(resumeData.activities[editingActivityIndex].id, 'organization', e.target.value)}
                    placeholder="Red Cross"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`dates`}>Dates</Label>
                  <Input 
                    id={`dates`}
                    value={resumeData.activities[editingActivityIndex].dates}
                    onChange={(e) => handleActivityChange(resumeData.activities[editingActivityIndex].id, 'dates', e.target.value)}
                    placeholder="Jan 2021 - Dec 2021"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`description`}>Description (one point per line)</Label>
                <Textarea 
                  id={`description`}
                  value={resumeData.activities[editingActivityIndex].description}
                  onChange={(e) => handleActivityChange(resumeData.activities[editingActivityIndex].id, 'description', e.target.value)}
                  placeholder="Organized fundraising events that raised $10,000&#10;Coordinated a team of 20 volunteers&#10;Managed social media campaign with 50,000+ impressions"
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Save Changes</Button>
                </DialogClose>
              </div>
            </div>
          )}

          {/* Additional Information Section */}
          {editingSection === 'additional' && (
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
              <div className="flex justify-end pt-4">
                <DialogClose asChild>
                  <Button>Save Changes</Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/resumebuilder')} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">
          {isPdfUpload ? "Edit PDF Resume" : "Basic Resume Builder"}
        </h1>
        <div className="flex gap-2">
          {!viewMode && (
            <Button onClick={saveResume} disabled={isLoading} className="flex items-center">
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          )}
          <Button variant="outline" onClick={downloadPDF} disabled={isLoading} className="flex items-center">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>
      
      {/* Full-width resume preview with clickable sections */}
      <div className="max-w-4xl mx-auto">
        <Card className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-gray-200' : 'bg-white'}`}>
          <CardContent className="p-0">
            <div 
              className={`border rounded-md p-8 ${isCurrentlyDark ? 'border-gray-700 bg-gray-900' : 'bg-white'}`} 
              style={{ minHeight: "1120px", margin: "0 auto" }}
            >
              {/* Resume Name Button */}
              <div className="mb-4 text-right">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog('resumeName')}
                  className={`${isCurrentlyDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} flex items-center`}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {resumeData.resumeName}
                </Button>
              </div>
            
              {/* Header - Personal Information Section */}
              <div 
                className={`text-center mb-6 p-4 rounded-md ${!viewMode && 'cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800'}`}
                onClick={() => openEditDialog('personal')}
              >
                <h1 className="text-2xl font-bold uppercase" style={{ color: "#2e6b8f" }}>
                  {resumeData.name || "FULL NAME"}
                </h1>
                <p className="text-sm mt-1" style={{ color: "#2e6b8f" }}>
                  {[resumeData.phone, resumeData.email, resumeData.nationality].filter(Boolean).join(" | ") || "Phone | Email | Nationality"}
                </p>
                {!viewMode && <div className="mt-2 text-xs text-blue-500">(Click to edit personal information)</div>}
              </div>
              
              {/* Education Section */}
              <div 
                className={`mb-6 p-4 rounded-md ${!viewMode && 'cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800'}`}
                onClick={() => openEditDialog('education')}
              >
                <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                  Education
                </h2>
                {resumeData.educationItems.map((edu, index) => (
                  <div key={edu.id} className="ml-2 mb-4">
                    <div className="flex justify-between items-start">
                      <span className="font-bold" style={{ color: "#2e6b8f" }}>{edu.institution || "Institution"}</span>
                      <span className="italic" style={{ color: "#2e6b8f" }}>{edu.dates || "Dates"}</span>
                    </div>
                    <ul className="list-disc ml-5 mt-2 text-sm">
                      {edu.qualifications ? 
                        edu.qualifications.split("\n").filter(Boolean).map((qual, idx) => (
                          <li key={idx}>{qual}</li>
                        )) : 
                        <li>Qualifications will appear here</li>
                      }
                    </ul>
                  </div>
                ))}
                {!viewMode && <div className="mt-2 text-xs text-blue-500">(Click to manage education entries)</div>}
              </div>
              
              {/* Work Experience Section */}
              <div 
                className={`mb-6 p-4 rounded-md ${!viewMode && 'cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800'}`}
                onClick={() => openEditDialog('workExperience')}
              >
                <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                  Work Experience
                </h2>
                {resumeData.workExperience.map((work, index) => (
                  <div 
                    key={work.id} 
                    className={`ml-2 mb-4 p-2 rounded ${!viewMode && 'hover:bg-gray-200 hover:dark:bg-gray-700'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!viewMode) {
                        setEditingWorkIndex(index);
                        setEditingSection('workExperienceItem');
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold" style={{ color: "#2e6b8f" }}>{work.role || "Role/Position"}</span>
                      <span className="italic" style={{ color: "#2e6b8f" }}>{work.dates || "Dates"}</span>
                    </div>
                    <div className="font-bold text-sm" style={{ color: "#2e6b8f" }}>{work.organization || "Organization/Company"}</div>
                    <ul className="list-disc ml-5 mt-1 text-sm">
                      {work.description ? 
                        work.description.split("\n").filter(Boolean).map((desc, i) => (
                          <li key={i}>{desc}</li>
                        )) : 
                        <li>Description will appear here</li>
                      }
                    </ul>
                    {!viewMode && <div className="mt-1 text-xs text-blue-500">(Click to edit this work experience)</div>}
                  </div>
                ))}
                {!viewMode && <div className="mt-2 text-xs text-blue-500">(Click to manage work experience entries)</div>}
              </div>
              
              {/* Awards & Certificates Section */}
              <div 
                className={`mb-6 p-4 rounded-md ${!viewMode && 'cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800'}`}
                onClick={() => openEditDialog('awards')}
              >
                <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                  Awards & Certificates
                </h2>
                <ul className="list-disc ml-7 text-sm">
                  {resumeData.awards.map((award, index) => (
                    <li key={award.id}>
                      {award.title || "Award Title"} {award.date ? `(${award.date})` : ""}
                    </li>
                  ))}
                  {resumeData.awards.length === 0 && <li>Awards will appear here</li>}
                </ul>
                {!viewMode && <div className="mt-2 text-xs text-blue-500">(Click to manage awards and certificates)</div>}
              </div>
              
              {/* Extra-Curricular Activities Section */}
              <div 
                className={`mb-6 p-4 rounded-md ${!viewMode && 'cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800'}`}
                onClick={() => openEditDialog('activities')}
              >
                <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                  Extra-Curricular Activities
                </h2>
                {resumeData.activities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className={`ml-2 mb-4 p-2 rounded ${!viewMode && 'hover:bg-gray-200 hover:dark:bg-gray-700'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!viewMode) {
                        setEditingActivityIndex(index);
                        setEditingSection('activitiesItem');
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold" style={{ color: "#2e6b8f" }}>{activity.role || "Role/Position"}</span>
                      <span className="italic" style={{ color: "#2e6b8f" }}>{activity.dates || "Dates"}</span>
                    </div>
                    <div className="font-bold text-sm" style={{ color: "#2e6b8f" }}>{activity.organization || "Organization"}</div>
                    <ul className="list-disc ml-5 mt-1 text-sm">
                      {activity.description ? 
                        activity.description.split("\n").filter(Boolean).map((desc, i) => (
                          <li key={i}>{desc}</li>
                        )) : 
                        <li>Description will appear here</li>
                      }
                    </ul>
                    {!viewMode && <div className="mt-1 text-xs text-blue-500">(Click to edit this activity)</div>}
                  </div>
                ))}
                {!viewMode && <div className="mt-2 text-xs text-blue-500">(Click to manage activities)</div>}
              </div>
              
              {/* Additional Information Section */}
              <div 
                className={`p-4 rounded-md ${!viewMode && 'cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800'}`}
                onClick={() => openEditDialog('additional')}
              >
                <h2 className="text-lg font-bold uppercase mb-2 pb-1 border-b-2" style={{ color: "#2e6b8f", borderColor: "#2e6b8f" }}>
                  Additional Information
                </h2>
                <div className="ml-2 space-y-3 text-sm">
                  {resumeData.languages && (
                    <div>
                      <span className="font-bold" style={{ color: "#2e6b8f" }}>Languages: </span>
                      {resumeData.languages}
                    </div>
                  )}
                  {resumeData.interests && (
                    <div>
                      <span className="font-bold" style={{ color: "#2e6b8f" }}>Interests: </span>
                      {resumeData.interests}
                    </div>
                  )}
                  {resumeData.itSkills && (
                    <div>
                      <span className="font-bold" style={{ color: "#2e6b8f" }}>IT Skills: </span>
                      {resumeData.itSkills}
                    </div>
                  )}
                  {!resumeData.languages && !resumeData.interests && !resumeData.itSkills && (
                    <p>Additional information will appear here</p>
                  )}
                </div>
                {!viewMode && <div className="mt-2 text-xs text-blue-500">(Click to edit additional information)</div>}
              </div>
              
              {/* Footer */}
              <div className="mt-16 text-center text-xs text-gray-500">
                Created with Adviseek © 2025
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Render the edit dialog */}
      {renderEditDialog()}
    </div>
  );
};

export default BasicResume;
