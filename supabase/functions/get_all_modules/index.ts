
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

    // Mock implementation matching the format in public/data/modules.json
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
        university: "NTU",
        course_code: "CZ1103",
        title: "Introduction to Computational Thinking",
        aus_cus: 3,
        semester: "1",
        description: "This course introduces computational thinking and problem solving using Python."
      },
      {
        id: 4,
        university: "NTU",
        course_code: "CZ2002",
        title: "Object-Oriented Design & Programming",
        aus_cus: 3,
        semester: "2",
        description: "This course covers object-oriented programming concepts using Java."
      },
      {
        id: 5,
        university: "SMU",
        course_code: "IS111",
        title: "Introduction to Programming",
        aus_cus: 1,
        semester: "1",
        description: "This course introduces programming concepts using Python."
      },
      {
        id: 6,
        university: "SMU",
        course_code: "CS102",
        title: "Object-Oriented Programming",
        aus_cus: 1,
        semester: "2",
        description: "This course covers object-oriented programming using Java."
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
