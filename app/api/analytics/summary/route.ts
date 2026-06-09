import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getAnalyticsSummary } from "@/lib/analytics-store";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json(await getAnalyticsSummary());
}
