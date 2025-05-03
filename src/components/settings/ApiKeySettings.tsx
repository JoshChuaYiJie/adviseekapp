
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Key } from "lucide-react";

export const ApiKeySettings = () => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const checkKeyExists = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-deepseek-key', {
        method: 'GET',
      });
      
      if (data && data.exists) {
        setApiKey('••••••••••••••••••••••••••••••');
      }
    } catch (err) {
      console.error('Error checking if key exists:', err);
    }
  };

  useEffect(() => {
    checkKeyExists();
  }, []);

  const handleSaveKey = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('set-deepseek-key', {
        method: 'POST',
        body: { key: apiKey },
      });
      
      if (error) throw error;
      
      toast.success('API key saved successfully');
      setApiKey('••••••••••••••••••••••••••••••');
    } catch (err) {
      console.error('Error saving API key:', err);
      toast.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    setTestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepseek-call', {
        method: 'POST',
        body: { prompt: 'Hello, this is a test message. Please respond with a short greeting.' },
      });
      
      if (error || data.error) throw new Error(error?.message || data?.error || 'Test failed');
      
      toast.success('API key is working correctly');
    } catch (err) {
      console.error('Error testing API key:', err);
      toast.error('API key test failed');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Deepseek API Key
        </CardTitle>
        <CardDescription>
          Configure your Deepseek API key to enable AI-powered features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your Deepseek API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your API key is stored securely and never exposed to the frontend
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveKey} disabled={loading}>
            {loading ? 'Saving...' : 'Save Key'}
          </Button>
          {apiKey === '••••••••••••••••••••••••••••••' && (
            <Button variant="outline" onClick={handleTestKey} disabled={testLoading}>
              {testLoading ? 'Testing...' : 'Test Connection'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
