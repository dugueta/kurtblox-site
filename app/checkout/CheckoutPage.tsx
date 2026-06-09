"use client";

import Image from "next/image";
import { Copy, CreditCard, ExternalLink, LockKeyhole, QrCode, ShoppingCart, Tag } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RobuxPackage } from "@/data/packages";
import { readStoredAccount, startAccountDeletionWatcher } from "@/lib/account-session";
import { cn } from "@/lib/utils";

type PaymentMethod = "pix" | "card";

type GatewayPayment = {
  paymentUrl?: string;
  pixCopyPaste?: string;
  pixQrCode?: string;
};

function parsePrice(price: string) {
  return Number(price.replace("R$", "").replace(".", "").replace(",", ".").trim());
}

function parseRobuxAmount(amount: string) {
  return Number(amount.replace(/\D/g, ""));
}

function formatRobux(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;

  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getQrCodeImageSrc(qrCode?: string, pixCopyPaste?: string) {
  if (!qrCode && pixCopyPaste) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(pixCopyPaste)}`;
  }

  if (!qrCode) return "";

  if (qrCode.startsWith("data:")) return qrCode;
  if (qrCode.startsWith("http://") || qrCode.startsWith("https://")) return qrCode;

  return `data:image/png;base64,${qrCode}`;
}

export function CheckoutPage({ selectedPackage }: { selectedPackage: RobuxPackage }) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [email, setEmail] = useState("");
  const [robloxUser, setRobloxUser] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [gatewayPayment, setGatewayPayment] = useState<GatewayPayment | null>(null);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const basePrice = parsePrice(selectedPackage.price);
  const total = basePrice;
  const baseRobux = parseRobuxAmount(selectedPackage.amount);
  const couponBonusRobux = couponApplied ? Math.round(baseRobux * 0.25) : 0;
  const finalRobux = baseRobux + couponBonusRobux;
  const finalRobuxAmount = couponApplied ? formatRobux(finalRobux) : selectedPackage.amount;
  const normalizedAccountIdentifier = accountIdentifier.trim() || email.trim();

  useEffect(() => {
    if (paymentMethod === "card") {
      setPaymentMethod("pix");
    }
  }, [paymentMethod]);

  function handleApplyCoupon() {
    const cleanCoupon = coupon.trim().toUpperCase();

    if (!cleanCoupon) {
      setCouponApplied("");
      return;
    }

    if (cleanCoupon !== "KURTLIVE" && cleanCoupon !== "LIVEKURT") {
      setCouponApplied("");
      setPurchaseStatus("Cupom invalido. Use KURTLIVE para ganhar 25% a mais de Robux.");
      return;
    }

    setPurchaseStatus("");
    setCouponApplied(cleanCoupon);
  }

  useEffect(() => {
    const savedAccount = readStoredAccount();

    if (!savedAccount) {
      setIsLogged(false);
      return;
    }

    setIsLogged(true);
    setAccountIdentifier(savedAccount.email || savedAccount.name || "");
    setEmail(savedAccount.email?.includes("@") ? savedAccount.email : "");

    return startAccountDeletionWatcher((account) => {
      if (account) {
        setIsLogged(true);
        setAccountIdentifier(account.email || account.name || "");
        setEmail((currentEmail) => {
          const nextEmail = account.email?.includes("@") ? account.email : "";

          return currentEmail.trim() || currentEmail === nextEmail ? currentEmail : nextEmail;
        });
        return;
      }

      setIsLogged(false);
      setAccountIdentifier("");
      setEmail("");
      setPurchaseStatus("Sua conta foi removida. Faca login novamente.");
    });
  }, []);

  async function handleCreatePurchase() {
    if (!isLogged) {
      setPurchaseStatus("Faca login para continuar comprando.");
      return;
    }

    if (!email.trim().includes("@") || !robloxUser.trim() || customerDocument.replace(/\D/g, "").length < 11 || customerPhone.replace(/\D/g, "").length < 10) {
      setPurchaseStatus("Informe email, usuario Roblox, CPF e telefone antes de gerar o pagamento.");
      return;
    }

    const cleanCardNumber = cardNumber.replace(/\D/g, "");

    if (paymentMethod === "card" && (!cardHolderName.trim() || cleanCardNumber.length < 13 || !cardExpiry.trim())) {
      setPurchaseStatus("Informe nome no cartao, numero e validade antes de continuar.");
      return;
    }

    setIsCreatingPurchase(true);
    setPurchaseStatus("");
    setGatewayPayment(null);

    const response = await fetch("/api/purchases", {
      body: JSON.stringify({
        accountEmail: normalizedAccountIdentifier,
        customerEmail: email,
        robloxUser,
        customerDocument,
        customerPhone,
        cardHolderName: paymentMethod === "card" ? cardHolderName : undefined,
        cardLast4: paymentMethod === "card" ? cleanCardNumber.slice(-4) : undefined,
        packageId: selectedPackage.id,
        amount: finalRobuxAmount,
        price: selectedPackage.price,
        total: formatPrice(total),
        paymentMethod,
        coupon: couponApplied,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await response.json();

    setIsCreatingPurchase(false);

    if (!response.ok) {
      setPurchaseStatus(data.error ?? "Nao foi possivel gerar o pedido.");
      return;
    }

    if (paymentMethod === "card") {
    setPurchaseStatus("Solicitacao recebida com sucesso. O prazo e de 3 a 5 dias uteis.");
      return;
    }

    setGatewayPayment(data.payment ?? null);
    setPurchaseStatus("Pagamento gerado. Pague o PIX para liberar sua compra automaticamente.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#05040a] text-white">
      <div className="pointer-events-none fixed inset-0">
        <Image
          src="/fundo-robux.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={55}
          className="scale-105 object-cover opacity-[.24] blur-[2px] saturate-125"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-[#05040a]/62" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(124,58,237,.28),transparent_36%),radial-gradient(circle_at_86%_22%,rgba(34,197,94,.14),transparent_24%),linear-gradient(180deg,rgba(5,4,10,.16),#05040a_84%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[.10] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <header className="relative z-10 border-b border-white/[.06] bg-[#05040a]/72 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              window.location.href = "/";
            }}
            className="brand-logo inline-flex origin-left items-center gap-1 rounded-lg text-xl font-black tracking-normal transition duration-200 hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-violet-400/50 sm:text-2xl"
          >
            <span className="brand-word brand-word-white drop-shadow-[0_0_12px_rgba(255,255,255,.18)]">Kurt</span>
            <span className="brand-word brand-word-purple drop-shadow-[0_0_14px_rgba(168,85,247,.45)]">Blox</span>
            <span className="brand-word brand-word-purple ml-1 drop-shadow-[0_0_14px_rgba(168,85,247,.45)]">Store</span>
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-start gap-5 px-5 py-4 sm:py-5 lg:grid-cols-[minmax(0,1fr)_430px] lg:py-6">
        <Card className="overflow-hidden border-violet-400/20 bg-[#0b0714]/92 p-5 shadow-[0_24px_90px_rgba(0,0,0,.34)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(168,85,247,.17),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(34,197,94,.10),transparent_24%)]" />
          <CardHeader className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Pagamento</p>
            <CardTitle className="mt-1 text-2xl uppercase sm:text-3xl">Finalizar compra</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Escolha a forma de pagamento, revise os dados e gere o Pix pela gateway.
            </p>
          </CardHeader>

          <CardContent className="relative z-10 mt-4 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: "pix" as const, title: "PIX", text: "Pagamento rapido com QR Code", icon: QrCode, disabled: false },
                { id: "card" as const, title: "Cartao", text: "Servico indisponivel", icon: CreditCard, disabled: true },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-55",
                    paymentMethod === method.id
                      ? "border-violet-400/70 bg-violet-500/[.10]"
                      : "border-white/10 bg-white/[.035] hover:border-violet-400/35"
                  )}
                  disabled={method.disabled}
                  onClick={() => {
                    if (method.disabled) return;
                    setPaymentMethod(method.id);
                  }}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-200 ring-1 ring-violet-400/15">
                    <method.icon size={20} />
                  </span>
                  <span>
                    <strong className="block text-sm font-black text-white">{method.title}</strong>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">{method.text}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                  placeholder="seuemail@gmail.com"
                  type="email"
                />
                {isLogged && normalizedAccountIdentifier ? (
                  <span className="mt-2 block text-[11px] font-bold text-zinc-600">Conta: {normalizedAccountIdentifier}</span>
                ) : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Usuario Roblox</span>
                <input value={robloxUser} onChange={(event) => setRobloxUser(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="Seu nick no Roblox" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">CPF</span>
                <input
                  value={customerDocument}
                  onChange={(event) => setCustomerDocument(formatCpf(event.target.value))}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Telefone</span>
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(formatPhone(event.target.value))}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                  placeholder="11 99999-9999"
                  inputMode="numeric"
                  maxLength={13}
                />
              </label>
            </div>

            {paymentMethod === "card" ? (
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Nome no cartao</span>
                    <input value={cardHolderName} onChange={(event) => setCardHolderName(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="Nome impresso no cartao" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Status</span>
                    <input readOnly value="Analise manual em 3 a 5 dias uteis" className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-zinc-400 outline-none" />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_120px]">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Numero do cartao</span>
                    <input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="0000 0000 0000 0000" inputMode="numeric" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Validade</span>
                    <input value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="MM/AA" />
                  </label>
                </div>
              </div>
            ) : (
              null
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-zinc-500">
                    <Tag size={14} />
                    Cupom
                  </label>
                  <input
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#05040a]/50 px-4 text-sm font-semibold uppercase text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                    placeholder="Digite seu cupom"
                  />
                </div>
                <Button className="sm:mt-7" variant="outline" type="button" onClick={handleApplyCoupon}>
                  Aplicar
                </Button>
              </div>
              {couponApplied ? <p className="mt-3 text-xs font-bold text-emerald-300">Cupom {couponApplied} aplicado: +25% de Robux neste produto.</p> : null}
            </div>
          </CardContent>
        </Card>

        <aside className={cn("space-y-4 lg:sticky lg:top-24", gatewayPayment ? "order-first lg:order-none" : "")}>
          <Card className="overflow-hidden border-violet-400/20 bg-[#0b0714]/92 p-5 shadow-[0_24px_90px_rgba(0,0,0,.34)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,.14),transparent_34%),radial-gradient(circle_at_70%_35%,rgba(34,197,94,.10),transparent_28%)]" />
            <CardHeader className="relative z-10 items-center text-center">
              <div className="grid h-24 place-items-center">
                <span className="relative block h-[92px] w-[92px] drop-shadow-[0_0_18px_rgba(34,197,94,.34)]">
                  <Image src={selectedPackage.image} alt="" fill priority sizes="92px" quality={68} className="object-contain" />
                </span>
              </div>
              <CardTitle className="text-3xl">{finalRobuxAmount}</CardTitle>
              <p className="text-xs font-black uppercase tracking-[.14em] text-zinc-500">Robux</p>
            </CardHeader>

            <CardContent className="relative z-10 space-y-3">
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-zinc-500">Pacote</span>
                <strong>{selectedPackage.price}</strong>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Bonus</span>
                <span className="text-right">
                  <strong className="block text-fuchsia-300">{selectedPackage.bonus}</strong>
                  <span className="mt-1 block text-xs font-black uppercase text-violet-200/80">{selectedPackage.bonusNote}</span>
                </span>
              </div>
              {couponApplied ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Cupom</span>
                  <strong className="text-emerald-300">+{formatRobux(couponBonusRobux)} Robux</strong>
                </div>
              ) : null}
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase text-zinc-500">Total</span>
                <strong className="text-2xl">{formatPrice(total)}</strong>
              </div>

              <Button className="mt-3 w-full" variant="premium" type="button" onClick={() => void handleCreatePurchase()} disabled={isCreatingPurchase}>
                <ShoppingCart size={17} />
                Gerar pagamento
              </Button>

              {purchaseStatus ? <p className="text-center text-xs font-bold leading-5 text-violet-200">{purchaseStatus}</p> : null}

              {gatewayPayment ? (
                <div className="rounded-3xl border border-emerald-300/25 bg-[linear-gradient(180deg,rgba(16,185,129,.14),rgba(124,58,237,.08))] p-4 text-center shadow-[0_18px_60px_rgba(16,185,129,.12)]">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
                      <QrCode size={17} />
                    </span>
                    <div className="text-left">
                      <strong className="block text-sm font-black text-white">Pague com Pix</strong>
                      <span className="block text-[11px] font-bold text-emerald-200/80">Escaneie ou copie o codigo</span>
                    </div>
                  </div>

                  {gatewayPayment.pixQrCode || gatewayPayment.pixCopyPaste ? (
                    <div className="mx-auto mb-4 w-fit rounded-[28px] bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,.38)] ring-4 ring-emerald-300/20">
                      <img
                        src={getQrCodeImageSrc(gatewayPayment.pixQrCode, gatewayPayment.pixCopyPaste)}
                        alt="QR Code PIX"
                        className="h-52 w-52 rounded-2xl object-contain sm:h-56 sm:w-56"
                      />
                    </div>
                  ) : null}

                  {gatewayPayment.pixCopyPaste ? (
                    <div className="rounded-2xl border border-white/10 bg-[#05040a]/72 p-3 text-left">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[.14em] text-zinc-500">Pix copia e cola</span>
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard?.writeText(gatewayPayment.pixCopyPaste ?? "")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-white/[.06] px-2 text-xs font-black text-zinc-200 transition hover:bg-white/[.10]"
                        >
                          <Copy size={13} />
                          Copiar
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={gatewayPayment.pixCopyPaste}
                        className="h-20 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-xs font-semibold leading-5 text-zinc-200 outline-none"
                      />
                    </div>
                  ) : null}

                  {gatewayPayment.paymentUrl ? (
                    <a
                      href={gatewayPayment.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-white transition hover:brightness-110"
                    >
                      <ExternalLink size={16} />
                      Abrir pagamento
                    </a>
                  ) : null}
                </div>
              ) : null}

              <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold leading-5 text-zinc-500">
                <LockKeyhole size={14} />
                {paymentMethod === "card" ? "Solicitacao registrada para analise manual." : "Pagamento processado pela Paradise."}
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
