
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";

export const MyResume = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <p>Drop your resume here or click to upload</p>
        <input type="file" className="hidden" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Don't have an optimized resume? Build one now!</h3>
        <p className="text-sm text-gray-600 mt-1">
          Our proprietary AI model will build one specifically catered to your desired programme
        </p>
        <Button 
          onClick={() => navigate("/resumebuilder")} 
          className="mt-4"
        >
          Build your resume
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Uploaded on</TableHead>
            <TableHead>Applying to</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Add rows when documents are uploaded */}
        </TableBody>
      </Table>
    </div>
  );
};
