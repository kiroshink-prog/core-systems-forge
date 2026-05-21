import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MessageSquareHeart, ShieldCheck, BarChart3, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EscutaEscola — Caixa de Sugestões Inteligente" },
      { name: "description", content: "Plataforma escolar para enviar e acompanhar sugestões, reclamações e elogios com transparência." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-hero shadow-glow">
            <MessageSquareHeart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">EscutaEscola</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Entrar</Button></Link>
          <Link to="/auth" search={{ mode: "signup" }}><Button>Criar conta</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pb-20 pt-12 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Comunicação escolar com transparência
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            A caixa de sugestões que <span className="bg-hero bg-clip-text text-transparent">escuta de verdade</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Alunos, famílias e professores enviam ideias, reclamações e elogios em segundos.
            A coordenação acompanha tudo em um painel inteligente, com categorias, prioridades e respostas oficiais.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="bg-hero shadow-glow hover:opacity-95">Começar agora</Button>
            </Link>
            <Link to="/auth"><Button size="lg" variant="outline">Já tenho conta</Button></Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            { icon: MessageSquareHeart, title: "Envio rápido", desc: "Categoria, prioridade e opção anônima em um único formulário." },
            { icon: ShieldCheck, title: "Privacidade total", desc: "Cada usuário só vê o que pode. RLS no banco, criptografia de ponta." },
            { icon: BarChart3, title: "Painel inteligente", desc: "Relatórios automáticos por categoria, status e prioridade." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card-soft p-6 shadow-soft">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EscutaEscola — Construído com cuidado para a comunidade escolar.
      </footer>
    </div>
  );
}
