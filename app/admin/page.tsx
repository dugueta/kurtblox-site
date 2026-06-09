"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  Headphones,
  LogOut,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnalyticsSummary = {
  totalAccesses: number;
  uniqueVisitors: number;
  todayAccesses: number;
  last7Days: Array<{
    day: string;
    label: string;
    accesses: number;
  }>;
};

type AccountRecord = {
  id: string;
  name: string;
  email: string;
  provider: "email" | "google";
  createdAt: string;
  lastLoginAt: string;
};

type PurchaseRecord = {
  id: string;
  accountEmail: string;
  robloxUser: string;
  packageId: string;
  amount: string;
  price: string;
  total: string;
  paymentMethod: "pix" | "card";
  coupon?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  confirmedAt?: string;
  gatewayPaymentId?: string;
  gatewayProvider?: string;
  gatewayStatus?: string;
  gatewayEventAt?: string;
  paymentUrl?: string;
  pixCopyPaste?: string;
  pixQrCode?: string;
  cardHolderName?: string;
  cardLast4?: string;
};

type SupportTicket = {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
  messages: Array<{
    id: string;
    author: "client" | "admin";
    text: string;
    createdAt: string;
  }>;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function parseMoney(value: string) {
  const numeric = Number(value.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: PurchaseRecord["status"]) {
  if (status === "confirmed") return "Aprovada";
  if (status === "cancelled") return "Cancelada";
  return "Pendente";
}

function statusClass(status: PurchaseRecord["status"]) {
  if (status === "confirmed") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (status === "cancelled") return "border-red-400/20 bg-red-400/10 text-red-300";
  return "border-amber-400/20 bg-amber-400/10 text-amber-300";
}

function ticketStatusLabel(status: SupportTicket["status"]) {
  if (status === "answered") return "Respondido";
  if (status === "closed") return "Fechado";
  return "Aberto";
}

function providerLabel(provider: AccountRecord["provider"]) {
  return provider === "google" ? "Google" : "Email";
}

export default function AdminPage() {
  const [isLogged, setIsLogged] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthSending, setIsAuthSending] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const totals = useMemo(() => {
    const confirmedPurchases = purchases.filter((purchase) => purchase.status === "confirmed");
    const pendingPurchases = purchases.filter((purchase) => purchase.status === "pending");
    const cancelledPurchases = purchases.filter((purchase) => purchase.status === "cancelled");
    const revenue = confirmedPurchases.reduce((sum, purchase) => sum + parseMoney(purchase.total), 0);
    const pendingRevenue = pendingPurchases.reduce((sum, purchase) => sum + parseMoney(purchase.total), 0);

    return {
      cancelled: cancelledPurchases.length,
      confirmed: confirmedPurchases.length,
      pending: pendingPurchases.length,
      pendingRevenue,
      revenue,
      total: purchases.length,
    };
  }, [purchases]);

  const dailyAccess = analytics?.last7Days ?? [];
  const maxAccess = Math.max(...dailyAccess.map((day) => day.accesses), 1);
  const latestPurchases = purchases.slice(0, 10);
  const openTickets = supportTickets.filter((ticket) => ticket.status !== "closed").length;

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const data = await response.json() as { authenticated?: boolean };

        if (active) {
          setIsLogged(Boolean(data.authenticated));
        }
      } finally {
        if (active) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLogged) return;

    let active = true;

    async function loadDashboardData() {
      const [analyticsResponse, accountsResponse, purchasesResponse, supportResponse] = await Promise.all([
        fetch("/api/analytics/summary", { cache: "no-store" }),
        fetch("/api/accounts", { cache: "no-store" }),
        fetch("/api/purchases", { cache: "no-store" }),
        fetch("/api/support", { cache: "no-store" }),
      ]);

      if (!analyticsResponse.ok || !accountsResponse.ok || !purchasesResponse.ok || !supportResponse.ok) {
        if (active) setActionError("Nao foi possivel carregar os dados do painel.");
        return;
      }

      const analyticsData = await analyticsResponse.json() as AnalyticsSummary;
      const accountsData = await accountsResponse.json() as { accounts: AccountRecord[] };
      const purchasesData = await purchasesResponse.json() as { purchases: PurchaseRecord[] };
      const supportData = await supportResponse.json() as { tickets: SupportTicket[] };

      if (active) {
        setAnalytics(analyticsData);
        setAccounts(accountsData.accounts);
        setPurchases(purchasesData.purchases);
        setSupportTickets(supportData.tickets);
        setActionError("");
      }
    }

    void loadDashboardData();
    const interval = window.setInterval(loadDashboardData, 8000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isLogged]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAuthSending(true);
    setError("");

    const response = await fetch("/api/admin/session", {
      body: JSON.stringify({ user, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await response.json();

    setIsAuthSending(false);

    if (response.ok) {
      setIsLogged(true);
      setPassword("");
      return;
    }

    setError(data.error ?? "Login ou senha incorretos.");
  }

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setIsLogged(false);
    setUser("");
    setPassword("");
    setAnalytics(null);
    setAccounts([]);
    setPurchases([]);
    setSupportTickets([]);
  }

  async function handlePurchaseStatus(id: string, status: PurchaseRecord["status"]) {
    setActionError("");

    const response = await fetch("/api/purchases", {
      body: JSON.stringify({ id, status }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) {
      setActionError(data.error ?? "Nao foi possivel atualizar a venda.");
      return;
    }

    setPurchases((items) => items.map((item) => item.id === id ? data.purchase : item));
  }

  async function handleTicketStatus(ticketId: string, status: SupportTicket["status"]) {
    setActionError("");

    const response = await fetch("/api/support", {
      body: JSON.stringify({ ticketId, status }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) {
      setActionError(data.error ?? "Nao foi possivel atualizar o chamado.");
      return;
    }

    setSupportTickets((tickets) => tickets.map((ticket) => ticket.id === ticketId ? data.ticket : ticket));
  }

  async function handleAdminReply(event: FormEvent<HTMLFormElement>, ticketId: string) {
    event.preventDefault();
    setActionError("");

    const message = replyDrafts[ticketId]?.trim();

    if (!message) {
      setActionError("Digite uma resposta antes de enviar.");
      return;
    }

    const response = await fetch("/api/support", {
      body: JSON.stringify({ author: "admin", message, ticketId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setActionError(data.error ?? "Nao foi possivel responder o chamado.");
      return;
    }

    setSupportTickets((tickets) => tickets.map((ticket) => ticket.id === ticketId ? data.ticket : ticket));
    setReplyDrafts((drafts) => ({ ...drafts, [ticketId]: "" }));
  }

  async function handleDeleteAccount(id: string) {
    setActionError("");

    const response = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });

    if (!response.ok) {
      setActionError("Nao foi possivel excluir a conta.");
      return;
    }

    setAccounts((items) => items.filter((account) => account.id !== id));
  }

  if (isLoadingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070a12] text-white">
        <div className="text-sm font-black uppercase tracking-[.18em] text-zinc-500">Carregando painel</div>
      </main>
    );
  }

  if (!isLogged) {
    return (
      <main className="min-h-screen bg-[#070a12] px-5 py-8 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,.24),transparent_34%),linear-gradient(180deg,rgba(7,10,18,.1),#070a12_76%)]" />
        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
          <Card className="w-full rounded-2xl border-white/10 bg-[#0d111c]/95 p-6 shadow-[0_24px_90px_rgba(0,0,0,.42)]">
            <CardHeader>
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20">
                <ShieldCheck size={24} />
              </div>
              <CardTitle className="text-2xl">Painel administrativo</CardTitle>
              <p className="text-sm leading-6 text-zinc-400">
                Acesso restrito. Apenas o login configurado no servidor pode entrar.
              </p>
            </CardHeader>

            <CardContent>
              <form className="mt-6 space-y-4" onSubmit={(event) => void handleLogin(event)}>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Usuario</span>
                  <input
                    value={user}
                    onChange={(event) => setUser(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition focus:border-violet-400/70"
                    placeholder="Usuario admin"
                    autoComplete="username"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Senha</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition focus:border-violet-400/70"
                    placeholder="Senha admin"
                    type="password"
                    autoComplete="current-password"
                  />
                </label>

                {error ? <p className="text-sm font-bold text-red-300">{error}</p> : null}

                <Button className="w-full" variant="premium" type="submit" disabled={isAuthSending}>
                  {isAuthSending ? "Verificando..." : "Entrar no painel"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070a12] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,.2),transparent_32%),radial-gradient(circle_at_95%_5%,rgba(34,197,94,.08),transparent_20%),linear-gradient(180deg,rgba(7,10,18,.1),#070a12_76%)]" />

      <header className="sticky top-0 z-20 border-b border-white/[.06] bg-[#070a12]/85 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">KurtBlox Admin</p>
            <h1 className="mt-1 text-2xl font-black tracking-normal">Painel operacional</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-zinc-100 transition hover:border-violet-400/60 hover:bg-white/[.07]"
              href="/"
              target="_blank"
            >
              Abrir site
            </a>
            <Button variant="outline" onClick={() => void handleLogout()}>
              <LogOut size={17} />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-6">
        {actionError ? (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard icon={ShoppingCart} label="Vendas" value={formatNumber(totals.total)} detail={`${totals.pending} pendentes`} />
          <KpiCard icon={CheckCircle2} label="Aprovadas" value={formatNumber(totals.confirmed)} detail="Gateway ou manual" tone="green" />
          <KpiCard icon={Clock3} label="Pendentes" value={formatNumber(totals.pending)} detail={formatMoney(totals.pendingRevenue)} tone="yellow" />
          <KpiCard icon={Wallet} label="Receita aprovada" value={formatMoney(totals.revenue)} detail="Somente aprovadas" tone="green" />
          <KpiCard icon={Users} label="Contas" value={formatNumber(accounts.length)} detail="Usuarios cadastrados" />
          <KpiCard icon={Headphones} label="Suporte" value={formatNumber(openTickets)} detail="Chamados abertos" tone="yellow" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <Card className="rounded-2xl border-white/10 bg-[#0d111c]/88 p-5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Acessos do site</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatNumber(analytics?.totalAccesses ?? 0)} acessos totais, {formatNumber(analytics?.todayAccesses ?? 0)} hoje.
                </p>
              </div>
              <BarChart3 className="text-violet-300" size={24} />
            </CardHeader>
            <CardContent className="mt-6">
              <div className="flex h-56 items-end gap-3">
                {dailyAccess.map((item) => (
                  <div key={item.day} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-48 w-full items-end rounded-xl bg-white/[.035] px-2">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-700 to-violet-300"
                        style={{ height: `${Math.max((item.accesses / maxAccess) * 100, item.accesses ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-zinc-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-[#0d111c]/88 p-5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Status das vendas</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">Resumo vindo do checkout e gateway.</p>
              </div>
              <Activity className="text-violet-300" size={24} />
            </CardHeader>
            <CardContent className="mt-6 space-y-4">
              <ProgressRow label="Aprovadas" value={totals.confirmed} total={Math.max(totals.total, 1)} className="bg-emerald-400" />
              <ProgressRow label="Pendentes" value={totals.pending} total={Math.max(totals.total, 1)} className="bg-amber-400" />
              <ProgressRow label="Canceladas" value={totals.cancelled} total={Math.max(totals.total, 1)} className="bg-red-400" />
              <div className="rounded-xl border border-white/10 bg-white/[.035] p-4 text-sm text-zinc-400">
                Toda venda criada pelo checkout aparece aqui. Quando o webhook da Paradise retorna aprovado, o status muda para <strong className="text-emerald-300">Aprovada</strong>.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 rounded-2xl border-white/10 bg-[#0d111c]/88 p-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Vendas registradas</CardTitle>
              <p className="mt-1 text-sm text-zinc-500">Pedidos do site principal e atualizacoes do gateway.</p>
            </div>
            <PackageCheck className="text-emerald-300" size={24} />
          </CardHeader>
          <CardContent className="mt-5">
            {latestPurchases.length ? (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead className="bg-white/[.04] text-xs font-black uppercase tracking-[.12em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Pacote</th>
                      <th className="px-4 py-3">Pagamento</th>
                      <th className="px-4 py-3">Gateway</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Datas</th>
                      <th className="px-4 py-3">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-t border-white/10 align-top">
                        <td className="px-4 py-4">
                          <strong className="block text-white">{purchase.robloxUser}</strong>
                          <span className="mt-1 block text-xs text-zinc-500">{purchase.accountEmail}</span>
                        </td>
                        <td className="px-4 py-4">
                          <strong className="block text-white">{purchase.amount} Robux</strong>
                          <span className="mt-1 block text-xs text-zinc-500">{purchase.total}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-xs font-black uppercase text-zinc-300">
                            <CreditCard size={14} />
                            {purchase.paymentMethod}
                          </span>
                          {purchase.cardLast4 ? <span className="mt-2 block text-xs text-zinc-500">**** {purchase.cardLast4}</span> : null}
                        </td>
                        <td className="px-4 py-4 text-xs leading-5 text-zinc-500">
                          <strong className="block text-zinc-300">{purchase.gatewayProvider ?? "manual"}</strong>
                          <span>ID: {purchase.gatewayPaymentId ?? "-"}</span>
                          <span className="block">Evento: {purchase.gatewayStatus ?? "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-black", statusClass(purchase.status))}>
                            {statusLabel(purchase.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs leading-5 text-zinc-500">
                          <span className="block">Criada: {formatDate(purchase.createdAt)}</span>
                          <span className="block">Aprovada: {formatDate(purchase.confirmedAt)}</span>
                          <span className="block">Gateway: {formatDate(purchase.gatewayEventAt)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={purchase.status === "confirmed"}
                              onClick={() => void handlePurchaseStatus(purchase.id, "confirmed")}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={purchase.status === "cancelled"}
                              onClick={() => void handlePurchaseStatus(purchase.id, "cancelled")}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="Nenhuma venda registrada ainda. As proximas compras do checkout vao aparecer aqui." />
            )}
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="rounded-2xl border-white/10 bg-[#0d111c]/88 p-5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Contas</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">Usuarios cadastrados no site principal.</p>
              </div>
              <Users className="text-violet-300" size={24} />
            </CardHeader>
            <CardContent className="mt-5">
              {accounts.length ? (
                <div className="space-y-3">
                  {accounts.slice(0, 8).map((account) => (
                    <div key={account.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.035] p-3">
                      <div className="min-w-0">
                        <strong className="block truncate text-sm text-white">{account.name}</strong>
                        <span className="block truncate text-xs text-zinc-500">{account.email}</span>
                        <span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-zinc-600">
                          {providerLabel(account.provider)} - {formatDate(account.createdAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg bg-red-400/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/20"
                        onClick={() => void handleDeleteAccount(account.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nenhuma conta cadastrada." />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-[#0d111c]/88 p-5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Suporte</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">Chamados enviados pelo site.</p>
              </div>
              <Headphones className="text-violet-300" size={24} />
            </CardHeader>
            <CardContent className="mt-5">
              {supportTickets.length ? (
                <div className="space-y-3">
                  {supportTickets.slice(0, 6).map((ticket) => {
                    const isExpanded = expandedTicket === ticket.id;

                    return (
                      <article key={ticket.id} className="rounded-xl border border-white/10 bg-white/[.035] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="block truncate text-sm text-white">{ticket.name}</strong>
                            <span className="block truncate text-xs text-zinc-500">{ticket.email}</span>
                            <span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-zinc-600">
                              {ticket.reason} - {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-xs font-black text-zinc-300">
                            {ticketStatusLabel(ticket.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}>
                            {isExpanded ? "Fechar" : "Abrir"}
                          </Button>
                          <Button size="sm" variant="outline" disabled={ticket.status === "closed"} onClick={() => void handleTicketStatus(ticket.id, "closed")}>
                            Encerrar
                          </Button>
                        </div>

                        {isExpanded ? (
                          <div className="mt-3 space-y-3">
                            <div className="max-h-56 space-y-2 overflow-y-auto">
                              {ticket.messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={cn(
                                    "rounded-lg border px-3 py-2 text-sm leading-6",
                                    message.author === "admin"
                                      ? "border-emerald-400/15 bg-emerald-400/[.07]"
                                      : "border-violet-400/15 bg-violet-500/[.08]"
                                  )}
                                >
                                  <div className="mb-1 text-[11px] font-black uppercase tracking-[.12em] text-zinc-500">
                                    {message.author === "admin" ? "Admin" : "Cliente"} - {formatDate(message.createdAt)}
                                  </div>
                                  {message.text}
                                </div>
                              ))}
                            </div>
                            <form className="flex gap-2" onSubmit={(event) => void handleAdminReply(event, ticket.id)}>
                              <textarea
                                value={replyDrafts[ticket.id] ?? ""}
                                onChange={(event) => setReplyDrafts((drafts) => ({ ...drafts, [ticket.id]: event.target.value }))}
                                className="min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-400/70"
                                placeholder="Responder cliente"
                                rows={2}
                              />
                              <Button type="submit" variant="premium" disabled={ticket.status === "closed"}>
                                Enviar
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="Nenhum chamado recebido." />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function KpiCard({
  detail,
  icon: Icon,
  label,
  tone = "violet",
  value,
}: {
  detail: string;
  icon: typeof ShoppingCart;
  label: string;
  tone?: "green" | "violet" | "yellow";
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-[#0d111c]/88 p-4">
      <CardContent>
        <div className="mb-5 flex items-center justify-between">
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl ring-1",
              tone === "green" && "bg-emerald-400/10 text-emerald-300 ring-emerald-400/15",
              tone === "yellow" && "bg-amber-400/10 text-amber-300 ring-amber-400/15",
              tone === "violet" && "bg-violet-500/12 text-violet-200 ring-violet-400/15"
            )}
          >
            <Icon size={20} />
          </div>
        </div>
        <p className="text-xs font-black uppercase tracking-[.12em] text-zinc-500">{label}</p>
        <strong className="mt-2 block text-2xl font-black">{value}</strong>
        <span className="mt-1 block text-xs text-zinc-500">{detail}</span>
      </CardContent>
    </Card>
  );
}

function ProgressRow({
  className,
  label,
  total,
  value,
}: {
  className: string;
  label: string;
  total: number;
  value: number;
}) {
  const percent = Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-black">{label}</span>
        <span className="text-zinc-400">{formatNumber(value)} / {percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[.06]">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[.025] px-4 py-8 text-center text-sm font-semibold text-zinc-500">
      {text}
    </div>
  );
}
