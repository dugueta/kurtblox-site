import { NextRequest, NextResponse } from "next/server";

import { deleteAccount, getAccountById, getAccounts, upsertAccount, validateEmailLogin, validateProviderLogin, type AccountProvider } from "@/lib/account-store";
import { requireAdmin } from "@/lib/admin-auth";

const providers: AccountProvider[] = ["email", "google"];

function publicAccount<T extends { password?: string }>(account: T) {
  const { password: _password, ...safeAccount } = account;

  return safeAccount;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const account = await getAccountById(id);

    if (!account) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ account: publicAccount(account) });
  }

  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    accounts: (await getAccounts()).map(publicAccount),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    action?: "create" | "login" | "forgot";
    name?: string;
    email?: string;
    password?: string;
    provider?: AccountProvider;
  } | null;

  if (!body?.action) {
    return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
  }

  if (body.action === "forgot") {
    if (!body.email?.trim()) {
      return NextResponse.json({ error: "Informe seu email." }, { status: 400 });
    }

    return NextResponse.json({
      message: "Solicitacao de recuperacao registrada. Integre seu provedor de email depois.",
    });
  }

  const provider = body.provider && providers.includes(body.provider) ? body.provider : "email";

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email obrigatorio." }, { status: 400 });
  }

  if (provider === "email" && body.action === "create" && !body.name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatorio." }, { status: 400 });
  }

  if (provider === "email" && !body.password?.trim()) {
    return NextResponse.json({ error: "Senha obrigatoria." }, { status: 400 });
  }

  if (provider === "email" && body.action === "login") {
    const password = body.password?.trim();

    if (!password) {
      return NextResponse.json({ error: "Senha obrigatoria." }, { status: 400 });
    }

    const account = await validateEmailLogin({
      identifier: body.email.trim(),
      password,
    });

    if (!account) {
      return NextResponse.json({ error: "Usuário ou senha incorreta" }, { status: 401 });
    }

    return NextResponse.json({ account: publicAccount(account) });
  }

  if (body.action === "login" && provider !== "email") {
    const account = await validateProviderLogin({
      email: body.email.trim(),
      provider,
    });

    if (!account) {
      return NextResponse.json({ error: "Usuário ou senha incorreta" }, { status: 401 });
    }

    return NextResponse.json({ account: publicAccount(account) });
  }

  if (body.action === "create") {
    const accounts = await getAccounts();
    const requestedName = body.name?.trim().toLowerCase();
    const requestedEmail = body.email.trim().toLowerCase();

    if (requestedName && accounts.some((account) => account.name.toLowerCase() === requestedName)) {
      return NextResponse.json({ error: "Usuário existente." }, { status: 409 });
    }

    if (accounts.some((account) => account.email.toLowerCase() === requestedEmail)) {
      return NextResponse.json({ error: "Email existente." }, { status: 409 });
    }
  }

  const account = await upsertAccount({
    name: body.name?.trim() || (provider === "google" ? "Conta Google" : "Cliente"),
    email: body.email.trim(),
    password: provider === "email" ? body.password : undefined,
    provider,
  });

  return NextResponse.json({ account: publicAccount(account) });
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  }

  const deleted = await deleteAccount(id);

  if (!deleted) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
