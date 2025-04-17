
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const ApplyNow = () => {
  return (
    <div className="space-y-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick a university" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NUS">NUS</SelectItem>
          <SelectItem value="NTU">NTU</SelectItem>
          <SelectItem value="SMU">SMU</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
