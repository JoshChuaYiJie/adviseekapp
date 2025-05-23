import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackFormProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const FeedbackForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !feedback) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Feedback sent successfully!');
      setIsOpen(false);
      setEmail('');
      setFeedback('');
    } catch (error) {
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full shadow-lg z-40"
        size="icon"
        aria-label="Send Feedback"
        data-tutorial="feedback-button"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve Adviseek by sharing your thoughts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                <Mail className="inline-block h-4 w-4 mr-1" />
                Email
              </label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="feedback" className="text-right">
                Feedback
              </label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
