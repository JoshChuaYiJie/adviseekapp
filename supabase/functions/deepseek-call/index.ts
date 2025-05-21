
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestData {
  prompt: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stream?: boolean;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, options = {} } = await req.json() as RequestData;
    
    // Get the project-wide Deepseek API key
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    
    if (!apiKey) {
      throw new Error("No Deepseek API key available");
    }
    
    console.log("Using project-wide Deepseek API key");
    
    // Call the Deepseek API with the project-wide key
    return await callDeepseekAPI(apiKey, prompt, options, corsHeaders);
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

async function callDeepseekAPI(apiKey: string, prompt: string, options: any, corsHeaders: any) {
  console.log("Calling Deepseek API...");
  
  const requestBody = {
    model: "deepseek-chat", 
    messages: [
      { role: "system", content: "You are a helpful AI assistant for academic and career guidance." },
      { role: "user", content: prompt }
    ],
    max_tokens: options.maxTokens || 1000,
    temperature: options.temperature || 0.7,
    top_p: options.topP || 0.95,
    stream: options.stream || false
  };

  console.log("Request body:", JSON.stringify(requestBody));

  try {
    const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error(`Deepseek API error: ${deepseekResponse.status} ${errorText}`);
      throw new Error(`Deepseek API error: ${deepseekResponse.status} ${errorText}`);
    }
    
    // Handle streaming response
    if (options.stream) {
      // For streaming, we need to return the text content directly
      // rather than trying to return a ReadableStream
      const streamText = await deepseekResponse.text();
      
      // Return the stream content as plain text with appropriate headers
      const headers = new Headers(corsHeaders);
      headers.set("Content-Type", "text/plain");
      
      return new Response(streamText, { headers });
    }
    
    // Handle non-streaming response
    const deepseekData = await deepseekResponse.json();
    return new Response(
      JSON.stringify(deepseekData),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error calling Deepseek API:", error.message);
    throw new Error(`Error calling Deepseek API: ${error.message}`);
  }
}
