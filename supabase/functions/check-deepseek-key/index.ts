
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    [key: string]: any;
  };
  schema: string;
  old_record: null | {
    [key: string]: any;
  };
}

serve(async (req) => {
  try {
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
    
    // Check if an API key exists for this user
    const { data, error } = await supabaseClient
      .from("api_keys")
      .select("id")
      .eq("user_id", user.id)
      .eq("key_type", "deepseek")
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ exists: data && data.length > 0 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
