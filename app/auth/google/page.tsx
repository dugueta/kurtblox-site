import { redirect } from "next/navigation";

type GoogleAuthRouteProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

function GoogleSetupPage() {
  return (
    <main className="min-h-screen bg-[#05040a] px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="rounded-3xl border border-violet-400/20 bg-[#0b0714]/95 p-8 shadow-[0_24px_90px_rgba(0,0,0,.42)]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Google OAuth</p>
          <h1 className="mt-3 text-2xl font-black">Configuração pendente</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no arquivo .env.local para ativar o login real com Google.
          </p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-xs font-semibold leading-6 text-zinc-300">
            URI de redirecionamento: /auth/google/callback
          </p>
        </div>
      </section>
    </main>
  );
}

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  return "http://localhost:3001";
}

export default async function GoogleAuthRoute({ searchParams }: GoogleAuthRouteProps) {
  const params = await searchParams;
  const mode = params.mode === "login" ? "login" : "create";
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return <GoogleSetupPage />;
  }

  const state = Buffer.from(JSON.stringify({ mode })).toString("base64url");
  const redirectUri = `${getBaseUrl()}/auth/google/callback`;
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");

  redirect(authorizationUrl.toString());
}
