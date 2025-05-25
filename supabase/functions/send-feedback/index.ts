
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface FeedbackRequest {
  type: 'bug' | 'suggestion' | 'other';
  feedback: string;
  userEmail?: string;
  userName?: string;
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

    // Get the current authenticated user
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("Auth error:", error);
      // Continue even if there's an auth error - allow anonymous feedback
    }

    const { type, feedback } = await req.json() as FeedbackRequest;

    // Get user profile for additional info
    let userName = 'Anonymous User';
    let userEmail = 'No email provided';
    
    if (user) {
      try {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        userName = profile?.full_name || user.email || 'Anonymous User';
        userEmail = user.email || 'No email provided';
      } catch (profileError) {
        console.error("Error fetching profile:", profileError);
      }
    }
    
    
    
    // Send email using the sender function
    const { data, error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: 'adviseek.official@gmail.com',
        subject: `Adviseek Feedback: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        html: `
          <h2>Feedback from ${userName}</h2>
          <p><strong>Feedback Type:</strong> ${type}</p>
          <p><strong>User Email:</strong> ${userEmail}</p>
          <p><strong>User ID:</strong> ${user?.id || 'Anonymous user'}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <h3>Feedback Content:</h3>
          <p>${feedback}</p>
        `,
      },
    });

    if (emailError) {
      console.error("Email error:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
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
