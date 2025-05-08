
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
      }
    );

    // Mock implementation since we don't have direct access to modules table
    const modules = [
      {
        id: 1,
        university: "NUS", 
        course_code: "CS1101S",
        title: "Programming Methodology",
        aus_cus: 4,
        semester: "1",
        description: "This module introduces the concepts of programming and computational problem solving."
      },
      {
        id: 2,
        university: "NUS", 
        course_code: "CS2030S",
        title: "Programming Methodology II",
        aus_cus: 4,
        semester: "1,2",
        description: "This module continues the introduction to programming methodology."
      }
    ];

    return new Response(
      JSON.stringify(modules),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
