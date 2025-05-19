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

serve(async (req) => {
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
      
    if (keyError || !keyData || keyData.length === 0) {
      throw new Error("API key not found");
    }
    
    // Decrypt the API key
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
    
    // Call the Deepseek API (update endpoint and model as needed)
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
      throw new Error(`Deepseek API error: ${deepseekResponse.status} ${errorText}`);
    }
    
    const deepseekData = await deepseekResponse.json();
    
    return new Response(
      JSON.stringify(deepseekData),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});