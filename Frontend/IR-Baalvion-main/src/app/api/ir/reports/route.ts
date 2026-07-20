import { getFinancialReports } from '@/lib/ir-reports';

// Same-origin BFF: serves published financial reports from ir-service (server-side, so
// IR_SERVICE_URL stays private). Consumed by client sections (e.g. the homepage
// Quarterly Results block) that need live report data without browser CORS.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { reports, live } = await getFinancialReports();
  return Response.json({ success: true, live, data: reports });
}
