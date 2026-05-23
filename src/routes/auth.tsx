import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KIND_LABELS } from "@/lib/suggestions";
import type { UserKind } from "@/lib/suggestions";
import { Radio, Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Entrar — VOXIA" }] }),
  component: AuthPage,
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
  kind: z.enum(["aluno", "responsavel", "professor", "coordenacao", "admin"]),
});

const signinSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kind, setKind] = useState<UserKind>("aluno");

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (tab === "signup") {
        const parsed = signupSchema.safeParse({ fullName, email, password, kind });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.fullName, kind: parsed.data.kind },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Entrando…");
      } else {
        const parsed = signinSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha na autenticação";
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha incorretos" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-hero p-10 text-primary-foreground md:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <Link to="/" className="relative flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Radio className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">VOXIA</span>
        </Link>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/80">Plataforma escolar</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] md:text-5xl">
            A voz que move a escola.
          </h2>
          <p className="mt-5 max-w-md text-primary-foreground/85">
            Comandos rápidos no estilo NGL, moderação por IA e dashboards em tempo real.
            Sua mensagem chega. Sua escola muda.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/70">© {new Date().getFullYear()} VOXIA · A voz que move a escola</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-bold">
            {tab === "signin" ? "Entrar" : "Criar sua conta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "signin"
              ? "Acesse sua caixa de sugestões."
              : "Em segundos você já estará participando."}
          </p>

          <div className="mt-6 inline-flex rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === "signin" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >Entrar</button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === "signup" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >Cadastrar</button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {tab === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: Ana Silva" required disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kind">Você é</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as UserKind)} disabled={loading}>
                    <SelectTrigger id="kind"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KIND_LABELS) as UserKind[]).map((k) => (
                        <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" inputMode="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete={tab === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tab === "signup" ? "Mínimo 8 caracteres" : "Sua senha"} required disabled={loading} />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-hero shadow-glow transition-all hover:opacity-95 active:scale-[0.99]">
              {loading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {tab === "signin" ? "Entrando…" : "Criando conta…"}</span>
              ) : tab === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← Voltar ao início</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
