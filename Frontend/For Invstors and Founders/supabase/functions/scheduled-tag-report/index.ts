import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmailWithResend(apiKey: string, to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tag Analytics <reports@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend API error:", errorText);
    return { success: false, error: errorText };
  }

  return { success: true, data: await response.json() };
}

function generateEmailHtml(reportData: any): string {
  const topTagsHtml = reportData.topTags
    .map((tag: any, index: number) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          <span style="background-color: ${tag.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${tag.name}</span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${tag.count}</td>
      </tr>
    `)
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Weekly Tag Analytics Report</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a1a; margin-bottom: 8px;">Weekly Tag Analytics Report</h1>
        <p style="color: #666; margin-bottom: 24px;">
          ${new Date(reportData.period.start).toLocaleDateString()} - ${new Date(reportData.period.end).toLocaleDateString()}
        </p>
        
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <div style="flex: 1; background-color: #f0f9ff; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #0369a1;">${reportData.totalThreads}</div>
            <div style="color: #666; font-size: 14px;">New Threads</div>
          </div>
          <div style="flex: 1; background-color: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #15803d;">${reportData.totalTagUsages}</div>
            <div style="color: #666; font-size: 14px;">Tag Usages</div>
          </div>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-bottom: 16px;">Top Tags This Week</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 8px; text-align: left; font-weight: 600;">#</th>
              <th style="padding: 8px; text-align: left; font-weight: 600;">Tag</th>
              <th style="padding: 8px; text-align: right; font-weight: 600;">Uses</th>
            </tr>
          </thead>
          <tbody>
            ${topTagsHtml || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #666;">No tag usage this week</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">
          <a href="#" style="color: #0369a1; text-decoration: none;">View Full Report in Admin Panel →</a>
        </div>
      </div>
      
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">
        Generated on ${new Date(reportData.generatedAt).toLocaleString()}
      </p>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date range for last week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Fetch tag usage data for the week
    const { data: tagUsage, error: tagError } = await supabase
      .from("thread_tags")
      .select(`
        tag_id,
        created_at,
        tags (name, color)
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (tagError) throw tagError;

    // Aggregate tag counts
    const tagCounts: Record<string, { name: string; color: string; count: number }> = {};
    tagUsage?.forEach((item: any) => {
      const tagId = item.tag_id;
      if (!tagCounts[tagId]) {
        tagCounts[tagId] = {
          name: item.tags?.name || "Unknown",
          color: item.tags?.color || "#gray",
          count: 0,
        };
      }
      tagCounts[tagId].count++;
    });

    // Sort by count descending
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10);

    // Get total threads created this week
    const { count: totalThreads } = await supabase
      .from("forum_threads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    // Build report data
    const reportData = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalThreads: totalThreads || 0,
      totalTagUsages: tagUsage?.length || 0,
      topTags: sortedTags.map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color,
        count: data.count,
      })),
      generatedAt: new Date().toISOString(),
    };

    // Store report in database
    const { error: insertError } = await supabase
      .from("tag_analytics_reports")
      .insert({
        report_type: "weekly",
        report_data: reportData,
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
      });

    if (insertError) throw insertError;

    // Get moderators to notify
    const { data: moderators } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "moderator"]);

    // Create notifications for moderators
    if (moderators && moderators.length > 0) {
      const notifications = moderators.map((mod) => ({
        user_id: mod.user_id,
        type: "report",
        title: "Weekly Tag Analytics Report",
        message: `Your weekly tag analytics report is ready. Top tag: ${sortedTags[0]?.[1]?.name || "N/A"} with ${sortedTags[0]?.[1]?.count || 0} uses.`,
        link: "/admin",
      }));

      await supabase.from("notifications").insert(notifications);
    }

    // Send email if RESEND_API_KEY is configured
    let emailsSent = 0;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey && moderators && moderators.length > 0) {
      console.log("RESEND_API_KEY found, attempting to send emails...");
      
      // Get moderator emails from auth.users using admin API
      const moderatorIds = moderators.map((m) => m.user_id);
      const emails: string[] = [];
      
      for (const userId of moderatorIds) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (!userError && userData?.user?.email) {
          emails.push(userData.user.email);
        }
      }

      if (emails.length > 0) {
        const emailHtml = generateEmailHtml(reportData);
        const emailResult = await sendEmailWithResend(
          resendApiKey,
          emails,
          "Weekly Tag Analytics Report",
          emailHtml
        );

        if (emailResult.success) {
          emailsSent = emails.length;
          console.log(`Successfully sent emails to ${emailsSent} moderators`);
        } else {
          console.error("Failed to send emails:", emailResult.error);
        }
      } else {
        console.log("No moderator emails found");
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email delivery");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: reportData,
        notifiedModerators: moderators?.length || 0,
        emailsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
