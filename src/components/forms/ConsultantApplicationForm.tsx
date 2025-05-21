
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ConsultantApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const ConsultantApplicationForm = ({ isOpen, onClose, userId }: ConsultantApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    schoolCourse: '',
    achievements: '',
    about: '',
    enthusiasmLevel: 50
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.schoolCourse.trim() || !formData.about.trim()) {
      toast.error("Please complete all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the edge function to save the application
      const { error } = await supabase.functions.invoke('save-consultant-application', {
        body: {
          userId,
          schoolCourse: formData.schoolCourse,
          achievements: formData.achievements,
          about: formData.about,
          enthusiasmLevel: formData.enthusiasmLevel
        }
      });
      
      if (error) throw error;
      
      toast.success("Application submitted successfully!");
      onClose();
      
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to be a Consultant</DialogTitle>
          <DialogDescription>
            Share your expertise and experience to help other students while earning money.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="schoolCourse" className="text-right">
              School and Course <span className="text-red-500">*</span>
            </Label>
            <Input
              id="schoolCourse"
              placeholder="e.g. NUS Computer Science"
              value={formData.schoolCourse}
              onChange={(e) => handleInputChange('schoolCourse', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="achievements">
              Notable Achievements
            </Label>
            <Textarea
              id="achievements"
              placeholder="List any notable achievements, awards, or extracurriculars"
              value={formData.achievements}
              onChange={(e) => handleInputChange('achievements', e.target.value)}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="about" className="text-right">
              Why do you want to be a consultant? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="about"
              placeholder="Tell us why you want to be a consultant and how you can help other students"
              value={formData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              rows={3}
              required
            />
          </div>
          
          <div>
            <Label>Your enthusiasm level for helping others (0-100)</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Slider
                value={[formData.enthusiasmLevel]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) => handleInputChange('enthusiasmLevel', values[0])}
                className="flex-1"
              />
              <span className="w-12 text-center">{formData.enthusiasmLevel}</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
