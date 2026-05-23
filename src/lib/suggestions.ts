import type { Database } from "@/integrations/supabase/types";

export type SuggestionType = Database["public"]["Enums"]["suggestion_type"];
export type SuggestionPriority = Database["public"]["Enums"]["suggestion_priority"];
export type SuggestionStatus = Database["public"]["Enums"]["suggestion_status"];
export type UserKind = Database["public"]["Enums"]["user_kind"];

export const TYPE_LABELS: Record<SuggestionType, string> = {
  sugestao: "Sugestão",
  reclamacao: "Reclamação",
  elogio: "Elogio",
  duvida: "Dúvida",
};

export const PRIORITY_LABELS: Record<SuggestionPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const STATUS_LABELS: Record<SuggestionStatus, string> = {
  nova: "Nova",
  em_analise: "Em análise",
  em_andamento: "Em andamento",
  respondida: "Respondida",
  arquivada: "Arquivada",
};

export const KIND_LABELS: Record<UserKind, string> = {
  aluno: "Aluno(a)",
  responsavel: "Pai / Responsável",
  professor: "Professor(a)",
  coordenacao: "Coordenação",
  admin: "Administração",
};

export const PRIORITY_TONE: Record<SuggestionPriority, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-primary/15 text-primary",
  alta: "bg-accent/20 text-accent",
  urgente: "bg-destructive/20 text-destructive",
};

export const STATUS_TONE: Record<SuggestionStatus, string> = {
  nova: "bg-primary/15 text-primary",
  em_analise: "bg-accent/15 text-accent",
  em_andamento: "bg-accent/20 text-accent",
  respondida: "bg-success/15 text-success",
  arquivada: "bg-muted text-muted-foreground",
};

/* ============================================================
 * VOXIA — Comandos NGL inteligentes
 * Permitem o aluno enviar com atalhos rápidos no campo "Título".
 * ============================================================ */
export type CommandSpec = {
  command: string;
  description: string;
  apply?: {
    type?: SuggestionType;
    priority?: SuggestionPriority;
    isAnonymous?: boolean;
  };
};

export const COMMANDS: CommandSpec[] = [
  { command: "/anon",     description: "Enviar de forma 100% anônima",   apply: { isAnonymous: true } },
  { command: "/idea",     description: "Sugerir uma ideia de melhoria",   apply: { type: "sugestao" } },
  { command: "/report",   description: "Reportar problema ou denúncia",    apply: { type: "reclamacao", priority: "alta" } },
  { command: "/event",    description: "Sugerir um evento escolar",        apply: { type: "sugestao" } },
  { command: "/priority", description: "Marcar como urgente",              apply: { priority: "urgente" } },
  { command: "/elogio",   description: "Enviar um elogio",                  apply: { type: "elogio" } },
  { command: "/duvida",   description: "Fazer uma dúvida",                  apply: { type: "duvida" } },
  { command: "/help",     description: "Ver todos os comandos" },
];

/** Detecta um comando no início do texto e devolve o spec + texto restante. */
export function parseCommand(text: string): { spec: CommandSpec; rest: string } | null {
  const match = text.match(/^\s*(\/[a-zA-Z]+)\s*(.*)$/s);
  if (!match) return null;
  const spec = COMMANDS.find((c) => c.command.toLowerCase() === match[1].toLowerCase());
  if (!spec) return null;
  return { spec, rest: match[2] };
}
