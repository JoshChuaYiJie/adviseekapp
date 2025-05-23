
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const FeedbackForm = () => {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter some feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user profile for additional info
      let userName = 'Anonymous User';
      let userEmail = 'No email provided';
      
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          
          userName = profile?.username || user.email || 'Anonymous User';
          userEmail = user.email || 'No email provided';
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
        }
      }

      // Save feedback to user_app_feedback table
      const { error: dbError } = await supabase
        .from('user_app_feedback')
        .insert({
          user_id: user?.id || null,
          type: type,
          feedback: feedback.trim(),
          user_email: userEmail,
          user_name: userName
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save feedback to database');
      }

      // Also send email notification via existing edge function
      const { error: emailError } = await supabase.functions.invoke('send-feedback', {
        body: { feedback: feedback.trim(), type }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't throw here since database save succeeded
      }
      
      toast.success('Thank you for your feedback!');
      setFeedback('');
      setOpen(false);
    } catch (error: any) {
      console.error('Error sending feedback:', error);
      toast.error('Failed to send feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 rounded-full shadow-lg z-40"
          size="icon"
          aria-label="Send feedback"
          data-tutorial="send-feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-lg">Send Feedback</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-8 w-8"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <div className="flex gap-2 mt-1">
              <Button 
                size="sm" 
                variant={type === 'bug' ? 'default' : 'outline'} 
                onClick={() => setType('bug')}
              >
                Bug
              </Button>
              <Button 
                size="sm" 
                variant={type === 'suggestion' ? 'default' : 'outline'} 
                onClick={() => setType('suggestion')}
              >
                Suggestion
              </Button>
              <Button 
                size="sm" 
                variant={type === 'other' ? 'default' : 'outline'} 
                onClick={() => setType('other')}
              >
                Other
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what's on your mind..."
              className="mt-1"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <span className="flex items-center">
                <Send className="mr-2 h-4 w-4" />
                Send Feedback
              </span>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FeedbackForm;
