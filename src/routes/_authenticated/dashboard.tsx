import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  COMMANDS,
  PRIORITY_LABELS,
  PRIORITY_TONE,
  STATUS_LABELS,
  STATUS_TONE,
  TYPE_LABELS,
  parseCommand,
} from "@/lib/suggestions";
import type { SuggestionPriority, SuggestionType } from "@/lib/suggestions";
import type { Database } from "@/integrations/supabase/types";
import { Loader2, Send, MessageCircle, Terminal } from "lucide-react";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type SuggestionRow = Database["public"]["Tables"]["suggestions"]["Row"];
type ResponseRow = Database["public"]["Tables"]["suggestion_responses"]["Row"];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Minhas sugestões — VOXIA" }] }),
  component: Dashboard,
});

const formSchema = z.object({
  title: z.string().trim().min(3, "Título muito curto").max(150),
  message: z.string().trim().min(5, "Mensagem muito curta").max(4000),
});

function Dashboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<SuggestionRow[]>([]);
  const [responses, setResponses] = useState<Record<string, ResponseRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SuggestionType>("sugestao");
  const [priority, setPriority] = useState<SuggestionPriority>("media");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: cats }, { data: mine }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("suggestions")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setCategories(cats ?? []);
    if (cats && cats.length && !categoryId) setCategoryId(cats[0].id);
    setItems(mine ?? []);

    if (mine?.length) {
      const { data: resps } = await supabase
        .from("suggestion_responses")
        .select("*")
        .in("suggestion_id", mine.map((s) => s.id))
        .order("created_at", { ascending: true });
      const grouped: Record<string, ResponseRow[]> = {};
      (resps ?? []).forEach((r) => {
        (grouped[r.suggestion_id] ??= []).push(r);
      });
      setResponses(grouped);
    } else {
      setResponses({});
    }
    setLoading(false);
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Sistema NGL: detecta comando no início do título ou da mensagem
    let finalTitle = title;
    let finalMessage = message;
    let finalType = type;
    let finalPriority = priority;
    let finalAnon = isAnonymous;

    const cmdInTitle = parseCommand(title);
    const cmdInMsg = !cmdInTitle ? parseCommand(message) : null;
    const cmd = cmdInTitle ?? cmdInMsg;
    if (cmd) {
      if (cmd.spec.command === "/help") {
        toast.info("Comandos: " + COMMANDS.map((c) => c.command).join(" "));
        return;
      }
      if (cmd.spec.apply?.type) finalType = cmd.spec.apply.type;
      if (cmd.spec.apply?.priority) finalPriority = cmd.spec.apply.priority;
      if (cmd.spec.apply?.isAnonymous != null) finalAnon = cmd.spec.apply.isAnonymous;
      if (cmdInTitle) finalTitle = cmd.rest || title.replace(cmd.spec.command, "").trim();
      if (cmdInMsg) finalMessage = cmd.rest || message;
      if (!finalTitle) finalTitle = finalMessage.slice(0, 80);
    }

    const parsed = formSchema.safeParse({ title: finalTitle, message: finalMessage });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("suggestions").insert({
      author_id: user.id,
      title: parsed.data.title,
      message: parsed.data.message,
      type: finalType,
      priority: finalPriority,
      category_id: categoryId || null,
      is_anonymous: finalAnon,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(cmd ? `Comando ${cmd.spec.command} aplicado · enviado!` : "Enviado! Obrigado por contribuir.");
    setTitle(""); setMessage(""); setType("sugestao"); setPriority("media"); setIsAnonymous(false);
    void reload();
  };

  const stats = useMemo(() => ({
    total: items.length,
    respondidas: items.filter((i) => i.status === "respondida").length,
    andamento: items.filter((i) => i.status === "em_analise" || i.status === "em_andamento").length,
  }), [items]);

  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border bg-card-soft p-6 shadow-soft">
        <p className="text-sm font-medium text-primary">Olá{firstName ? `, ${firstName}` : ""} 👋</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Sua voz importa</h1>
        <p className="mt-1 text-muted-foreground">
          Envie sugestões, reclamações ou elogios. Acompanhe tudo aqui.
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Enviadas" value={stats.total} />
        <StatCard label="Em andamento" value={stats.andamento} accent="warning" />
        <StatCard label="Respondidas" value={stats.respondidas} accent="success" />
      </div>

      {/* Form */}
      <section className="rounded-2xl border bg-card-soft p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Nova mensagem</h2>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Terminal className="h-3.5 w-3.5" /> Comandos NGL ativos
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMANDS.map((c) => (
            <button
              type="button"
              key={c.command}
              onClick={() => setTitle((t) => (t.startsWith("/") ? c.command + " " : c.command + " " + t))}
              title={c.description}
              className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-xs text-primary hover:bg-primary/10"
            >
              {c.command}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="title">Título · dica: comece com <code className="rounded bg-primary/15 px-1 text-primary">/anon</code> ou <code className="rounded bg-primary/15 px-1 text-primary">/report</code></Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="/idea Sala de leitura no recreio…" maxLength={150} required />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as SuggestionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as SuggestionType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as SuggestionPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABELS) as SuggestionPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-2.5">
            <div>
              <Label htmlFor="anon" className="cursor-pointer">Enviar de forma anônima</Label>
              <p className="text-xs text-muted-foreground">Seu nome ficará oculto para a equipe.</p>
            </div>
            <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="msg">Mensagem</Label>
            <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={4000} placeholder="Descreva com detalhes…" required />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting} className="bg-hero shadow-glow hover:opacity-95">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Enviar mensagem</>}
            </Button>
          </div>
        </form>
      </section>

      {/* List */}
      <section>
        <h2 className="font-display text-xl font-semibold">Minhas mensagens</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Você ainda não enviou nenhuma mensagem. Use o formulário acima para começar.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((s) => (
              <li key={s.id} className="rounded-xl border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{s.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <Badge className={STATUS_TONE[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                      <Badge className={PRIORITY_TONE[s.priority]}>{PRIORITY_LABELS[s.priority]}</Badge>
                      <span className="text-muted-foreground">{TYPE_LABELS[s.type]}</span>
                      {s.category_id && categoryById[s.category_id] && (
                        <span className="text-muted-foreground">· {categoryById[s.category_id].name}</span>
                      )}
                      <span className="text-muted-foreground">· {formatDate(s.created_at)}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{s.message}</p>

                {responses[s.id]?.length ? (
                  <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <MessageCircle className="mr-1 inline h-3 w-3" /> Respostas da escola
                    </p>
                    {responses[s.id].map((r) => (
                      <div key={r.id} className="rounded-md bg-card p-3 text-sm">
                        <p className="whitespace-pre-wrap">{r.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: "warning" | "success" }) {
  const tone = accent === "warning" ? "text-warning" : accent === "success" ? "text-success" : "text-primary";
  return (
    <div className="rounded-xl border bg-card-soft p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className ?? ""}`}>{children}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
