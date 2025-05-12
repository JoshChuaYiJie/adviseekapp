
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { 
  loadUniversityData, 
  getDegrees, 
  getMajorsForDegree, 
  getUniversityShortName,
  UniversityData,
  Major
} from "@/utils/universityDataUtils";

interface Programme {
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
  const [error, setError] = useState<string | null>(null);
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();

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
          console.error("No programs found or empty data returned");
          setError("No programs found in the data");
          toast.error("No programs found for this university. Please check if data files are present.");
        }
      } catch (error) {
        console.error("Error loading university data:", error);
        setError("Failed to load university data");
        toast.error("Failed to load university data. Please check the console for more details.");
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

  const handleAddUniversity = () => {
    if (!selectedUniversity || !selectedDegree || !selectedMajor) return;
    
    const shortName = getUniversityShortName(selectedUniversity);
    const selectedMajorObj = availableMajors.find(m => m.major === selectedMajor);
    
    const newProgramme = {
      logo: `/school-logos/${shortName}.png`,
      school: shortName,
      course: selectedMajor,
      degree: selectedDegree,
      major: selectedMajor,
      college: selectedMajorObj?.college,
      extras: `${selectedDegree} - ${selectedMajorObj?.college || ''}`
    };
    
    setAppliedProgrammes([...appliedProgrammes, newProgramme]);
    toast.success("Program added successfully");
    setSelectedUniversity("");
    setSelectedDegree("");
    setSelectedMajor("");
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className={`space-y-4 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <Select value={selectedUniversity} onValueChange={handleUniversityChange} disabled={isLoading}>
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
          <Select value={selectedDegree} onValueChange={handleDegreeChange} disabled={isLoading || !availableDegrees.length}>
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
          <Select value={selectedMajor} onValueChange={handleMajorChange} disabled={isLoading || !availableMajors.length}>
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
          disabled={!selectedUniversity || !selectedDegree || !selectedMajor || isLoading}
        >
          {t("university.add", "Add University")}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate("/pickAI")}
          className="ml-4"
        >
          {t("university.ideal_programme", "What is my ideal programme?")}
        </Button>
      </div>

      {appliedProgrammes.length > 0 && (
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
                <TableRow key={idx}>
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
