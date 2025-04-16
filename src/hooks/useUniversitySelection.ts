
import { useState, useEffect } from "react";
import { universities, University, School } from "@/data/universitiesData";
import { useToast } from "@/hooks/use-toast";

export const useUniversitySelection = () => {
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const { toast } = useToast();

  // Set default university and school on component mount
  useEffect(() => {
    if (universities.length > 0) {
      const defaultUniversity = universities[0];
      setSelectedUniversity(defaultUniversity);
      
      if (defaultUniversity.schools.length > 0) {
        setSelectedSchool(defaultUniversity.schools[0]);
      }
    }
  }, []);

  const handleUniversityChange = (universityId: string) => {
    const university = universities.find((uni) => uni.id === universityId) || null;
    setSelectedUniversity(university);
    
    // Reset school selection when university changes
    if (university && university.schools.length > 0) {
      setSelectedSchool(university.schools[0]);
    } else {
      setSelectedSchool(null);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    if (!selectedUniversity) return;
    
    const school = selectedUniversity.schools.find((sch) => sch.id === schoolId) || null;
    setSelectedSchool(school);
  };

  const handleHelpMePick = () => {
    toast({
      title: "Coming Soon",
      description: "The feature to help you pick is coming soon!",
      duration: 3000,
    });
  };

  return {
    universities,
    selectedUniversity,
    selectedSchool,
    handleUniversityChange,
    handleSchoolChange,
    handleHelpMePick,
  };
};
