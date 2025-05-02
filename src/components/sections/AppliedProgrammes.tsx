
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
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
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();

  // Load university data when university changes
  useEffect(() => {
    if (!selectedUniversity) {
      setUniversityData(null);
      setAvailableDegrees([]);
      return;
    }

    const loadData = async () => {
      const data = await loadUniversityData(selectedUniversity);
      setUniversityData(data);
      
      if (data) {
        const degrees = getDegrees(data);
        setAvailableDegrees(degrees);
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
    setSelectedUniversity(value);
    setSelectedDegree("");
    setSelectedMajor("");
  };

  const handleDegreeChange = (value: string) => {
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
    setSelectedUniversity("");
    setSelectedDegree("");
    setSelectedMajor("");
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className={`space-y-4 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <Select value={selectedUniversity} onValueChange={handleUniversityChange}>
          <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
            <SelectValue placeholder={t("university.select", "Select a university")} />
          </SelectTrigger>
          <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
            <SelectItem value="National University of Singapore">{t("university.nus", "NUS")}</SelectItem>
            <SelectItem value="Nanyang Technological University">{t("university.ntu", "NTU")}</SelectItem>
            <SelectItem value="Singapore Management University">{t("university.smu", "SMU")}</SelectItem>
          </SelectContent>
        </Select>
        
        {selectedUniversity && (
          <Select value={selectedDegree} onValueChange={handleDegreeChange}>
            <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
              <SelectValue placeholder={t("degree.select", "Select a degree")} />
            </SelectTrigger>
            <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
              {availableDegrees.map((degree) => (
                <SelectItem key={degree} value={degree}>
                  {degree}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {selectedDegree && (
          <Select value={selectedMajor} onValueChange={handleMajorChange}>
            <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
              <SelectValue placeholder={t("major.select", "Select a major")} />
            </SelectTrigger>
            <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
              {availableMajors.map((major) => (
                <SelectItem key={major.major} value={major.major}>
                  {major.major} {major.college ? `(${major.college})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Button 
          onClick={handleAddUniversity}
          disabled={!selectedUniversity || !selectedDegree || !selectedMajor}
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
