
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
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
    const { to, subject, html, from, replyTo } = await req.json() as EmailRequest;

    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, or html');
    }

    // Set default sender email
    const fromEmail = from || 'noreply@adviseek.app';
    const replyToEmail = replyTo || fromEmail;

    // Create email parameters
    const emailParams = {
      to,
      subject,
      html,
      from: fromEmail,
      replyTo: replyToEmail,
    };

    // Send email via Supabase Edge function (this would typically use an email service like SendGrid, Postmark, etc.)
    // For demo purposes, we'll just log this and return success
    console.log('Sending email:', emailParams);
    
    // In a real implementation, you'd add code here to send via SMTP or an email API
    
    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
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
