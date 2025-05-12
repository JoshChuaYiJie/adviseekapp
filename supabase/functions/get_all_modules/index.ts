
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

    // Use the same data structure as our static JSON file
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
      },
      {
        id: 3,
        university: "NUS",
        course_code: "CS2040S",
        title: "Data Structures and Algorithms",
        aus_cus: 4,
        semester: "1,2",
        description: "This module teaches students about fundamental data structures and algorithms for efficient computation."
      },
      {
        id: 4,
        university: "NTU",
        course_code: "CZ1103",
        title: "Introduction to Computational Thinking",
        aus_cus: 3,
        semester: "1",
        description: "This module teaches problem-solving through computational thinking and programming basics."
      },
      {
        id: 5,
        university: "SMU",
        course_code: "IS111",
        title: "Introduction to Programming",
        aus_cus: 1,
        semester: "1",
        description: "This module introduces fundamental programming concepts and problem-solving techniques."
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
