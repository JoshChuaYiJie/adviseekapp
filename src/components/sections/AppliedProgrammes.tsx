
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  loadUniversityData, 
  getDegrees, 
  getMajorsForDegree, 
  getUniversityShortName,
  UniversityData,
  Major
} from "@/utils/universityDataUtils";

interface Programme {
  id?: string;
  logo: string;
  school: string;
  course: string;
  degree?: string;
  major?: string;
  college?: string;
  extras?: string;
}

export const AppliedProgrammes = () => {
  const navigate = useNavigate();
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedProgrammes, setAppliedProgrammes] = useState<Programme[]>([]);
  const [universityData, setUniversityData] = useState<UniversityData | null>(null);
  const [availableDegrees, setAvailableDegrees] = useState<string[]>([]);
  const [availableMajors, setAvailableMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();

  // Load saved programs when component mounts
  useEffect(() => {
    loadSavedPrograms();
  }, []);

  // Load university data when university changes
  useEffect(() => {
    if (!selectedUniversity) {
      setUniversityData(null);
      setAvailableDegrees([]);
      setError(null);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Loading university data for: ${selectedUniversity}`);
        const data = await loadUniversityData(selectedUniversity);
        setUniversityData(data);
        
        if (data && data.programs && data.programs.length > 0) {
          console.log(`Data loaded successfully with ${data.programs.length} programs`);
          const degrees = getDegrees(data);
          setAvailableDegrees(degrees);
          console.log(`${degrees.length} degrees found:`, degrees);
        } else {
          setError("No programs found in the data");
          toast.error("No programs found for this university");
        }
      } catch (error) {
        console.error("Error loading university data:", error);
        setError("Failed to load university data");
        toast.error("Failed to load university data. Please check if the data files exist.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedUniversity]);

  // Update available majors when degree changes
  useEffect(() => {
    if (!universityData || !selectedDegree) {
      setAvailableMajors([]);
      return;
    }

    const majors = getMajorsForDegree(universityData, selectedDegree);
    setAvailableMajors(majors);
    console.log(`Found ${majors.length} majors for ${selectedDegree}:`, majors);
  }, [universityData, selectedDegree]);

  // Reset selections when dependencies change
  useEffect(() => {
    if (!selectedUniversity) {
      setSelectedDegree("");
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (!selectedDegree) {
      setSelectedMajor("");
    }
  }, [selectedDegree]);

  const loadSavedPrograms = async () => {
    try {
      setIsLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.log("No authenticated user found. Skipping program loading.");
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('applied_programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error loading saved programs:", error);
        toast.error("Failed to load your saved programs");
        setIsLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        console.log("Loaded saved programs:", data);
        const formattedPrograms = data.map(program => ({
          id: program.id,
          logo: program.logo_path || `/school-logos/${program.school}.png`,
          school: program.school,
          course: program.major,
          degree: program.degree,
          major: program.major,
          college: program.college,
          extras: program.extras
        }));
        
        setAppliedProgrammes(formattedPrograms);
        toast.success(`Loaded ${formattedPrograms.length} saved programs`);
      }
    } catch (error) {
      console.error("Error in loadSavedPrograms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUniversityChange = (value: string) => {
    console.log(`University selected: ${value}`);
    setSelectedUniversity(value);
    setSelectedDegree("");
    setSelectedMajor("");
  };

  const handleDegreeChange = (value: string) => {
    console.log(`Degree selected: ${value}`);
    setSelectedDegree(value);
    setSelectedMajor("");
  };

  const handleMajorChange = (value: string) => {
    setSelectedMajor(value);
  };

  const handleAddUniversity = async () => {
    if (!selectedUniversity || !selectedDegree || !selectedMajor) return;
    
    try {
      setIsSaving(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        toast.error("You must be signed in to add programs");
        setIsSaving(false);
        return;
      }
      
      const shortName = getUniversityShortName(selectedUniversity);
      const selectedMajorObj = availableMajors.find(m => m.major === selectedMajor);
      const extraInfo = `${selectedDegree} - ${selectedMajorObj?.college || ''}`;
      
      const newProgramData = {
        user_id: session.session.user.id,
        university: selectedUniversity,
        school: shortName,
        major: selectedMajor,
        degree: selectedDegree,
        college: selectedMajorObj?.college || null,
        extras: extraInfo,
        logo_path: `/school-logos/${shortName}.png`
      };
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('applied_programs')
        .insert(newProgramData)
        .select('id')
        .single();
      
      if (error) {
        console.error("Error saving program:", error);
        toast.error("Failed to save program");
        return;
      }
      
      // Update local state
      const newProgramme = {
        id: data.id,
        logo: `/school-logos/${shortName}.png`,
        school: shortName,
        course: selectedMajor,
        degree: selectedDegree,
        major: selectedMajor,
        college: selectedMajorObj?.college,
        extras: extraInfo
      };
      
      setAppliedProgrammes([...appliedProgrammes, newProgramme]);
      toast.success("Program added successfully");
      setSelectedUniversity("");
      setSelectedDegree("");
      setSelectedMajor("");
    } catch (error) {
      console.error("Error adding university:", error);
      toast.error("An error occurred while adding the university");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className={`space-y-4 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <Select value={selectedUniversity} onValueChange={handleUniversityChange} disabled={isLoading || isSaving}>
          <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
            <SelectValue placeholder={t("university.select", "Select a university")} />
          </SelectTrigger>
          <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
            <SelectItem value="National University of Singapore">{t("university.nus", "NUS")}</SelectItem>
            <SelectItem value="Nanyang Technological University">{t("university.ntu", "NTU")}</SelectItem>
            <SelectItem value="Singapore Management University">{t("university.smu", "SMU")}</SelectItem>
          </SelectContent>
        </Select>
        
        {error && (
          <div className="text-red-500 text-sm p-2 rounded bg-red-100 dark:bg-red-900/20">
            {error}. Please check if the data files are in the correct location.
          </div>
        )}
        
        {selectedUniversity && (
          <Select value={selectedDegree} onValueChange={handleDegreeChange} disabled={isLoading || isSaving || !availableDegrees.length}>
            <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
              <SelectValue placeholder={isLoading ? "Loading..." : t("degree.select", "Select a degree")} />
            </SelectTrigger>
            <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
              {availableDegrees.length > 0 ? (
                availableDegrees.map((degree) => (
                  <SelectItem key={degree} value={degree}>
                    {degree}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-degrees" disabled>No degrees found</SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        
        {selectedDegree && (
          <Select value={selectedMajor} onValueChange={handleMajorChange} disabled={isLoading || isSaving || !availableMajors.length}>
            <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
              <SelectValue placeholder={isLoading ? "Loading..." : t("major.select", "Select a major")} />
            </SelectTrigger>
            <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
              {availableMajors.length > 0 ? (
                availableMajors.map((major) => (
                  <SelectItem key={major.major} value={major.major}>
                    {major.major} {major.college ? `(${major.college})` : ''}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-majors" disabled>No majors found</SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        
        <Button 
          onClick={handleAddUniversity}
          disabled={!selectedUniversity || !selectedDegree || !selectedMajor || isLoading || isSaving}
        >
          {isSaving ? "Saving..." : t("university.add", "Add University")}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate("/recommendations")}
          className="ml-4"
          disabled={isLoading || isSaving}
        >
          {t("university.ideal_programme", "What is my ideal programme?")}
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
        </div>
      )}

      {!isLoading && appliedProgrammes.length > 0 && (
        <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("university.university", "University")}</TableHead>
                <TableHead>{t("university.school", "School")}</TableHead>
                <TableHead>{t("university.degree", "Degree")}</TableHead>
                <TableHead>{t("university.major", "Major")}</TableHead>
                <TableHead>{t("university.additional", "Additional Info")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appliedProgrammes.map((prog, idx) => (
                <TableRow key={prog.id || idx}>
                  <TableCell>
                    <img src={prog.logo} alt={prog.school} className="h-12 w-12 object-contain" />
                  </TableCell>
                  <TableCell>{prog.school}</TableCell>
                  <TableCell>{prog.degree || "-"}</TableCell>
                  <TableCell>{prog.course}</TableCell>
                  <TableCell>{prog.extras || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
