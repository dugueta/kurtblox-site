"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  LockKeyhole,
  Menu,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Package = {
  amount: string;
  price: string;
  tag?: string;
  bonus?: string;
};

const packages: Package[] = [
  { amount: "400", price: "R$ 9,90" },
  { amount: "800", price: "R$ 19,90" },
  { amount: "1.700", price: "R$ 39,90" },
  { amount: "4.500", price: "R$ 99,90", tag: "POPULAR", bonus: "+15% bônus" },
  { amount: "10.000", price: "R$ 289,90", bonus: "+20% bônus" },
  { amount: "22.500", price: "R$ 559,90", bonus: "+35% bônus" },
];

const heroBenefits: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: Zap, title: "Entrega Automática", text: "Robux enviado na hora" },
  { icon: ShieldCheck, title: "Segurança Total", text: "Compra protegida" },
  { icon: Headphones, title: "Suporte 24h", text: "Atendimento rápido" },
];

const stats: Array<[string, string, LucideIcon]> = [
  ["+5000", "pedidos", Users],
  ["4.9/5", "avaliações", Star],
  ["100%", "seguro", ShieldCheck],
  ["24h", "suporte", Headphones],
];

const steps: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Escolha o pacote",
    text: "Selecione a quantidade de Robux ideal para sua conta.",
    icon: ShoppingCart,
  },
  {
    title: "Confirme os dados",
    text: "Informe sua conta e conclua o pagamento com segurança.",
    icon: LockKeyhole,
  },
  {
    title: "Receba automático",
    text: "A entrega acontece rapidamente, todos os dias.",
    icon: Clock3,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05050A] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-[-12%] top-[-18%] h-[620px] w-[620px] rounded-full bg-purple-700/25 blur-[150px]" />
        <div className="absolute left-[-18%] top-[28%] h-[460px] w-[460px] rounded-full bg-violet-800/16 blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[18%] h-[460px] w-[460px] rounded-full bg-purple-600/12 blur-[150px]" />
      </div>

      <Navbar />
      <Hero />
      <StatsBar />
      <PackagesSection />
      <HowItWorks />
      <Footer />
    </main>
  );
}

function Navbar() {
  return (
    <header className="relative z-30 mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-10">
      <a className="flex items-center gap-3" href="#">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-purple-300/45 bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] shadow-[0_0_28px_rgba(124,58,237,0.45)]">
          <span className="text-sm font-black">RB</span>
        </div>
        <div>
          <h1 className="text-lg font-black leading-none">RBX STORE</h1>
          <p className="mt-1 text-[10px] font-semibold text-zinc-500">
            Sua loja de Robux
          </p>
        </div>
      </a>

      <nav className="hidden items-center gap-8 text-sm font-semibold text-zinc-300 lg:flex">
        {["Inicio", "Robux", "Vantagens", "Como funciona", "Suporte"].map(
          (item) => (
            <a
              className="transition hover:text-white"
              href={item === "Inicio" ? "#" : `#${slugify(item)}`}
              key={item}
            >
              {item}
            </a>
          ),
        )}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <Button aria-label="Carrinho" size="icon" variant="icon">
          <ShoppingCart size={18} />
        </Button>
        <Button>
          <User size={17} />
          Entrar
        </Button>
      </div>

      <Button aria-label="Abrir menu" className="md:hidden" size="icon" variant="ghost">
        <Menu size={20} />
      </Button>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-12 px-6 pb-8 pt-4 md:px-10 lg:min-h-[560px] lg:grid-cols-[0.92fr_1.08fr]">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20"
        initial={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.6 }}
      >
        <Badge className="mb-5">
          <BadgeCheck size={15} />
          LOJA PREMIUM DE ROBUX
        </Badge>

        <h2 className="max-w-[590px] text-[42px] font-black uppercase leading-[0.98] md:text-[58px] lg:text-[64px]">
          RÁPIDO.
          <br />
          SEGURO.
          <br />
          AUTOMÁTICO.
          <br />
          <span className="text-purple-500">É ASSIM QUE DEVE SER.</span>
        </h2>

        <p className="mt-5 max-w-[500px] text-base leading-relaxed text-zinc-300">
          Robux na hora, todos os dias. Uma experiência simples, moderna e
          segura.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href="#robux">
              <ShoppingCart size={20} />
              Comprar Agora
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="#como-funciona">
              <PlayCircle size={21} />
              Como Funciona
            </a>
          </Button>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative min-h-[520px]"
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.7 }}
      >
        <HeroVisual />
      </motion.div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 top-5 grid gap-3 sm:grid-cols-3">
        {heroBenefits.map((item) => (
          <Card
            className="relative z-30 border-purple-400/18 bg-[#0D0B16]/88 p-4 shadow-[0_0_34px_rgba(124,58,237,0.16)]"
            key={item.title}
          >
            <item.icon className="mb-3 text-purple-400" size={23} />
            <h3 className="text-sm font-black">{item.title}</h3>
            <p className="mt-1 text-xs text-zinc-400">{item.text}</p>
          </Card>
        ))}
      </div>

      <div className="absolute bottom-0 right-0 h-[430px] w-[520px] rounded-[36px] border border-purple-300/10 bg-[#0D0B16]/70 shadow-[0_0_80px_rgba(124,58,237,0.22)]" />
      <div className="absolute bottom-6 right-6 h-[390px] w-[470px] rounded-full bg-[radial-gradient(circle_at_62%_48%,rgba(168,85,247,0.28),rgba(124,58,237,0.15)_40%,transparent_72%)]" />
      <div className="absolute bottom-8 right-8 h-[280px] w-[430px] rounded-full border border-purple-300/10 bg-[conic-gradient(from_230deg,transparent,rgba(168,85,247,0.24),transparent,rgba(124,58,237,0.16),transparent)]" />

      <MiniRobux className="right-[412px] top-[154px] h-14 w-14 -rotate-12" />
      <MiniRobux className="right-[96px] top-[156px] h-12 w-12 rotate-12 opacity-90" />
      <MiniRobux className="right-[48px] bottom-[130px] h-14 w-14 -rotate-6" />

      <Card className="absolute bottom-[78px] left-0 z-30 w-[390px] border-purple-300/40 bg-[#0D0B16]/92 p-5 shadow-[0_0_52px_rgba(124,58,237,0.34)]">
        <div className="flex items-center gap-5">
          <div className="grid h-[92px] w-[92px] shrink-0 place-items-center rounded-3xl border border-green-300/40 bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_0_28px_rgba(57,255,20,0.24)]">
            <span className="text-3xl font-black">R$</span>
          </div>
          <div className="min-w-0">
            <div className="mb-2 inline-flex rounded-full bg-purple-600/45 px-3 py-1 text-xs font-black text-purple-100">
              +20% bônus
            </div>
            <h3 className="text-4xl font-black leading-none">10.000</h3>
            <p className="mt-1 text-xl font-black text-purple-400">ROBUX</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="text-3xl font-black">R$289,90</p>
          <Button>
            <ShoppingCart size={17} />
            Comprar Agora
          </Button>
        </div>
      </Card>

      <img
        alt="Personagem RBX Store"
        className="absolute bottom-0 right-0 z-20 h-[430px] object-contain drop-shadow-[0_0_44px_rgba(168,85,247,0.34)]"
        src="/personagem-robux.png"
      />
    </div>
  );
}

function StatsBar() {
  return (
    <section className="relative z-20 mx-auto max-w-[1280px] px-6 md:px-10">
      <Card className="grid bg-[#0D0B16]/92 p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] md:grid-cols-4">
        {stats.map(([number, label, Icon]) => (
          <div
            className="flex items-center justify-center gap-4 border-white/10 py-3 md:border-r md:py-0 last:border-0"
            key={label}
          >
            <Icon className="text-purple-400" size={30} />
            <div>
              <p className="text-2xl font-black">{number}</p>
              <p className="text-sm text-zinc-400">{label}</p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}

function PackagesSection() {
  return (
    <section
      className="relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:px-10"
      id="robux"
    >
      <div className="mb-8 flex items-center justify-between gap-5">
        <div>
          <h2 className="text-3xl font-black uppercase">Pacotes recomendados</h2>
          <p className="mt-2 text-zinc-400">Escolha o pacote ideal para você.</p>
        </div>
        <Button className="hidden md:inline-flex" variant="ghost">
          Ver todos
          <ArrowRight size={18} />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {packages.map((pkg) => (
          <motion.article key={pkg.amount} whileHover={{ y: -6 }}>
            <Card
              className={cn(
                "relative h-full bg-[#0D0B16]/90 p-5 text-center transition",
                pkg.tag &&
                  "border-purple-400 shadow-[0_0_42px_rgba(124,58,237,0.28)]",
              )}
            >
              {pkg.tag && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-700 to-purple-500 px-5 py-2 text-xs font-black">
                  {pkg.tag}
                </span>
              )}

              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-green-500/12">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-500 text-base font-black text-white shadow-[0_0_22px_rgba(57,255,20,0.24)]">
                  R$
                </div>
              </div>

              <h3 className="text-3xl font-black leading-none">{pkg.amount}</h3>
              <p className="mt-1 font-black text-purple-400">ROBUX</p>

              {pkg.bonus && (
                <span className="mt-3 inline-block rounded-full bg-green-500/10 px-3 py-1 text-[11px] font-bold text-green-300">
                  {pkg.bonus}
                </span>
              )}

              <p className="mt-6 text-xl font-black">{pkg.price}</p>

              <Button className="mt-5 w-full">
                <ShoppingCart size={17} />
                Comprar
              </Button>
            </Card>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      className="relative z-10 mx-auto max-w-[1280px] px-6 pb-16 md:px-10"
      id="como-funciona"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-black uppercase">Como funciona</h2>
        <p className="mt-2 text-zinc-400">Processo simples, rápido e seguro.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {steps.map((step, index) => (
          <Card className="bg-[#0D0B16]/90 p-6" key={step.title}>
            <div className="mb-5 flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-600 font-black">
                {index + 1}
              </span>
              <step.icon className="text-purple-400" size={28} />
            </div>
            <h3 className="text-xl font-black">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {step.text}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="relative z-10 border-t border-white/10 px-6 py-10 md:px-10"
      id="suporte"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-6 text-zinc-400 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black text-white">RBX STORE</h2>
          <p className="mt-2 max-w-sm">
            Robux com entrega rápida, visual premium e atendimento dedicado.
          </p>
        </div>

        <div className="flex flex-wrap gap-5 text-sm font-semibold">
          {["Discord", "WhatsApp", "Termos", "Privacidade"].map((item) => (
            <a className="transition hover:text-white" href="#" key={item}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function MiniRobux({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute z-10 grid place-items-center rounded-[30%] border-[5px] border-green-200 bg-gradient-to-br from-green-300 via-emerald-500 to-green-800 text-xs font-black text-white shadow-[0_0_24px_rgba(57,255,20,0.48)]",
        className,
      )}
    >
      <span className="relative z-10">R$</span>
      <div className="absolute inset-2 rounded-[24%] border border-green-50/70" />
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}
