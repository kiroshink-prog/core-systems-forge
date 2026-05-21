import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PRIORITY_LABELS,
  PRIORITY_TONE,
  STATUS_LABELS,
  STATUS_TONE,
  TYPE_LABELS,
} from "@/lib/suggestions";
import type { SuggestionPriority, SuggestionStatus } from "@/lib/suggestions";
import type { Database } from "@/integrations/supabase/types";
import { Loader2, Search, Send, ShieldAlert } from "lucide-react";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type SuggestionRow = Database["public"]["Tables"]["suggestions"]["Row"];
type ResponseRow = Database["public"]["Tables"]["suggestion_responses"]["Row"];
type ProfileLite = { id: string; full_name: string; kind: Database["public"]["Enums"]["user_kind"] };

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel da escola — EscutaEscola" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const { isStaff, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<SuggestionRow[]>([]);
  const [responses, setResponses] = useState<Record<string, ResponseRow[]>>({});
  const [authors, setAuthors] = useState<Record<string, ProfileLite>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<SuggestionStatus | "todos">("todos");
  const [filterPriority, setFilterPriority] = useState<SuggestionPriority | "todos">("todos");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isStaff) {
      toast.error("Acesso restrito à equipe da escola.");
      navigate({ to: "/dashboard" });
    }
  }, [authLoading, isStaff, navigate]);

  const reload = async () => {
    setLoading(true);
    const [{ data: sg }, { data: cats }] = await Promise.all([
      supabase.from("suggestions").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    setItems(sg ?? []);
    setCategories(cats ?? []);

    if (sg?.length) {
      const ids = Array.from(new Set(sg.map((s) => s.author_id)));
      const [{ data: profs }, { data: resps }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, kind").in("id", ids),
        supabase
          .from("suggestion_responses")
          .select("*")
          .in("suggestion_id", sg.map((s) => s.id))
          .order("created_at", { ascending: true }),
      ]);
      setAuthors(Object.fromEntries((profs ?? []).map((p) => [p.id, p as ProfileLite])));
      const grouped: Record<string, ResponseRow[]> = {};
      (resps ?? []).forEach((r) => { (grouped[r.suggestion_id] ??= []).push(r); });
      setResponses(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { if (isStaff) void reload(); }, [isStaff]);

  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    return items.filter((s) => {
      if (filterStatus !== "todos" && s.status !== filterStatus) return false;
      if (filterPriority !== "todos" && s.priority !== filterPriority) return false;
      if (query) {
        const q = query.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, filterStatus, filterPriority, query]);

  const stats = useMemo(() => {
    const byStatus = items.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1; return acc;
    }, {});
    const byCategory = items.reduce<Record<string, number>>((acc, s) => {
      const name = s.category_id ? categoryById[s.category_id]?.name ?? "—" : "Sem categoria";
      acc[name] = (acc[name] ?? 0) + 1; return acc;
    }, {});
    const urgentes = items.filter((s) => s.priority === "urgente" && s.status !== "respondida" && s.status !== "arquivada").length;
    return { total: items.length, byStatus, byCategory, urgentes };
  }, [items, categoryById]);

  const updateField = async (id: string, patch: Partial<Pick<SuggestionRow, "status" | "priority">>) => {
    setSavingId(id);
    const { error } = await supabase.from("suggestions").update(patch).eq("id", id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    toast.success("Atualizado");
  };

  const sendReply = async (suggestionId: string) => {
    const { data: ures } = await supabase.auth.getUser();
    if (!ures.user) return;
    if (reply.trim().length < 1) { toast.error("Digite uma resposta"); return; }
    setSavingId(suggestionId);
    const { data, error } = await supabase
      .from("suggestion_responses")
      .insert({ suggestion_id: suggestionId, responder_id: ures.user.id, message: reply.trim() })
      .select()
      .single();
    if (!error) {
      await supabase.from("suggestions").update({ status: "respondida" }).eq("id", suggestionId);
      setResponses((prev) => ({ ...prev, [suggestionId]: [...(prev[suggestionId] ?? []), data] }));
      setItems((prev) => prev.map((s) => (s.id === suggestionId ? { ...s, status: "respondida" } : s)));
      setReply("");
      toast.success("Resposta enviada");
    } else {
      toast.error(error.message);
    }
    setSavingId(null);
  };

  if (authLoading || !isStaff) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Painel da escola</h1>
          <p className="mt-1 text-muted-foreground">Gerencie, classifique e responda às mensagens.</p>
        </div>
        {stats.urgentes > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            <ShieldAlert className="h-4 w-4" />
            {stats.urgentes} urgente{stats.urgentes > 1 ? "s" : ""} aguardando
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Novas" value={stats.byStatus["nova"] ?? 0} accent="primary" />
        <Stat label="Em andamento" value={(stats.byStatus["em_analise"] ?? 0) + (stats.byStatus["em_andamento"] ?? 0)} accent="warning" />
        <Stat label="Respondidas" value={stats.byStatus["respondida"] ?? 0} accent="success" />
      </div>

      {/* Report by category */}
      {Object.keys(stats.byCategory).length > 0 && (
        <section className="rounded-2xl border bg-card-soft p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Por categoria</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => {
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{name}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-hero" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título ou mensagem…" className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {(Object.keys(STATUS_LABELS) as SuggestionStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda prioridade</SelectItem>
            {(Object.keys(PRIORITY_LABELS) as SuggestionPriority[]).map((p) => (
              <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Nenhuma mensagem encontrada com esses filtros.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => {
            const author = authors[s.author_id];
            const isOpen = openId === s.id;
            return (
              <li key={s.id} className="rounded-xl border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{s.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 font-medium ${STATUS_TONE[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 font-medium ${PRIORITY_TONE[s.priority]}`}>{PRIORITY_LABELS[s.priority]}</span>
                      <span className="text-muted-foreground">{TYPE_LABELS[s.type]}</span>
                      {s.category_id && categoryById[s.category_id] && (
                        <span className="text-muted-foreground">· {categoryById[s.category_id].name}</span>
                      )}
                      <span className="text-muted-foreground">· {formatDate(s.created_at)}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{s.message}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {s.is_anonymous
                        ? "Enviado anonimamente"
                        : `Por ${author?.full_name || "—"}${author?.kind ? ` (${author.kind})` : ""}`}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <Select value={s.status} onValueChange={(v) => updateField(s.id, { status: v as SuggestionStatus })}>
                    <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as SuggestionStatus[]).map((st) => (
                        <SelectItem key={st} value={st}>{STATUS_LABELS[st]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={s.priority} onValueChange={(v) => updateField(s.id, { priority: v as SuggestionPriority })}>
                    <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PRIORITY_LABELS) as SuggestionPriority[]).map((p) => (
                        <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setOpenId(isOpen ? null : s.id); setReply(""); }}
                  >
                    {responses[s.id]?.length ? `Respostas (${responses[s.id].length})` : "Responder"}
                  </Button>
                  {savingId === s.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-3 rounded-lg bg-muted/40 p-4">
                    {responses[s.id]?.map((r) => (
                      <div key={r.id} className="rounded-md bg-card p-3 text-sm">
                        <p className="whitespace-pre-wrap">{r.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                      </div>
                    ))}
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escreva uma resposta oficial…" rows={3} />
                    <Button onClick={() => sendReply(s.id)} disabled={savingId === s.id} className="bg-hero shadow-glow">
                      <Send className="mr-2 h-4 w-4" />Enviar resposta
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "primary" | "warning" | "success" }) {
  const tone = accent === "warning" ? "text-warning" : accent === "success" ? "text-success" : accent === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-xl border bg-card-soft p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
