
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";

interface ConsultantApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const ConsultantApplicationForm = ({ isOpen, onClose, userId }: ConsultantApplicationFormProps) => {
  const { isCurrentlyDark } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    schoolAndCourse: "",
    achievements: "",
    aboutYourself: "",
    enthusiasm: 75, // Default value
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSliderChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, enthusiasm: value[0] }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      const actualUserId = session?.user?.id || userId;
      
      if (!actualUserId) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to submit an application",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('save-consultant-application', {
        body: {
          userId: actualUserId,
          schoolAndCourse: formData.schoolAndCourse,
          achievements: formData.achievements,
          aboutYourself: formData.aboutYourself,
          enthusiasm: formData.enthusiasm
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to submit application');
      }
      
      toast({
        title: "Application Submitted",
        description: "Thank you for your application. We'll review it and get back to you soon.",
      });
      
      // Reset form and close dialog
      setFormData({
        schoolAndCourse: "",
        achievements: "",
        aboutYourself: "",
        enthusiasm: 75,
      });
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[600px] ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle>Consultant Application</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolAndCourse">Current School and Course</Label>
            <Input
              id="schoolAndCourse"
              name="schoolAndCourse"
              required
              value={formData.schoolAndCourse}
              onChange={handleChange}
              className={isCurrentlyDark ? 'bg-gray-700 border-gray-600' : ''}
              placeholder="e.g., NUS Computer Science, Year 3"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="achievements">Academic Achievements and Extracurricular Activities</Label>
            <Textarea
              id="achievements"
              name="achievements"
              required
              value={formData.achievements}
              onChange={handleChange}
              className={`min-h-[100px] ${isCurrentlyDark ? 'bg-gray-700 border-gray-600' : ''}`}
              placeholder="List your key achievements, awards, leadership positions, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aboutYourself">Tell Us About Yourself</Label>
            <Textarea
              id="aboutYourself"
              name="aboutYourself"
              required
              value={formData.aboutYourself}
              onChange={handleChange}
              className={`min-h-[120px] ${isCurrentlyDark ? 'bg-gray-700 border-gray-600' : ''}`}
              placeholder="What makes you a good mentor? What experience can you share with other students?"
            />
          </div>
          
          <div className="space-y-2">
            <Label>How enthusiastic are you about helping other students? ({formData.enthusiasm}%)</Label>
            <Slider
              defaultValue={[75]}
              max={100}
              step={1}
              value={[formData.enthusiasm]}
              onValueChange={handleSliderChange}
              className="py-4"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
