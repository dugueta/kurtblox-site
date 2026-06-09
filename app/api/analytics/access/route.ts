import { NextRequest, NextResponse } from "next/server";

import { recordAccess } from "@/lib/analytics-store";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    path?: string;
    referrer?: string;
    visitorId?: string;
  };

  if (!body.visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }

  await recordAccess({
    path: body.path ?? "/",
    referrer: body.referrer ?? "",
    userAgent: request.headers.get("user-agent") ?? "",
    visitorId: body.visitorId,
  });

  return NextResponse.json({ ok: true });
}
