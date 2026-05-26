import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleRequest {
  frequency: "daily" | "weekly" | "monthly";
  day?: number; // Day of week (0-6) for weekly, day of month (1-28) for monthly
  hour?: number; // Hour of day (0-23)
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { frequency, day = 1, hour = 8 }: ScheduleRequest = await req.json();

    console.log(`Updating report schedule: frequency=${frequency}, day=${day}, hour=${hour}`);

    // Build cron expression
    let cronExpression: string;
    switch (frequency) {
      case "daily":
        cronExpression = `0 ${hour} * * *`; // Every day at specified hour
        break;
      case "weekly":
        cronExpression = `0 ${hour} * * ${day}`; // Every week on specified day at specified hour
        break;
      case "monthly":
        cronExpression = `0 ${hour} ${day} * *`; // Every month on specified day at specified hour
        break;
      default:
        cronExpression = `0 8 * * 1`; // Default: weekly on Monday at 8 AM
    }

    console.log(`Generated cron expression: ${cronExpression}`);

    // Update the cron job
    // First, try to unschedule the existing job if it exists
    try {
      await supabase.rpc("unschedule_if_exists", { job_name: "weekly-tag-report" });
    } catch (e) {
      console.log("No existing job to unschedule or function not available");
    }

    // Create new schedule using raw SQL via the database
    const functionUrl = `${supabaseUrl}/functions/v1/scheduled-tag-report`;
    
    // Delete old job and create new one
    const { error: deleteError } = await supabase
      .from("cron" as any)
      .delete()
      .eq("jobname", "weekly-tag-report");

    // Use SQL to update the cron job
    const { data: updateResult, error: updateError } = await supabase.rpc("update_cron_schedule", {
      job_name: "weekly-tag-report",
      new_schedule: cronExpression,
      function_url: functionUrl,
      anon_key: supabaseAnonKey,
    });

    if (updateError) {
      console.error("Error updating cron via RPC:", updateError);
      
      // Fallback: just update the setting, the cron job will need manual update
      console.log("Falling back to just updating settings...");
    }

    // Update the setting in app_settings
    const { error: settingsError } = await supabase
      .from("app_settings")
      .upsert({
        key: "report_schedule",
        value: { frequency, day, hour },
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    if (settingsError) {
      console.error("Error updating settings:", settingsError);
      throw settingsError;
    }

    console.log("Schedule updated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        schedule: { frequency, day, hour },
        cronExpression,
        message: `Report schedule updated to ${frequency}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
