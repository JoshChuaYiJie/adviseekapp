
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface Programme {
  logo: string;
  school: string;
  course: string;
  extras?: string;
}

export const AppliedProgrammes = () => {
  const navigate = useNavigate();
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [programme, setProgramme] = useState("");
  const [appliedProgrammes, setAppliedProgrammes] = useState<Programme[]>([]);

  const handleAddUniversity = () => {
    if (!selectedUniversity || !programme) return;
    
    const newProgramme = {
      logo: `/school-logos/${selectedUniversity}.png`,
      school: selectedUniversity,
      course: programme,
    };
    
    setAppliedProgrammes([...appliedProgrammes, newProgramme]);
    setSelectedUniversity("");
    setProgramme("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NUS">NUS</SelectItem>
            <SelectItem value="NTU">NTU</SelectItem>
            <SelectItem value="SMU">SMU</SelectItem>
          </SelectContent>
        </Select>
        
        {selectedUniversity && (
          <input
            type="text"
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            placeholder="Enter programme name"
            className="w-full px-3 py-2 border rounded-md"
          />
        )}
        
        <Button onClick={handleAddUniversity}>Add University</Button>
        <Button 
          variant="outline" 
          onClick={() => navigate("/pickAI")}
          className="ml-4"
        >
          What is my ideal programme?
        </Button>
      </div>

      {appliedProgrammes.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>University</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Additional Info</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appliedProgrammes.map((prog, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <img src={prog.logo} alt={prog.school} className="h-12 w-12 object-contain" />
                </TableCell>
                <TableCell>{prog.school}</TableCell>
                <TableCell>{prog.course}</TableCell>
                <TableCell>{prog.extras || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
