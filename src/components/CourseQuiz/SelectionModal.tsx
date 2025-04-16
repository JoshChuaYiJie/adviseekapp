
import { Button } from "@/components/ui/button";
import { Module } from "@/integrations/supabase/client";
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selections: {module: Module, reason: string}[];
  onStartOver: () => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  selections, 
  onStartOver 
}) => {
  // Calculate total AUs/CUs
  const totalAusCus = selections.reduce((total, item) => total + item.module.aus_cus, 0);
  
  if (!isOpen) return null;
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Your Course Plan</h2>
      
      <p className="text-center text-gray-600 mb-6">
        Here are your selected courses based on your preferences and ratings.
      </p>
      
      <div className="border rounded-lg overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>University</TableHead>
              <TableHead>AUs/CUs</TableHead>
              <TableHead>Semester</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selections.map((selection) => (
              <TableRow key={selection.module.id}>
                <TableCell className="font-medium">{selection.module.course_code}</TableCell>
                <TableCell>{selection.module.title}</TableCell>
                <TableCell>{selection.module.university}</TableCell>
                <TableCell>{selection.module.aus_cus}</TableCell>
                <TableCell>{selection.module.semester}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="font-bold text-right">Total AUs/CUs:</TableCell>
              <TableCell className="font-bold">{totalAusCus}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      <div className="text-center">
        <p className="text-green-600 font-semibold mb-4">
          Course plan saved! You can view it in your profile.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onStartOver}>
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
};
