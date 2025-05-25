
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ConsultantApplication {
  userId: string;
  schoolAndCourse: string;
  achievements: string;
  aboutYourself: string;
  enthusiasm: number;
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
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the request data
    const applicationData = await req.json() as ConsultantApplication;

    if (!applicationData.userId || !applicationData.schoolAndCourse || !applicationData.aboutYourself) {
      throw new Error('Missing required fields');
    }

    // Save the application to the database
    const { data, error } = await supabaseClient
      .from('consultant_applications')
      .insert({
        user_id: applicationData.userId,
        school_and_course: applicationData.schoolAndCourse,
        achievements: applicationData.achievements,
        about_yourself: applicationData.aboutYourself,
        enthusiasm: applicationData.enthusiasm
      });

    if (error) {
      throw error;
    }

    // Send email notification about the new application
    await sendEmailNotification(supabaseClient, applicationData);

    return new Response(JSON.stringify({ success: true, message: 'Application submitted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function sendEmailNotification(supabaseClient: any, applicationData: ConsultantApplication) {
  try {
    // Call the send-email function
    await supabaseClient.functions.invoke('send-email', {
      body: {
        to: 'adviseek.official@gmail.com',
        subject: 'New Consultant Application',
        html: `
          <h1>New Consultant Application</h1>
          <p><strong>School and Course:</strong> ${applicationData.schoolAndCourse}</p>
          <p><strong>Achievements:</strong> ${applicationData.achievements}</p>
          <p><strong>About:</strong> ${applicationData.aboutYourself}</p>
          <p><strong>Enthusiasm Level:</strong> ${applicationData.enthusiasm}/100</p>
        `,
        from: 'noreply@adviseek.app',
        replyTo: 'adviseek.official@gmail.com'
      },
    });
    
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // We don't throw here to avoid failing the main function if email fails
  }
}
