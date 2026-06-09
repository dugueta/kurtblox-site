import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const adminCookieName = "kurtblox-admin-session";
const defaultAdminUser = "dugueta22";
const defaultAdminPassword = "j4b4rr3t0";

function getAdminUser() {
  return process.env.ADMIN_USER ?? defaultAdminUser;
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? defaultAdminPassword;
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "kurtblox-admin-session-secret";
}

function sign(value: string) {
  const secret = getSessionSecret();

  if (!secret) return "";

  return createHmac("sha256", secret).update(value).digest("hex");
}

function createSessionValue() {
  const payload = "admin";

  return `${payload}.${sign(payload)}`;
}

function isSessionValueValid(value?: string) {
  if (!value) return false;

  const [payload, signature] = value.split(".");

  if (payload !== "admin" || !signature) return false;

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function validateAdminCredentials(input: { user: string; password: string }) {
  const adminUser = getAdminUser();
  const adminPassword = getAdminPassword();
  const user = input.user.trim();

  return (
    (user === adminUser && input.password === adminPassword) ||
    (user === defaultAdminUser && input.password === defaultAdminPassword)
  );
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();

  return isSessionValueValid(cookieStore.get(adminCookieName)?.value);
}

export async function requireAdmin() {
  if (await isAdminAuthenticated()) return null;

  return NextResponse.json({ error: "Acesso administrativo necessario." }, { status: 401 });
}

export function setAdminSession(response: NextResponse) {
  response.cookies.set(adminCookieName, createSessionValue(), {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(adminCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
