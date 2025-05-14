
// Resume template data for the different resume templates

export interface TemplateSection {
  id: string;
  name: string;
  placeholder: string;
}

export interface ResumeTemplate {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  color: string;
  path: string;
  templateData: {
    sections: TemplateSection[];
  };
}

export const resumeTemplates: ResumeTemplate[] = [
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
