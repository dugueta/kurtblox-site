import { NextRequest, NextResponse } from "next/server";

import { clearAdminSession, isAdminAuthenticated, setAdminSession, validateAdminCredentials } from "@/lib/admin-auth";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const maxLoginAttempts = 6;
const loginWindowMs = 10 * 60 * 1000;

function getClientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + loginWindowMs });
    return false;
  }

  attempt.count += 1;
  return attempt.count > maxLoginAttempts;
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function GET() {
  return NextResponse.json({
    authenticated: await isAdminAuthenticated(),
  });
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);

  if (isRateLimited(clientKey)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as {
    user?: string;
    password?: string;
  } | null;

  if (!body?.user || !body.password || !validateAdminCredentials({ user: body.user, password: body.password })) {
    return NextResponse.json({ error: "Login ou senha incorretos." }, { status: 401 });
  }

  clearRateLimit(clientKey);
  return setAdminSession(NextResponse.json({ authenticated: true }));
}

export async function DELETE() {
  return clearAdminSession(NextResponse.json({ authenticated: false }));
}
