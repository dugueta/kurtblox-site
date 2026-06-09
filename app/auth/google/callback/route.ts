import { NextRequest, NextResponse } from "next/server";

import { getAccounts, upsertAccount } from "@/lib/account-store";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function publicAccount<T extends { password?: string }>(account: T) {
  const { password: _password, ...safeAccount } = account;

  return safeAccount;
}

function getBaseUrl(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  return request.nextUrl.origin;
}

function getCallbackUrl(request: NextRequest) {
  return `${getBaseUrl(request)}/auth/google/callback`;
}

function decodeMode(state: string | null) {
  try {
    const parsed = JSON.parse(Buffer.from(state ?? "", "base64url").toString("utf8")) as {
      mode?: string;
    };

    return parsed.mode === "login" ? "login" : "create";
  } catch {
    return "create";
  }
}

function popupResponse(payload: unknown) {
  const serializedPayload = JSON.stringify(payload).replace(/</g, "\\u003c");

  return new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>Google</title>
  </head>
  <body style="margin:0;background:#05040a;color:white;font-family:Arial,sans-serif;">
    <script>
      const payload = ${serializedPayload};
      if (window.opener) {
        window.opener.postMessage(payload, window.location.origin);
        window.close();
      } else {
        window.location.href = "/";
      }
    </script>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const mode = decodeMode(request.nextUrl.searchParams.get("state"));
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (error) {
    return popupResponse({
      error: "Login com Google cancelado.",
      type: "kurtblox-google-auth",
    });
  }

  if (!code || !clientId || !clientSecret) {
    return popupResponse({
      error: "Login com Google nao configurado.",
      type: "kurtblox-google-auth",
    });
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getCallbackUrl(request),
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenData.access_token) {
    return popupResponse({
      error: tokenData.error_description ?? "Nao foi possivel validar o Google.",
      type: "kurtblox-google-auth",
    });
  }

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const user = (await userResponse.json()) as GoogleUserInfo;

  if (!userResponse.ok || !user.email || user.email_verified === false) {
    return popupResponse({
      error: "Nao foi possivel confirmar o email do Google.",
      type: "kurtblox-google-auth",
    });
  }

  const email = user.email.trim();
  const accounts = await getAccounts();
  const existing = accounts.find((account) => account.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    if (mode === "create") {
      return popupResponse({
        error: "Conta já registrada.",
        type: "kurtblox-google-auth",
      });
    }

      return popupResponse({
        account: publicAccount(existing),
        type: "kurtblox-google-auth",
      });
  }

  if (mode === "login") {
    return popupResponse({
      error: "Esta conta Google não está cadastrada.",
      type: "kurtblox-google-auth",
    });
  }

  const account = await upsertAccount({
    email,
    name: user.name?.trim() || "Conta Google",
    provider: "google",
  });

  return popupResponse({
    account: publicAccount(account),
    type: "kurtblox-google-auth",
  });
}
