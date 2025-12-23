import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CancellationRequest {
  experienceId: string;
  experienceTitle: string;
  reason: string;
  hostName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-experience-cancelled function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { experienceId, experienceTitle, reason, hostName }: CancellationRequest = await req.json();
    
    console.log(`Processing cancellation for experience: ${experienceId}`);
    console.log(`Title: ${experienceTitle}, Reason: ${reason}, Host: ${hostName}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all enrolled users for this experience
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("user_id")
      .eq("experience_id", experienceId)
      .eq("status", "joined");

    if (enrollmentError) {
      console.error("Error fetching enrollments:", enrollmentError);
      throw enrollmentError;
    }

    console.log(`Found ${enrollments?.length || 0} enrolled users`);

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No participants to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user emails from auth.users
    const userIds = enrollments.map((e) => e.user_id);
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    const participantEmails = users.users
      .filter((user) => userIds.includes(user.id))
      .map((user) => user.email)
      .filter((email): email is string => !!email);

    console.log(`Sending emails to ${participantEmails.length} participants`);

    if (participantEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No valid email addresses found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to all participants
    const emailPromises = participantEmails.map((email) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Lookfor <onboarding@resend.dev>",
          to: [email],
          subject: `Experience Cancelled: ${experienceTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Experience Cancelled</h1>
              <p>We're sorry to inform you that the experience <strong>"${experienceTitle}"</strong> has been cancelled by the host.</p>
              
              <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #666;">Reason from ${hostName}:</h3>
                <p style="color: #333; margin-bottom: 0;">${reason}</p>
              </div>
              
              <p>We apologize for any inconvenience this may cause. We encourage you to explore other experiences on Lookfor!</p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                The Lookfor Team
              </p>
            </div>
          `,
        }),
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    console.log(`Email sending complete: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Notifications sent to ${successCount} participants`,
        successCount,
        failCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-experience-cancelled function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
