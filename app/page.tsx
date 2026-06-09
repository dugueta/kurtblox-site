"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  LockKeyhole,
  Mail,
  Menu,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  X,
  Zap,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { packages, type PackageVisual } from "@/data/packages";
import { clearStoredAccount, readStoredAccount, startAccountDeletionWatcher, storeStoredAccount, type StoredAccount } from "@/lib/account-session";
import { cn } from "@/lib/utils";

type Feature = {
  icon: LucideIcon;
  title: string;
  text: string;
};

type ActionCard = Feature & {
  href: string;
};

type SupportMessage = {
  id: string;
  author: "client" | "admin";
  text: string;
  createdAt: string;
};

type SupportTicketStatus = "open" | "answered" | "closed";
type AuthMode = "login" | "create";

const navItems = ["Inicio", "Robux", "Vantagens", "Como funciona"];

const features: Feature[] = [
  { icon: Zap, title: "Entrega automatica", text: "Pedido processado com status claro." },
  { icon: ShieldCheck, title: "Ambiente seguro", text: "Fluxo protegido e sem etapas confusas." },
  { icon: Headphones, title: "Suporte 24h", text: "Ajuda rapida antes e depois da compra." },
];

const actionCards: ActionCard[] = [
  { icon: Headphones, title: "Suporte", text: "Atendimento rápido", href: "#suporte" },
  { icon: BadgeCheck, title: "Quem somos", text: "Loja simples e segura", href: "#quem-somos" },
];

const trustItems: Feature[] = [
  { icon: BadgeCheck, title: "Compra revisada", text: "Valores e pacote visiveis antes de finalizar." },
  { icon: LockKeyhole, title: "Pagamento seguro", text: "Estrutura pronta para Pix, cartao e saldo." },
  { icon: Star, title: "Experiencia premium", text: "Interface simples para comprar sem atrito." },
];

const howItWorksSteps = [
  "Escolha a quantidade desejada de Robux e preencha as informações de sua conta (Não pedimos a senha da conta).",
  "Realize o pagamento utilizando PIX ou cartão de crédito.",
  "Após a confirmação do pagamento, nosso sistema inicia automaticamente o processamento do seu pedido.",
  "A entrega é feita de forma rápida e automatizada, garantindo mais agilidade e praticidade para você.",
];

const howItWorksBenefits = [
  "Entrega automática",
  "Pagamento via PIX e Cartão",
  "Processo rápido e seguro",
  "Suporte dedicado",
];

const platformAdvantages = [
  {
    title: "Entrega Automatizada",
    text: "Nosso sistema foi desenvolvido para processar pedidos de forma rápida e eficiente, proporcionando uma experiência simples e prática do início ao fim.",
  },
  {
    title: "Segurança e Confiabilidade",
    text: "Utilizamos processos seguros e monitoramento constante para garantir a proteção das informações e a tranquilidade dos nossos clientes.",
  },
  {
    title: "Pagamento Simplificado",
    text: "Oferecemos opções de pagamento via PIX e cartão de crédito, permitindo que você conclua sua compra com rapidez e conveniência.",
  },
  {
    title: "Atendimento Especializado",
    text: "Nossa equipe está disponível para auxiliar em todas as etapas da compra, oferecendo suporte ágil, profissional e eficiente.",
  },
  {
    title: "Excelente Custo-Benefício",
    text: "Trabalhamos para oferecer preços competitivos, combinando economia, qualidade e uma experiência de compra diferenciada.",
  },
  {
    title: "Plataforma Moderna",
    text: "Investimos continuamente em tecnologia, desempenho e segurança para proporcionar uma plataforma rápida, estável e intuitiva.",
  },
];

const aboutText = [
  "A nossa história começou com um objetivo simples: oferecer Robux de forma rápida, segura e com preços justos para toda a comunidade Roblox.",
  "Ao longo do tempo, conquistamos a confiança de milhares de clientes e construímos uma comunidade ativa por meio do nosso site e Discord. Infelizmente, passamos por um momento difícil quando nossa infraestrutura antiga foi comprometida por um ataque malicioso, o que resultou na perda do nosso antigo site e da nossa comunidade no Discord.",
  "Mas desistir nunca foi uma opção.",
  "Transformamos esse desafio em uma oportunidade para voltar ainda mais fortes. Reformulamos nossos sistemas, investimos em mais segurança, melhoramos nossos processos e criamos uma nova plataforma pensando em oferecer uma experiência ainda melhor para nossos clientes.",
  "Hoje, continuamos com o mesmo compromisso que nos trouxe até aqui: entregar Robux com agilidade, segurança, transparência e suporte de qualidade. Cada compra é tratada com seriedade, buscando garantir a melhor experiência possível para nossos clientes.",
  "Agradecemos a todos que continuam acreditando no nosso trabalho e também àqueles que estão chegando agora. Estamos apenas começando esta nova fase e seguimos trabalhando diariamente para ser uma das melhores lojas de Robux do mercado.",
  "Seja bem-vindo à nossa nova casa. 🚀",
];

function RobuxCoin({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-9 w-9",
    md: "h-14 w-14",
    lg: "h-24 w-24",
  };

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn(
        "shrink-0 drop-shadow-[0_0_12px_rgba(34,197,94,.34)]",
        sizes[size],
        className
      )}
      role="img"
      aria-hidden="true"
    >
      <path
        d="M32 4 51.6 12.2 60 32 51.6 51.8 32 60 12.4 51.8 4 32 12.4 12.2 32 4Z"
        fill="#16e66b"
      />
      <path
        d="M32 11 46.8 17.2 53 32 46.8 46.8 32 53 17.2 46.8 11 32 17.2 17.2 32 11Z"
        fill="#06130c"
      />
      <path
        d="M32 17 42.6 21.4 47 32 42.6 42.6 32 47 21.4 42.6 17 32 21.4 21.4 32 17Z"
        fill="#16e66b"
      />
      <rect x="26" y="26" width="12" height="12" rx="1.5" fill="#06130c" />
      <path
        d="M18 24.5 32 12.2 46 24.5"
        fill="none"
        stroke="#7cff9f"
        strokeLinecap="round"
        strokeWidth="3"
        opacity=".55"
      />
    </svg>
  );
}

function RobuxImageCoin() {
  return (
    <span className="relative block h-24 w-24 shrink-0 drop-shadow-[0_0_18px_rgba(34,197,94,.38)]" aria-hidden="true">
      <Image src="/robux-card-coin.png" alt="" fill sizes="96px" quality={70} className="object-contain" />
    </span>
  );
}

function RobuxVisual({ type, image = false }: { type: PackageVisual; image?: boolean }) {
  if (image) return <RobuxImageCoin />;
  if (type === "coin") return <RobuxCoin />;

  return (
    <div className="relative h-16 w-20" aria-hidden="true">
      <RobuxCoin size="sm" className="absolute bottom-0 left-1 opacity-70" />
      <RobuxCoin size="sm" className="absolute bottom-2 left-4 opacity-85" />
      <RobuxCoin size="sm" className="absolute bottom-4 left-7" />
      {type === "pile" ? <RobuxCoin size="sm" className="absolute bottom-1 left-10 opacity-80" /> : null}
    </div>
  );
}

function RobuxPackageImage({ src }: { src: string }) {
  return (
    <span className="relative block h-20 w-20 shrink-0 drop-shadow-[0_0_14px_rgba(34,197,94,.28)] sm:h-28 sm:w-28" aria-hidden="true">
      <Image src={src} alt="" fill sizes="(max-width: 640px) 80px, 112px" quality={68} className="object-contain" />
    </span>
  );
}

export default function HomePage() {
  const [selectedId, setSelectedId] = useState("p3400");
  const [loadingLineKey, setLoadingLineKey] = useState(1);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState("");
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportReason, setSupportReason] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportTicketStatus, setSupportTicketStatus] = useState<SupportTicketStatus>("open");
  const [supportStatus, setSupportStatus] = useState("");
  const [isSupportSending, setIsSupportSending] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authStatus, setAuthStatus] = useState("");
  const [isAuthSending, setIsAuthSending] = useState(false);
  const [loggedAccount, setLoggedAccount] = useState<StoredAccount | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [purchaseGateMessage, setPurchaseGateMessage] = useState("");
  const visibleAuthStatus =
    authMode === "create" &&
    authStatus.toLowerCase().includes("conta google") &&
    authStatus.toLowerCase().includes("cadastrad")
      ? ""
      : authStatus;

  useEffect(() => {
    const storageKey = "rbx-store-visitor-id";
    const visitorId = localStorage.getItem(storageKey) ?? crypto.randomUUID();
    const savedAccount = readStoredAccount();

    localStorage.setItem(storageKey, visitorId);

    if (savedAccount) {
      setLoggedAccount(savedAccount);
    }

    void fetch("/api/analytics/access", {
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer,
        visitorId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  }, []);

  useEffect(() => {
    if (!loggedAccount) return;

    return startAccountDeletionWatcher((account) => {
      setLoggedAccount(account);

      if (!account) {
        setIsProfileMenuOpen(false);
        setPurchaseGateMessage("");
      }
    });
  }, [loggedAccount?.id]);

  useEffect(() => {
    if (!isAboutOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAboutOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAboutOpen]);

  useEffect(() => {
    if (!isSupportOpen || !supportTicketId) return;

    let active = true;

    async function loadTicket() {
      const response = await fetch(`/api/support?ticketId=${supportTicketId}`);

      if (!response.ok) return;

      const data = await response.json();

      if (active) {
        setSupportMessages(data.ticket.messages);
        setSupportTicketStatus(data.ticket.status);
      }
    }

    void loadTicket();
    const interval = window.setInterval(loadTicket, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isSupportOpen, supportTicketId]);

  useEffect(() => {
    function handleAuthMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== "kurtblox-google-auth") {
        return;
      }

      if (event.data.account) {
        storeStoredAccount(event.data.account);
        setLoggedAccount(event.data.account);
      }

      if (event.data.error) {
        setAuthStatus(event.data.error);
        return;
      }

      setAuthStatus("");
      setIsAuthOpen(false);
    }

    window.addEventListener("message", handleAuthMessage);

    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  useEffect(() => {
    if (!purchaseGateMessage) return;

    const timeout = window.setTimeout(() => setPurchaseGateMessage(""), 3500);

    return () => window.clearTimeout(timeout);
  }, [purchaseGateMessage]);

  useEffect(() => {
    if (!isAuthOpen) return;

    setIsAuthSending(false);
    setAuthStatus("");
  }, [isAuthOpen, authMode]);

  async function handleSupportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supportMessage.trim()) {
      setSupportStatus("Digite uma mensagem para o suporte.");
      return;
    }

    if (supportTicketId && supportTicketStatus === "closed") {
      setSupportStatus("Este chamado foi fechado pelo suporte.");
      return;
    }

    setIsSupportSending(true);
    setSupportStatus("");

    const payload = supportTicketId
      ? {
          ticketId: supportTicketId,
          message: supportMessage,
        }
      : {
          name: supportName,
          email: supportEmail,
          reason: supportReason,
          message: supportMessage,
        };

    const response = await fetch("/api/support", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await response.json();

    setIsSupportSending(false);

    if (!response.ok) {
      setSupportStatus(data.error ?? "Nao foi possivel enviar agora.");
      return;
    }

    setSupportTicketId(data.ticket.id);
    setSupportMessages(data.ticket.messages);
    setSupportTicketStatus(data.ticket.status);
    setSupportMessage("");
    setSupportStatus("Mensagem enviada. Nossa equipe vai acompanhar pelo painel.");
  }

  async function submitAuth(action: "create" | "login" | "forgot", provider: "email" | "google" = "email") {
    if (provider === "google") {
      const mode = action === "create" ? "create" : "login";
      window.open(`/auth/google?mode=${mode}`, "_blank", "width=520,height=720");
      return;
    }

    setIsAuthSending(true);
    setAuthStatus("");

    const email = authEmail;
    const name = authName;

    try {
      const response = await fetch("/api/accounts", {
        body: JSON.stringify({
          action,
          email,
          name,
          password: authPassword,
          provider,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setAuthStatus("Usuário ou senha incorreta");
          return;
        }

        if (response.status === 409 && typeof data.error === "string") {
          setAuthStatus(data.error.includes("Email") ? "Email existente." : "Usuário existente.");
          return;
        }

        setAuthStatus(data.error ?? "Nao foi possivel continuar.");
        return;
      }

      if (action === "forgot") {
        setAuthStatus(data.message);
        return;
      }

      storeStoredAccount(data.account);
      setLoggedAccount(data.account);
      setIsAuthOpen(false);
      setAuthStatus("");
    } catch {
      setAuthStatus("Nao foi possivel continuar.");
    } finally {
      setIsAuthSending(false);
    }
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
          className="scale-105 object-cover opacity-[.28] blur-[2px] saturate-125"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-[#05040a]/48" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(124,58,237,.26),transparent_35%),radial-gradient(circle_at_70%_35%,rgba(168,85,247,.18),transparent_28%),linear-gradient(180deg,rgba(5,4,10,.2),#05040a_86%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[.10] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none fixed inset-0 opacity-[.12] [background-image:repeating-linear-gradient(115deg,transparent_0,transparent_22px,rgba(168,85,247,.24)_23px,transparent_24px)]" />
      <div className="pointer-events-none fixed -left-28 top-24 h-24 w-[56rem] -rotate-12 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent blur-3xl" />
      <div className="pointer-events-none fixed -right-36 top-80 h-28 w-[52rem] rotate-[-18deg] bg-gradient-to-r from-transparent via-fuchsia-400/22 to-transparent blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-white/[.06] bg-[#05040a]/80 backdrop-blur-xl">
        <motion.div
          key={loadingLineKey}
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-white shadow-[0_0_18px_rgba(255,255,255,.9)]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.95, ease: "easeInOut" }}
        />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <a
            href="#inicio"
            className="brand-logo group relative inline-flex min-w-0 origin-left items-center gap-1 rounded-lg text-lg font-black tracking-normal transition duration-200 hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-violet-400/50 sm:text-2xl"
            aria-label="Voltar para o inicio"
          >
            <span className="brand-word brand-word-white drop-shadow-[0_0_12px_rgba(255,255,255,.18)]">Kurt</span>
            <span className="brand-word brand-word-purple drop-shadow-[0_0_14px_rgba(168,85,247,.45)]">Blox</span>
            <span className="brand-word brand-word-purple ml-1 drop-shadow-[0_0_14px_rgba(168,85,247,.45)]">Store</span>
          </a>

          <nav className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-center justify-center gap-8 text-sm font-semibold text-zinc-400 lg:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={item === "Vantagens" ? "#vantagens" : `#${item.toLowerCase().replaceAll(" ", "-")}`}
                className="pointer-events-auto transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" className="hidden lg:hidden" aria-label="Abrir menu">
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </header>

      <section id="inicio" className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-5 sm:pb-10 sm:pt-6">
        <div className="grid gap-5 lg:grid-cols-[350px_minmax(0,1fr)_230px] lg:gap-6">
          <motion.div className="text-center sm:text-left" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-[.14em] text-violet-200">
              <Sparkles size={14} />
              Loja automatizada
            </span>
            <h1 className="mt-4 text-[2.35rem] font-black uppercase leading-[1.02] tracking-normal text-white sm:mt-5 sm:text-5xl">
              RÁPIDO
              <br />
              SEGURO
              <br />
              AUTOMÁTICO
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-lg font-black uppercase leading-tight text-zinc-500 sm:mx-0 sm:text-xl">
              E assim que <span className="text-fuchsia-400">deve ser.</span>
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-400 sm:mx-0 sm:mt-5">
              Escolha o pacote ideal para você, confira o valor e finalize sua compra em uma experiência moderna, rápida e segura.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto grid w-full max-w-[430px] grid-cols-2 content-start gap-3 self-start lg:mx-0 lg:max-w-none"
          >
            {actionCards.map((action) => (
              action.title === "Quem somos" ? (
                <button
                  key={action.title}
                  type="button"
                  className="group block h-full w-full self-start border-0 bg-transparent p-0 text-left text-white"
                  onClick={() => setIsAboutOpen(true)}
                >
                  <Card
                    className="min-h-[138px] border-violet-400/15 bg-[#0d0918]/88 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/45 hover:bg-violet-500/[.08] sm:min-h-[160px] sm:p-5 sm:text-left"
                  >
                    <CardContent className="flex h-full flex-col items-center justify-center gap-2 sm:items-start sm:justify-center sm:gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20 transition group-hover:bg-violet-500/20 group-hover:text-white sm:h-12 sm:w-12">
                        <action.icon size={22} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-xs sm:text-base">{action.title}</CardTitle>
                        <p className="mt-1 hidden text-sm leading-6 text-fuchsia-300/80 sm:block">{action.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ) : action.title === "Suporte" ? (
                <button
                  key={action.title}
                  type="button"
                  className="group block h-full w-full self-start border-0 bg-transparent p-0 text-left text-white"
                  onClick={() => setIsSupportOpen(true)}
                >
                  <Card
                    className="min-h-[138px] border-violet-400/15 bg-[#0d0918]/88 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/45 hover:bg-violet-500/[.08] sm:min-h-[160px] sm:p-5 sm:text-left"
                  >
                    <CardContent className="flex h-full flex-col items-center justify-center gap-2 sm:items-start sm:justify-center sm:gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20 transition group-hover:bg-violet-500/20 group-hover:text-white sm:h-12 sm:w-12">
                        <action.icon size={22} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-xs sm:text-base">{action.title}</CardTitle>
                        <p className="mt-1 hidden text-sm leading-6 text-fuchsia-300/80 sm:block">{action.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ) : (
                <a
                  key={action.title}
                  href={action.href}
                  className="group block h-full self-start"
                  target={action.href.startsWith("https://") ? "_blank" : undefined}
                  rel={action.href.startsWith("https://") ? "noreferrer" : undefined}
                >
                  <Card
                    className="min-h-[138px] border-violet-400/15 bg-[#0d0918]/88 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/45 hover:bg-violet-500/[.08] sm:min-h-[160px] sm:p-5 sm:text-left"
                  >
                    <CardContent className="flex h-full flex-col items-center justify-center gap-2 sm:items-start sm:justify-center sm:gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20 transition group-hover:bg-violet-500/20 group-hover:text-white sm:h-12 sm:w-12">
                        <action.icon size={22} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-xs sm:text-base">{action.title}</CardTitle>
                        <p className="mt-1 hidden text-sm leading-6 text-fuchsia-300/80 sm:block">{action.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              )
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.12 }}
            className="relative hidden min-h-[210px] overflow-visible lg:block"
          >
            <div className="absolute inset-x-4 bottom-1 h-16 bg-violet-500/18 blur-3xl" />
            <div className="absolute left-4 top-10 h-28 w-56 -rotate-12 bg-gradient-to-r from-transparent via-violet-400/22 to-transparent blur-2xl" />
            <div className="absolute right-3 top-20 h-20 w-44 rotate-12 bg-gradient-to-r from-transparent via-emerald-300/16 to-transparent blur-2xl" />

            <Image
              src="/personagem-robux.png"
              alt="Personagem da RO Store"
              fill
              priority
              sizes="260px"
              quality={70}
              className="scale-[1.42] object-contain object-bottom translate-x-6 translate-y-7 drop-shadow-[0_22px_34px_rgba(0,0,0,.6)]"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14 }}
          id="robux"
          className="relative mt-5 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#0b0714]/95 p-3 shadow-[0_24px_90px_rgba(0,0,0,.36)] backdrop-blur sm:mt-6 sm:rounded-3xl sm:p-5"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgba(34,197,94,.14),transparent_20%),radial-gradient(circle_at_48%_0%,rgba(168,85,247,.18),transparent_30%)]" />

          <div className="relative z-10 mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Pacotes</p>
              <h2 className="mt-1 text-lg font-black uppercase tracking-wide sm:text-xl">Pacotes recomendados</h2>
            </div>
            <span className="hidden w-fit items-center gap-2 rounded-xl border border-violet-400/25 bg-white/[.04] px-3 py-2 text-[11px] font-black uppercase tracking-[.12em] text-violet-200 sm:inline-flex">
              <Star size={13} />
              Escolha e compre
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {packages.map((pkg) => {
            const isSelected = selectedId === pkg.id;

            return (
              <Card
                key={pkg.id}
                className={cn(
                  "relative cursor-pointer rounded-2xl p-3 text-left transition duration-200 hover:-translate-y-1 hover:border-violet-400/50",
                  isSelected || pkg.featured
                    ? "border-violet-400/70 bg-violet-500/[.08] shadow-[0_18px_48px_rgba(124,58,237,.22)]"
                    : "border-white/10 bg-[#0b0714]/80"
                )}
                onClick={() => setSelectedId(pkg.id)}
              >
                {pkg.featured && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-1 text-[9px] font-black uppercase sm:-top-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
                    Mais vendido
                  </span>
                )}

                <CardHeader className="items-center space-y-2 px-0 pt-1 text-center">
                  <div className="flex w-full items-center justify-between gap-2 text-[10px] font-black uppercase">
                    <span className="rounded-lg border border-emerald-300/15 bg-emerald-400/[.07] px-2 py-1 text-emerald-200">
                      {pkg.stock} em estoque
                    </span>
                    <span className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 text-zinc-400">
                      {pkg.bonusNote}
                    </span>
                  </div>
                  <div className="grid h-20 place-items-center sm:h-24">
                    <RobuxPackageImage src={pkg.image} />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">{pkg.amount}</CardTitle>
                    <p className="mt-1 text-[10px] font-black uppercase text-zinc-500">Robux</p>
                  </div>
                </CardHeader>

                <CardContent className="mt-1 px-0 pb-0">
                  <div className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-center">
                    <p className="text-[11px] font-black uppercase text-fuchsia-200">{pkg.bonus}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase text-zinc-500">Primeira compra</p>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Total</span>
                    <strong className="text-lg font-black leading-none">{pkg.price}</strong>
                  </div>
                  <a
                    href={`/checkout?package=${pkg.id}`}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 px-3 text-xs font-bold text-white shadow-[0_14px_36px_rgba(124,58,237,.42)] transition duration-200 hover:brightness-110 active:scale-[.98]"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <ShoppingCart size={16} />
                    Comprar
                  </a>
                </CardContent>
              </Card>
            );
          })}
          </div>

          <div className="relative z-10 mt-4 grid gap-2 border-t border-white/10 pt-4 md:grid-cols-3 md:gap-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3 rounded-2xl bg-white/[.035] px-3 py-3 sm:px-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15">
                  <feature.icon size={18} />
                </div>
                <div>
                  <strong className="block text-sm">{feature.title}</strong>
                  <span className="text-xs text-zinc-400">{feature.text}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="vantagens" className="relative z-10 mx-auto max-w-7xl px-4 pb-7 sm:px-5 sm:pb-8">
        <div className="overflow-hidden rounded-2xl border border-violet-400/20 bg-[#0b0714]/88 shadow-[0_24px_90px_rgba(0,0,0,.28)] backdrop-blur sm:rounded-3xl">
          <div className="relative p-5 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,.16),transparent_30%),radial-gradient(circle_at_90%_18%,rgba(34,197,94,.10),transparent_24%)]" />
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Vantagens</p>
              <h2 className="mt-2 max-w-3xl text-xl font-black uppercase tracking-wide text-white sm:text-3xl">
                Por que escolher a nossa plataforma?
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {platformAdvantages.map((advantage) => (
                  <article key={advantage.title} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:p-5">
                    <h3 className="text-base font-black text-white">{advantage.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400 sm:mt-3 sm:leading-7">{advantage.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="relative z-10 mx-auto max-w-7xl px-4 pb-10 sm:px-5 sm:pb-12">
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {trustItems.map((item) => (
            <Card key={item.title} className="border-white/10 bg-white/[.035] p-4 sm:p-5">
              <item.icon className="mb-3 text-emerald-300 sm:mb-4" size={24} />
              <CardTitle className="text-base">{item.title}</CardTitle>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
            </Card>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#0b0714]/88 shadow-[0_24px_90px_rgba(0,0,0,.28)] backdrop-blur sm:rounded-3xl">
          <div className="relative p-5 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(168,85,247,.16),transparent_30%),radial-gradient(circle_at_92%_20%,rgba(34,197,94,.10),transparent_24%)]" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Passo a passo</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-wide text-white sm:text-3xl">
                  Como Funciona?
                </h2>
                <p className="mt-3 text-base font-semibold leading-7 text-white sm:mt-4">
                  Comprar Robux conosco é simples, rápido e seguro!
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-400 sm:mt-4 sm:leading-7">
                  Nossa plataforma foi desenvolvida para oferecer uma experiência segura, transparente e eficiente,
                  permitindo que você receba seus Robux sem complicações.
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-400 sm:mt-4 sm:leading-7">
                  Além disso, contamos com suporte para auxiliar em qualquer dúvida durante o processo de compra,
                  garantindo que sua experiência seja a melhor possível.
                </p>
              </div>

              <div className="space-y-5">
                <ol className="space-y-3">
                  {howItWorksSteps.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3 sm:p-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-sm font-black text-violet-200 ring-1 ring-violet-400/25">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-zinc-300">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="grid gap-3 sm:grid-cols-2">
                  {howItWorksBenefits.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3">
                      <BadgeCheck size={18} className="shrink-0 text-emerald-300" />
                      <span className="text-sm font-bold text-zinc-100">{item}</span>
                    </div>
                  ))}
                </div>

                <p className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/[.06] px-4 py-3 text-sm font-black leading-6 text-fuchsia-200">
                  Escolha seu pacote de Robux e aproveite a melhor experiência de compra!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="suporte" className="relative z-10 border-t border-white/[.06] px-5 py-7" />

      <div
        className={cn(
          "fixed inset-x-3 bottom-5 z-40 w-auto transition duration-300 sm:inset-x-auto sm:right-4 sm:top-[46%] sm:w-[min(360px,calc(100vw-2rem))] sm:-translate-y-1/2",
          isSupportOpen ? "translate-y-0 opacity-100 sm:translate-x-0" : "translate-y-[calc(100%+1.25rem)] opacity-0 sm:translate-x-[calc(100%+1.25rem)] sm:translate-y-0"
        )}
      >
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/25 bg-[#0b0714]/96 p-2 shadow-[0_24px_90px_rgba(0,0,0,.58)] backdrop-blur-xl sm:rounded-[2rem] sm:p-3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,.20),transparent_32%),radial-gradient(circle_at_92%_24%,rgba(34,197,94,.12),transparent_24%)]" />
          <div className="relative z-10 flex max-h-[78vh] min-h-[min(520px,78vh)] flex-col rounded-[1.35rem] border border-white/10 bg-[#05040a]/72 sm:max-h-[76vh] sm:min-h-[min(600px,76vh)] sm:rounded-[1.55rem]">
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Atendimento</p>
                <h2 className="mt-1 text-lg font-black uppercase text-white">Suporte KurtBlox</h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Abra seu chamado e acompanhe pelo chat.</p>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-zinc-300 transition hover:border-violet-400/40 hover:text-white"
                aria-label="Fechar suporte"
                onClick={() => setIsSupportOpen(false)}
              >
                <X size={17} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {supportTicketId ? (
                <div className="space-y-3">
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3",
                      supportTicketStatus === "closed"
                        ? "border-red-300/15 bg-red-400/[.06]"
                        : "border-emerald-300/15 bg-emerald-400/[.06]"
                    )}
                  >
                    <p className={cn("text-sm font-black", supportTicketStatus === "closed" ? "text-red-200" : "text-emerald-200")}>
                      {supportTicketStatus === "closed" ? "Chamado fechado pelo suporte." : "Chamado enviado ao painel administrativo."}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      {supportTicketStatus === "closed" ? "Abra um novo atendimento se precisar continuar." : "Voce pode continuar mandando mensagens por aqui."}
                    </p>
                  </div>

                  {supportMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ring-1",
                        message.author === "client"
                          ? "ml-auto rounded-br-md bg-violet-500/18 text-zinc-100 ring-violet-400/20"
                          : "mr-auto rounded-bl-md bg-white/[.06] text-zinc-200 ring-white/10"
                      )}
                    >
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[.12em] text-zinc-500">
                        {message.author === "client" ? "Voce" : "Suporte"}
                      </span>
                      {message.text}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm leading-6 text-zinc-400">
                  Preencha seus dados para abrir um atendimento. O suporte usa essas informacoes para acompanhar seu pedido.
                </div>
              )}
            </div>

            <form className="space-y-3 border-t border-white/10 px-4 py-4 sm:px-5" onSubmit={handleSupportSubmit}>
              {!supportTicketId ? (
                <div className="grid gap-3">
                  <input
                    value={supportName}
                    onChange={(event) => setSupportName(event.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                    placeholder="Nome"
                  />
                  <input
                    value={supportEmail}
                    onChange={(event) => setSupportEmail(event.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                    placeholder="Email"
                    type="email"
                  />
                  <input
                    value={supportReason}
                    onChange={(event) => setSupportReason(event.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                    placeholder="Motivo do suporte"
                  />
                </div>
              ) : null}

              <div className="flex gap-2">
                <textarea
                  value={supportMessage}
                  onChange={(event) => setSupportMessage(event.target.value)}
                  className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-white/[.04] px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                  placeholder={supportTicketStatus === "closed" ? "Chamado fechado" : supportTicketId ? "Enviar nova mensagem" : "Descreva o problema"}
                  disabled={supportTicketStatus === "closed"}
                  rows={2}
                />
                <button
                  type="submit"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_10px_28px_rgba(168,85,247,.28)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={isSupportSending || supportTicketStatus === "closed"}
                  aria-label="Enviar suporte"
                >
                  <Send size={18} />
                </button>
              </div>

              {supportStatus ? <p className="text-xs font-bold leading-5 text-violet-200">{supportStatus}</p> : null}
            </form>
          </div>
        </section>
      </div>

      {!isSupportOpen ? (
        <button
          type="button"
          className="fixed bottom-4 right-4 z-40 grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/25 bg-[#0b0714]/94 text-violet-200 shadow-[0_16px_48px_rgba(0,0,0,.42)] backdrop-blur transition hover:bg-violet-500/15 hover:text-white sm:bottom-auto sm:right-0 sm:top-1/2 sm:h-auto sm:w-auto sm:-translate-y-1/2 sm:rounded-l-2xl sm:rounded-r-none sm:border-r-0 sm:px-3 sm:py-4"
          onClick={() => setIsSupportOpen(true)}
          aria-label="Abrir suporte"
        >
          <Headphones size={22} />
        </button>
      ) : null}

      <AnimatePresence>
        {purchaseGateMessage ? (
          <div
            className="pointer-events-none fixed inset-0 grid place-items-center px-4"
            style={{ zIndex: 2147483647 }}
            role="alert"
          >
            <motion.div
              className="w-[min(360px,100%)]"
              initial={{ opacity: 0, y: 42, scale: 0.96 }}
              animate={{
                opacity: [0, 1, 1, 1],
                y: [42, -10, 4, 0],
                scale: [0.96, 1.04, 0.99, 1],
              }}
              exit={{ opacity: 0, y: 42, scale: 0.96 }}
              transition={{
                opacity: { duration: 0.14, times: [0, 0.2, 0.8, 1] },
                scale: { duration: 0.46, ease: "easeOut", times: [0, 0.5, 0.78, 1] },
                y: { duration: 0.46, ease: "easeOut", times: [0, 0.5, 0.78, 1] },
              }}
            >
              <div className="relative rounded-2xl border border-red-300/35 bg-[#16070d]/98 px-5 py-4 text-center shadow-[0_28px_90px_rgba(0,0,0,.72)] backdrop-blur-xl">
                <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-red-300/35 bg-[#16070d]/98" />
                <p className="text-sm font-black text-red-200">{purchaseGateMessage}</p>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {isAuthOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#05040a]/82 px-4 py-6 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          onClick={() => setIsAuthOpen(false)}
        >
          <section
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-400/20 bg-[#0b0714]/96 shadow-[0_28px_100px_rgba(0,0,0,.58)] backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,.20),transparent_30%),radial-gradient(circle_at_90%_14%,rgba(34,197,94,.10),transparent_24%)]" />
            <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Conta</p>
                <h2 id="auth-title" className="mt-1 text-2xl font-black uppercase tracking-wide text-white">
                  {authMode === "login" ? "Entrar" : "Criar conta"}
                </h2>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-zinc-300 transition hover:border-violet-400/40 hover:text-white"
                aria-label="Fechar login"
                onClick={() => setIsAuthOpen(false)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="relative z-10 px-6 py-5">
              <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[.035] p-1">
                {(["login", "create"] as AuthMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={cn(
                      "h-10 rounded-xl text-sm font-black transition",
                      authMode === mode ? "bg-violet-500/20 text-white" : "text-zinc-500 hover:text-white"
                    )}
                    onClick={() => {
                      setAuthMode(mode);
                      setAuthStatus("");
                    }}
                  >
                    {mode === "login" ? "Entrar" : "Criar conta"}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[.04] text-sm font-black text-white transition hover:border-violet-400/40"
                  onClick={() => void submitAuth(authMode, "google")}
                  disabled={isAuthSending}
                >
                  <Mail size={18} />
                  {authMode === "login" ? "Entrar com Google" : "Criar com Google"}
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-black uppercase tracking-[.14em] text-zinc-600">Email ou usuário</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-xs font-semibold leading-5 text-zinc-500">
                Para entrar com Google, o email precisa estar cadastrado. Ao criar conta com Google, ela será registrada no painel admin.
              </p>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitAuth(authMode, "email");
                }}
              >
                {authMode === "create" ? (
                  <input
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                    placeholder="Nome"
                  />
                ) : null}
                <input
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                  placeholder="Email ou usuário"
                  type="text"
                />
                <div className="relative">
                  <input
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70"
                    placeholder="Senha"
                    type={showAuthPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[.06] hover:text-white"
                    aria-label={showAuthPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowAuthPassword((show) => !show)}
                  >
                    {showAuthPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {authMode === "login" ? (
                  <button
                    type="button"
                    className="text-sm font-bold text-violet-300 transition hover:text-white"
                    onClick={() => void submitAuth("forgot", "email")}
                    disabled={isAuthSending}
                  >
                    Esqueceu sua senha?
                  </button>
                ) : null}

                {visibleAuthStatus ? (
                  <p className={cn(
                    "rounded-xl px-3 py-2 font-bold leading-5",
                    ["Usuário ou senha incorreta", "Usuário existente.", "Email existente."].includes(visibleAuthStatus)
                      ? "border border-red-300/20 bg-red-400/10 text-xs text-red-300"
                      : "text-sm text-violet-200"
                  )}>
                    {visibleAuthStatus}
                  </p>
                ) : null}

                <Button className="w-full" variant="premium" type="submit">
                  <KeyRound size={17} />
                  {isAuthSending ? "Verificando..." : authMode === "login" ? "Entrar" : "Criar conta"}
                </Button>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      {isAboutOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#05040a]/82 px-4 py-6 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
          onClick={() => setIsAboutOpen(false)}
        >
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-violet-400/20 bg-[#0b0714]/95 shadow-[0_28px_100px_rgba(0,0,0,.58)] backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,.20),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(34,197,94,.10),transparent_24%)]" />
            <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Nossa historia</p>
                <h2 id="about-title" className="mt-1 text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
                  Quem Somos
                </h2>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                aria-label="Fechar janela Quem Somos"
                onClick={() => setIsAboutOpen(false)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="relative z-10 max-h-[calc(86vh-104px)] overflow-y-auto px-6 py-6 sm:px-8">
              <div className="space-y-4 text-[15px] leading-7 text-zinc-300">
                {aboutText.map((paragraph) => (
                  <p
                    key={paragraph}
                    className={cn(
                      paragraph === "Mas desistir nunca foi uma opção." && "font-black text-white",
                      paragraph.startsWith("Seja bem-vindo") && "font-black text-fuchsia-200"
                    )}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      ) : null}

    </main>
  );
}
