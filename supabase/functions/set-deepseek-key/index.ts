
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestData {
  apiKey: string;
}

serve(async (req) => {
  try {
    const { apiKey } = await req.json() as RequestData;
    
    if (!apiKey || typeof apiKey !== "string") {
      throw new Error("Invalid API key");
    }
    
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
    
    // Encrypt the API key using Deno crypto
    const encoder = new TextEncoder();
    const keyData = encoder.encode(Deno.env.get("ENCRYPTION_KEY") || "default_encryption_key");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(apiKey)
    );
    
    // Convert encrypted buffer to string for storage
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedBytes));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    
    // Store the encrypted API key
    const { data: existingKey, error: fetchError } = await supabaseClient
      .from("api_keys")
      .select("id")
      .eq("user_id", user.id)
      .eq("key_type", "deepseek")
      .limit(1);
      
    if (fetchError) {
      throw fetchError;
    }

    let result;
    
    if (existingKey?.length > 0) {
      // Update existing key
      result = await supabaseClient
        .from("api_keys")
        .update({
          encrypted_key: encryptedBase64,
          iv: ivBase64,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingKey[0].id);
    } else {
      // Insert new key
      result = await supabaseClient
        .from("api_keys")
        .insert({
          user_id: user.id,
          key_type: "deepseek",
          encrypted_key: encryptedBase64,
          iv: ivBase64
        });
    }
    
    if (result.error) {
      throw result.error;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
