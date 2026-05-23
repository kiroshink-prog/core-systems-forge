import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Radio,
  ShieldCheck,
  BarChart3,
  Sparkles,
  GraduationCap,
  Users,
  Building2,
  ArrowRight,
  Zap,
  Terminal,
  Trophy,
  Bot,
} from "lucide-react";
import { COMMANDS } from "@/lib/suggestions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VOXIA — A voz que move a escola" },
      {
        name: "description",
        content:
          "VOXIA é a plataforma inteligente de sugestões escolares: comandos rápidos, moderação por IA, gamificação e dashboards em tempo real.",
      },
      { property: "og:title", content: "VOXIA — A voz que move a escola" },
      {
        property: "og:description",
        content: "Caixa de sugestões inteligente, segura e cinematográfica para a sua escola.",
      },
    ],
  }),
  component: Landing,
});

const PROFILES = [
  { icon: GraduationCap, label: "Estudantes", desc: "Envie ideias, denúncias e elogios com comandos rápidos e modo anônimo." },
  { icon: Users, label: "Professores", desc: "Respondam oficialmente, atualizem status e construam confiança." },
  { icon: Building2, label: "Administração", desc: "Controle total, relatórios em tempo real e moderação por IA." },
];

const FEATURES = [
  { icon: Terminal, title: "Comandos NGL", desc: "/anon, /idea, /report, /event — envie em segundos como num chat." },
  { icon: Bot, title: "Moderação por IA", desc: "Filtro automático contra spam, ataques e toxicidade. Escola protegida." },
  { icon: Trophy, title: "Gamificação", desc: "XP, medalhas e ranking mensal para premiar quem constrói a escola." },
  { icon: BarChart3, title: "Dashboard em tempo real", desc: "Categorias, prioridades, taxa de satisfação e relatórios automáticos." },
  { icon: ShieldCheck, title: "Privacidade radical", desc: "RLS, criptografia e modo anônimo garantido por design." },
  { icon: Zap, title: "Velocidade absurda", desc: "Carregamento instantâneo e respostas em menos de um segundo." },
];

const STATS = [
  { value: "9", label: "Comandos inteligentes" },
  { value: "<1s", label: "Tempo de resposta" },
  { value: "100%", label: "Anonimato garantido" },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-extrabold tracking-tight">VOXIA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm" className="bg-hero text-primary-foreground shadow-glow hover:opacity-95">
                Criar conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 pb-24 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by AI · Plataforma escolar de nova geração
            </div>
            <h1 className="mt-7 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              A voz que <span className="text-gradient">move</span>
              <br />a sua escola.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              VOXIA é a caixa de sugestões inteligente com comandos rápidos no estilo NGL,
              moderação por IA, gamificação e dashboards em tempo real.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="bg-hero text-primary-foreground shadow-glow hover:opacity-95">
                  Começar agora <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-border bg-card/40 backdrop-blur">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>

          {/* Live terminal preview */}
          <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card-soft p-2 shadow-glow">
            <div className="rounded-xl border border-border/60 bg-background/60 p-5 font-mono text-sm">
              <div className="mb-4 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
                <span className="ml-3 text-xs text-muted-foreground">voxia · nova mensagem</span>
              </div>
              <p><span className="text-primary">/anon</span> <span className="text-foreground/90">o banheiro do 2º andar precisa de manutenção urgente</span></p>
              <p className="mt-2 text-muted-foreground">→ <span className="text-accent">Anônimo</span> · <span className="text-primary">Infraestrutura</span> · <span className="text-destructive">Urgente</span></p>
              <p className="mt-2 text-success">✓ enviado · aguardando coordenação</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card-soft p-5 text-center shadow-soft">
                <p className="font-display text-3xl font-extrabold text-gradient md:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commands */}
      <section className="container mx-auto px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sistema NGL</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Comandos que falam por você</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Digite um comando, escreva sua mensagem e pronto. Rápido como mandar uma DM.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COMMANDS.map((c) => (
              <div key={c.command} className="rounded-xl border border-border bg-card-soft p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
                <code className="rounded-md bg-primary/15 px-2 py-1 text-sm font-semibold text-primary">{c.command}</code>
                <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section className="container mx-auto px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
            Um sistema. <span className="text-gradient">Três experiências.</span>
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROFILES.map((p) => (
              <div key={p.label} className="group rounded-2xl border border-border bg-card-soft p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-hero group-hover:text-primary-foreground">
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{p.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Recursos premium</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Construído para impressionar</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card-soft p-6 shadow-soft">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-3xl border border-border bg-card-soft p-10 text-center shadow-glow">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-glow opacity-80" />
            <div className="relative">
              <Radio className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
                Sua escola pronta para o <span className="text-gradient">futuro</span>.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Cadastro gratuito em menos de 30 segundos. Sem cartão.
              </p>
              <Link to="/auth" search={{ mode: "signup" }} className="mt-7 inline-block">
                <Button size="lg" className="bg-hero text-primary-foreground shadow-glow hover:opacity-95">
                  Ativar VOXIA na minha escola <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} <span className="font-display font-bold text-foreground">VOXIA</span> · A voz que move a escola.
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-hero shadow-glow">
      <Radio className="h-5 w-5 text-primary-foreground" />
    </div>
  );
}
