"use client";

import Image from "next/image";
import { Copy, CreditCard, ExternalLink, LockKeyhole, QrCode, ShoppingCart, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [customerPhone, setCustomerPhone] = useState("");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [gatewayPayment, setGatewayPayment] = useState<GatewayPayment | null>(null);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const pixPaymentRef = useRef<HTMLDivElement | null>(null);

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
      setPurchaseStatus("");
    });
  }, []);

  useEffect(() => {
    if (!gatewayPayment) return;

    window.setTimeout(() => {
      pixPaymentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, [gatewayPayment]);

  async function handleCreatePurchase() {
    if (!email.trim().includes("@") || !robloxUser.trim() || customerPhone.replace(/\D/g, "").length < 10) {
      setPurchaseStatus("Informe email, usuario Roblox e telefone antes de gerar o pagamento.");
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

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch("/api/purchases", {
        body: JSON.stringify({
          accountEmail: normalizedAccountIdentifier,
          customerEmail: email,
          robloxUser,
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
        signal: controller.signal,
      });
      const responseText = await response.text();
      const data = responseText && responseText.trim().startsWith("{") ? JSON.parse(responseText) as {
        error?: string;
        payment?: GatewayPayment;
      } : null;

      if (!response.ok) {
        setPurchaseStatus(data?.error ?? (responseText.slice(0, 160) || "Nao foi possivel gerar o pedido."));
        return;
      }

      if (paymentMethod === "card") {
        setPurchaseStatus("Solicitacao recebida com sucesso. O prazo e de 3 a 5 dias uteis.");
        return;
      }

      if (!data?.payment?.pixCopyPaste && !data?.payment?.pixQrCode && !data?.payment?.paymentUrl) {
        setPurchaseStatus("Pagamento criado, mas o QR Code nao foi retornado. Tente gerar novamente em alguns segundos.");
        return;
      }

      setGatewayPayment(data.payment);
      setPurchaseStatus("Pagamento gerado. Pague o PIX para liberar sua compra automaticamente.");
    } catch (error) {
      setPurchaseStatus(
        error instanceof DOMException && error.name === "AbortError"
          ? "A gateway demorou para responder. Tente gerar o pagamento novamente."
          : error instanceof SyntaxError
            ? "A API retornou uma resposta invalida. Tente novamente."
            : "Nao foi possivel gerar o pagamento agora. Tente novamente."
      );
    } finally {
      window.clearTimeout(timeout);
      setIsCreatingPurchase(false);
    }
  }

  return (
    <main className="checkout-page min-h-screen overflow-x-hidden bg-[#05040a] text-white">
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

      <header className="checkout-header relative z-10 border-b border-white/[.06] bg-[#05040a]/72 px-3 py-4 backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 items-center justify-between gap-4">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              window.location.href = "/";
            }}
            className="brand-logo inline-flex min-w-0 origin-left items-center gap-1 rounded-lg text-xl font-black tracking-normal transition duration-200 hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-violet-400/50 sm:text-2xl"
          >
            <span className="brand-word brand-word-white drop-shadow-[0_0_12px_rgba(255,255,255,.18)]">Kurt</span>
            <span className="brand-word brand-word-purple drop-shadow-[0_0_14px_rgba(168,85,247,.45)]">Blox</span>
            <span className="brand-word brand-word-purple ml-1 drop-shadow-[0_0_14px_rgba(168,85,247,.45)]">Store</span>
          </a>
        </div>
      </header>

      <section className="checkout-shell relative z-10 flex min-h-[calc(100vh-73px)] w-full min-w-0 flex-col items-stretch gap-4 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:grid lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start lg:py-6">
        <Card className="checkout-card w-full min-w-0 overflow-hidden border-violet-400/20 bg-[#0b0714]/92 p-4 shadow-[0_24px_90px_rgba(0,0,0,.34)] backdrop-blur sm:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(168,85,247,.17),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(34,197,94,.10),transparent_24%)]" />
          <CardHeader className="relative z-10 min-w-0">
            <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Pagamento</p>
            <CardTitle className="mt-1 text-[1.7rem] uppercase leading-tight sm:text-3xl">Finalizar compra</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Escolha a forma de pagamento, revise os dados e gere o Pix pela gateway.
            </p>
          </CardHeader>

          <CardContent className="relative z-10 mt-4 min-w-0 space-y-4 sm:space-y-5">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {[
                { id: "pix" as const, title: "PIX", text: "Pagamento rapido com QR Code", icon: QrCode, disabled: false },
                { id: "card" as const, title: "Cartao", text: "Serviço indisponível", icon: CreditCard, disabled: true },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={cn(
                    "flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 sm:gap-4 sm:p-4",
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
                  <span className="min-w-0">
                    <strong className="block text-sm font-black text-white">{method.title}</strong>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">{method.text}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="block min-w-0">
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
              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Usuario Roblox</span>
                <input value={robloxUser} onChange={(event) => setRobloxUser(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="Seu nick no Roblox" />
              </label>
              <label className="block min-w-0">
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
              <div className="grid min-w-0 gap-4">
                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                  <label className="block min-w-0">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Nome no cartao</span>
                    <input value={cardHolderName} onChange={(event) => setCardHolderName(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="Nome impresso no cartao" />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Status</span>
                    <input readOnly value="Analise manual em 3 a 5 dias uteis" className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-zinc-400 outline-none" />
                  </label>
                </div>

                <div className="grid min-w-0 gap-4 md:grid-cols-[1fr_120px]">
                  <label className="block min-w-0">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Numero do cartao</span>
                    <input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="0000 0000 0000 0000" inputMode="numeric" />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-500">Validade</span>
                    <input value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70" placeholder="MM/AA" />
                  </label>
                </div>
              </div>
            ) : (
              null
            )}

            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[.035] p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="min-w-0 flex-1">
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

        <aside className={cn("checkout-summary min-w-0 space-y-4 lg:sticky lg:top-24", gatewayPayment ? "order-first lg:order-none" : "")}>
          <Card className="checkout-card w-full min-w-0 overflow-hidden border-violet-400/20 bg-[#0b0714]/92 p-4 shadow-[0_24px_90px_rgba(0,0,0,.34)] backdrop-blur sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,.14),transparent_34%),radial-gradient(circle_at_70%_35%,rgba(34,197,94,.10),transparent_28%)]" />
            <CardHeader className={cn("relative z-10 items-center text-center", gatewayPayment ? "pb-3" : "")}>
              {gatewayPayment ? (
                <div className="w-full rounded-2xl border border-emerald-300/25 bg-emerald-400/[.08] px-4 py-3">
                  <div className="flex items-center justify-center gap-2 text-emerald-100">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15 ring-1 ring-emerald-300/20">
                      <QrCode size={18} />
                    </span>
                    <div className="text-left">
                      <CardTitle className="text-lg">Pix gerado</CardTitle>
                      <p className="text-[11px] font-black uppercase tracking-[.12em] text-emerald-200/80">Pague para liberar a compra</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid h-24 place-items-center">
                    <span className="relative block h-[92px] w-[92px] drop-shadow-[0_0_18px_rgba(34,197,94,.34)]">
                      <Image src={selectedPackage.image} alt="" fill priority sizes="92px" quality={68} className="object-contain" />
                    </span>
                  </div>
                  <CardTitle className="text-3xl">{finalRobuxAmount}</CardTitle>
                  <p className="text-xs font-black uppercase tracking-[.14em] text-zinc-500">Robux</p>
                </>
              )}
            </CardHeader>

            <CardContent className="relative z-10 space-y-3">
              {gatewayPayment ? (
                <div ref={pixPaymentRef} className="scroll-mt-4 rounded-3xl border border-emerald-300/35 bg-[linear-gradient(180deg,rgba(16,185,129,.20),rgba(124,58,237,.10))] p-4 text-center shadow-[0_22px_70px_rgba(16,185,129,.18)] sm:scroll-mt-6">
                  {gatewayPayment.pixQrCode || gatewayPayment.pixCopyPaste ? (
                    <div className="mx-auto mb-4 w-fit rounded-[30px] bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,.45)] ring-4 ring-emerald-300/25">
                      <img
                        src={getQrCodeImageSrc(gatewayPayment.pixQrCode, gatewayPayment.pixCopyPaste)}
                        alt="QR Code PIX"
                        className="h-[min(68vw,14rem)] w-[min(68vw,14rem)] rounded-2xl object-contain sm:h-64 sm:w-64 lg:h-60 lg:w-60"
                      />
                    </div>
                  ) : null}

                  {gatewayPayment.pixCopyPaste ? (
                    <div className="rounded-2xl border border-white/10 bg-[#05040a]/78 p-3 text-left">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[.14em] text-emerald-100">Pix copia e cola</span>
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard?.writeText(gatewayPayment.pixCopyPaste ?? "")}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-black text-white shadow-[0_10px_24px_rgba(16,185,129,.24)] transition hover:brightness-110"
                        >
                          <Copy size={13} />
                          Copiar
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={gatewayPayment.pixCopyPaste}
                        className="h-16 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-xs font-semibold leading-5 text-zinc-200 outline-none sm:h-20"
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
