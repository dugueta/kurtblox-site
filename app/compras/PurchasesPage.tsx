"use client";

import Image from "next/image";
import { PackageCheck, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readStoredAccount, startAccountDeletionWatcher } from "@/lib/account-session";

type Purchase = {
  id: string;
  amount: string;
  total: string;
  paymentMethod: "pix" | "card";
  robloxUser: string;
  confirmedAt?: string;
};

export function PurchasesPage() {
  const [email, setEmail] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAccount = readStoredAccount();

    if (!savedAccount) {
      setIsLoading(false);
      return;
    }

    const accountEmail = savedAccount.email?.trim() ?? "";

    if (!accountEmail) {
      setIsLoading(false);
      return;
    }

    setEmail(accountEmail);

    async function loadPurchases() {
      try {
        const response = await fetch(`/api/purchases?email=${encodeURIComponent(accountEmail)}&confirmedOnly=true`);
        const data = await response.json();

        setPurchases(data.purchases ?? []);
      } finally {
        setIsLoading(false);
      }
    }

    void loadPurchases();

    return startAccountDeletionWatcher((account) => {
      if (account) return;

      setEmail("");
      setPurchases([]);
      setIsLoading(false);
    }, 120000);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05040a] text-white">
      <div className="pointer-events-none fixed inset-0">
        <Image src="/fundo-robux.png" alt="" fill priority sizes="100vw" quality={55} className="scale-105 object-cover opacity-[.24] blur-[2px] saturate-125" />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-[#05040a]/64" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(124,58,237,.28),transparent_36%),linear-gradient(180deg,rgba(5,4,10,.16),#05040a_84%)]" />

      <header className="relative z-10 border-b border-white/[.06] bg-[#05040a]/72 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="brand-logo inline-flex items-center gap-1 rounded-lg text-xl font-black sm:text-2xl">
            <span className="brand-word brand-word-white">Kurt</span>
            <span className="brand-word brand-word-purple">Blox</span>
            <span className="brand-word brand-word-purple ml-1">Store</span>
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        <Card className="border-violet-400/20 bg-[#0b0714]/92 p-5 shadow-[0_24px_90px_rgba(0,0,0,.34)] backdrop-blur">
          <CardHeader>
            <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Minha conta</p>
            <CardTitle className="mt-1 text-2xl uppercase sm:text-3xl">Minhas compras</CardTitle>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Somente compras confirmadas pelo painel/gateway aparecem aqui.
            </p>
          </CardHeader>

          <CardContent className="mt-4">
            {!email ? (
              <div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-5 text-sm font-semibold text-zinc-500">
                Entre na sua conta para visualizar suas compras.
              </div>
            ) : isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-5 text-sm font-semibold text-zinc-500">
                Carregando compras...
              </div>
            ) : purchases.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {purchases.map((purchase) => (
                  <article key={purchase.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                    <PackageCheck className="mb-4 text-emerald-300" size={26} />
                    <h2 className="text-xl font-black">{purchase.amount} Robux</h2>
                    <p className="mt-2 text-sm text-zinc-400">Usuário Roblox: {purchase.robloxUser}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm font-bold uppercase text-zinc-500">{purchase.paymentMethod}</span>
                      <strong>{purchase.total}</strong>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-zinc-500">
                      Confirmada em {purchase.confirmedAt ? new Date(purchase.confirmedAt).toLocaleString("pt-BR") : "-"}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-6 text-center">
                <ShoppingCart className="mx-auto mb-3 text-violet-300" size={28} />
                <p className="font-black text-white">Nenhuma compra confirmada ainda.</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Quando o pagamento for confirmado no painel, a compra aparecerá aqui.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
