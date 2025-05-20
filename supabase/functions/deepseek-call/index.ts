
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
  
  // Set stream to true by default
  const stream = options.stream !== undefined ? options.stream : true;
  
  const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat", // Update to the correct Deepseek model name if different
      messages: [
        { role: "system", content: "You are a helpful AI assistant for academic and career guidance." },
        { role: "user", content: prompt }
      ],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.95,
      stream: stream
    })
  });
  
  if (!deepseekResponse.ok) {
    const errorText = await deepseekResponse.text();
    console.error(`Deepseek API error: ${deepseekResponse.status} ${errorText}`);
    throw new Error(`Deepseek API error: ${deepseekResponse.status} ${errorText}`);
  }
  
  let responseData;
  
  if (stream) {
    // For streaming responses, we need to handle them differently
    // However, for simplicity in this implementation, we'll collect the entire stream
    // and return it as a complete response
    const reader = deepseekResponse.body?.getReader();
    let result = "";
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        result += chunk;
      }
    }
    
    // Parse the streamed response
    try {
      // This is a simplification - in a real implementation, you'd parse the stream properly
      // For now, just extract the final message content
      const lines = result.split('\n').filter(line => line.trim().startsWith('data:') && line.trim() !== 'data: [DONE]');
      const lastLine = lines[lines.length - 1].replace('data: ', '');
      const parsedData = JSON.parse(lastLine);
      responseData = parsedData;
    } catch (e) {
      console.error("Error parsing streamed response:", e);
      responseData = {
        choices: [{
          message: {
            content: "Error parsing streamed response. Please try again."
          }
        }]
      };
    }
  } else {
    // For non-streaming responses, just parse the JSON directly
    responseData = await deepseekResponse.json();
  }
  
  return new Response(
    JSON.stringify(responseData),
    { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      } 
    }
  );
}
