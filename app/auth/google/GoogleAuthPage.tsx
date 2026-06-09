"use client";

import Image from "next/image";
import { Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GoogleAuthPage({ mode }: { mode: "login" | "create" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    const response = await fetch("/api/accounts", {
      body: JSON.stringify({
        action: mode,
        email,
        name: name || "Cliente Google",
        provider: "google",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Nao foi possivel continuar.");
      return;
    }

    window.opener?.postMessage({ type: "kurtblox-google-auth", account: data.account }, window.location.origin);
    setStatus("Conta Google registrada. Voltando para a aba anterior...");

    window.setTimeout(() => {
      window.close();

      if (!window.closed) {
        window.location.href = "/";
      }
    }, 700);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#05040a] px-5 py-8 text-white">
      <div className="pointer-events-none fixed inset-0">
        <Image
          src="/fundo-robux.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover opacity-[.30] blur-[3px] saturate-150"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-[#05040a]/68" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,.28),transparent_34%),linear-gradient(180deg,rgba(5,4,10,.15),#05040a_78%)]" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <Card className="w-full border-violet-400/20 bg-[#0b0714]/95 p-6 shadow-[0_24px_90px_rgba(0,0,0,.42)]">
          <CardHeader>
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20">
              <Mail size={24} />
            </div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Google</p>
            <CardTitle className="text-2xl">
              {mode === "login" ? "Entrar com Google" : "Registrar conta Google"}
            </CardTitle>
            <p className="text-sm leading-6 text-zinc-400">
              Esta é uma etapa provisoria para cadastro social. Quando o OAuth real for conectado, o Google validará a conta automaticamente.
            </p>
          </CardHeader>

          <CardContent>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Nome</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                  placeholder="Seu nome"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Email Google</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                  placeholder="seuemail@gmail.com"
                  type="email"
                />
              </label>

              <Button className="w-full" variant="premium" type="submit" disabled={isSubmitting}>
                <ShieldCheck size={17} />
                {mode === "login" ? "Confirmar entrada" : "Confirmar cadastro"}
              </Button>

              {status ? <p className="text-sm font-bold leading-6 text-violet-200">{status}</p> : null}
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
