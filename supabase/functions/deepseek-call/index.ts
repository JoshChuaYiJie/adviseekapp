
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestData {
  prompt: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
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
    
    // Create a Supabase client with the auth context of the logged-in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // Get the user ID from the authenticated request
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error("Not authorized");
    }

    // Get the encrypted API key
    const { data: keyData, error: keyError } = await supabaseClient
      .from("api_keys")
      .select("encrypted_key, iv")
      .eq("user_id", user.id)
      .eq("key_type", "deepseek")
      .limit(1);
      
    if (keyError) {
      console.error("Database error:", keyError);
      throw new Error("Error retrieving API key");
    }
    
    if (!keyData || keyData.length === 0) {
      console.log("No API key found for user:", user.id);
      // Try to use the project-wide Deepseek API key
      const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
      if (!apiKey) {
        throw new Error("No Deepseek API key available");
      }
      
      // Call the Deepseek API with the project-wide key
      return await callDeepseekAPI(apiKey, prompt, options, corsHeaders);
    }
    
    // Decrypt the user's API key
    try {
      const { encrypted_key, iv } = keyData[0];
      const encryptedBytes = Uint8Array.from(atob(encrypted_key), c => c.charCodeAt(0));
      const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
      
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      const keyMaterial = encoder.encode(Deno.env.get("ENCRYPTION_KEY") || "default_encryption_key");
      
      const key = await crypto.subtle.importKey(
        "raw",
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        encryptedBytes
      );
      
      const apiKey = decoder.decode(decryptedBuffer);
      
      // Call the Deepseek API with the user's key
      return await callDeepseekAPI(apiKey, prompt, options, corsHeaders);
    } catch (decryptError) {
      console.error("Decryption error:", decryptError);
      
      // Fallback to project-wide API key if decryption fails
      const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
      if (!apiKey) {
        throw new Error("Failed to decrypt user API key and no fallback key available");
      }
      
      // Call the Deepseek API with the project-wide key
      return await callDeepseekAPI(apiKey, prompt, options, corsHeaders);
    }
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
      top_p: options.topP || 0.95
    })
  });
  
  if (!deepseekResponse.ok) {
    const errorText = await deepseekResponse.text();
    console.error(`Deepseek API error: ${deepseekResponse.status} ${errorText}`);
    throw new Error(`Deepseek API error: ${deepseekResponse.status} ${errorText}`);
  }
  
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
}
