
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  schoolAndCourse: z.string().min(5, { message: "Please provide your school and course" }),
  achievements: z.string().min(10, { message: "Please share at least one achievement" }),
  aboutYourself: z.string().min(20, { message: "Please write at least 20 characters about yourself" }),
  enthusiasm: z.number().min(1).max(100)
});

type FormValues = z.infer<typeof formSchema>;

interface ConsultantApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ConsultantApplicationForm({ isOpen, onClose, userId }: ConsultantApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>(userId);
  
  // Get the actual user ID if a placeholder was passed
  useEffect(() => {
    const getUserId = async () => {
      if (userId === "placeholder") {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.id) {
          setCurrentUserId(data.session.user.id);
        }
      }
    };
    
    getUserId();
  }, [userId]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolAndCourse: '',
      achievements: '',
      aboutYourself: '',
      enthusiasm: 75
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    try {
      // Call the Supabase Edge Function to save the application
      const { data, error } = await supabase.functions.invoke('save-consultant-application', {
        body: {
          userId: currentUserId,
          ...values
        }
      });
      
      if (error) throw error;
      
      toast.success("Application submitted successfully!");
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Become a Consultant</DialogTitle>
          <DialogDescription>
            Share your experience to help other students succeed in their university applications.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="schoolAndCourse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What school and course are you taking now?</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Harvard University, Computer Science" {...field} />
                  </FormControl>
                  <FormDescription>
                    Please provide your current university and programme
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="achievements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Any achievements you made in university?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="E.g., Dean's List, Research Publication, Hackathon Winner..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    List academic and extracurricular achievements that showcase your experience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="aboutYourself"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you want potential mentees to know about you?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your experience, expertise, and how you can help others..." 
                      className="min-h-[150px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This will be visible to students looking for consultants
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enthusiasm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How much do you want it?</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>I'm somewhat interested</span>
                        <span className="font-medium">{field.value}%</span>
                        <span>I'm extremely interested!</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    We tend to prioritize consultants who are more enthusiastic
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
