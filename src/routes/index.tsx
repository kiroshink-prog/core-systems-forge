import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  MessageSquareHeart,
  ShieldCheck,
  BarChart3,
  Sparkles,
  GraduationCap,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Escuta de Verdade — Plataforma de comunicação escolar" },
      {
        name: "description",
        content:
          "Plataforma educacional para alunos, famílias e equipe escolar enviarem e acompanharem sugestões, reclamações e elogios com transparência.",
      },
      { property: "og:title", content: "Escuta de Verdade — Comunicação escolar inteligente" },
      {
        property: "og:description",
        content: "Caixa de sugestões inteligente para a comunidade escolar.",
      },
    ],
  }),
  component: Landing,
});

const PROFILES = [
  { icon: GraduationCap, label: "Alunos", desc: "Voz ativa e segura no dia a dia escolar." },
  { icon: Users, label: "Famílias", desc: "Acompanhamento direto e respostas oficiais." },
  { icon: Building2, label: "Equipe escolar", desc: "Gestão centralizada e relatórios." },
];

const FEATURES = [
  { icon: MessageSquareHeart, title: "Envio rápido", desc: "Categoria, prioridade e modo anônimo em um único formulário fluido." },
  { icon: ShieldCheck, title: "Privacidade total", desc: "Cada usuário só vê o que pode. Banco protegido por RLS e criptografia." },
  { icon: BarChart3, title: "Painel inteligente", desc: "Relatórios automáticos por categoria, status e prioridade em tempo real." },
];

const STATS = [
  { value: "100%", label: "Mensagens registradas" },
  { value: "< 1s", label: "Tempo de resposta" },
  { value: "24/7", label: "Disponibilidade" },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-hero shadow-glow">
              <MessageSquareHeart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Escuta de Verdade</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm" className="bg-hero shadow-glow hover:opacity-95">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary-glow/15 blur-3xl" />
        </div>

        <div className="container mx-auto px-6 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma educacional de comunicação
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
              A caixa de sugestões que
              <br className="hidden md:block" />{" "}
              <span className="text-primary">escuta de verdade</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Alunos, famílias e equipe escolar enviam ideias, reclamações e elogios em segundos.
              A coordenação acompanha tudo em um painel inteligente — com categorias, prioridades e respostas oficiais.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="bg-hero shadow-glow hover:opacity-95">
                  Começar agora <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth"><Button size="lg" variant="outline">Já tenho conta</Button></Link>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {["Sem custo para começar", "Dados criptografados", "LGPD-friendly"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 rounded-2xl border bg-card-soft p-6 shadow-soft">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl font-bold text-primary md:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section className="container mx-auto px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-2xl font-bold md:text-3xl">
            Feito para toda a comunidade escolar
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PROFILES.map((p) => (
              <div key={p.label} className="group rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{p.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card-soft p-6 shadow-soft">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-3xl bg-hero p-10 text-center text-primary-foreground shadow-glow">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Comece hoje a transformar a comunicação da sua escola
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Cadastro gratuito em menos de 1 minuto. Sem cartão de crédito.
          </p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-block">
            <Button size="lg" variant="secondary" className="shadow-soft">
              Criar conta gratuita <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Escuta de Verdade — Construído com cuidado para a comunidade escolar.
      </footer>
    </div>
  );
}
