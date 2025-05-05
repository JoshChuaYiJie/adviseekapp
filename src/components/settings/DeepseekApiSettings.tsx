
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DeepseekApiSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  // Check for existing API key
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        setIsChecking(true);
        const { data, error } = await supabase.functions.invoke('check-deepseek-key');
        
        if (error) {
          throw new Error(error.message);
        }
        
        setHasKey(data?.exists || false);
      } catch (error) {
        console.error("Failed to check for API key:", error);
        toast({
          title: "Error",
          description: "Failed to check for existing API key",
          variant: "destructive",
        });
      } finally {
        setIsChecking(false);
      }
    };
    
    checkApiKey();
  }, [toast]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Missing API Key",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Using Supabase Edge Function to securely store the API key
      const { error } = await supabase.functions.invoke('set-deepseek-key', {
        body: { apiKey },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "API Key Saved",
        description: "Your Deepseek API key has been saved successfully",
      });
      
      setHasKey(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setApiKey("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Deepseek API Integration</h3>
          <p className="text-sm text-muted-foreground">
            Manage your Deepseek API key for integration with our platform.
          </p>
        </div>
        <Button
          variant={hasKey ? "outline" : "default"}
          onClick={() => setIsOpen(true)}
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : hasKey ? "Update API Key" : "Add API Key"}
        </Button>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hasKey ? "Update API Key" : "Add API Key"}</DialogTitle>
            <DialogDescription>
              Enter your Deepseek API key below. This key will be securely stored and used for AI processing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="nvapi-xxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSaveApiKey}
              disabled={isSaving || !apiKey.trim()}
            >
              {isSaving ? "Saving..." : "Save API Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
