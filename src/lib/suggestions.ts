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
  media: "bg-primary/10 text-primary",
  alta: "bg-warning/15 text-warning",
  urgente: "bg-destructive/15 text-destructive",
};

export const STATUS_TONE: Record<SuggestionStatus, string> = {
  nova: "bg-primary/10 text-primary",
  em_analise: "bg-accent/15 text-accent-foreground",
  em_andamento: "bg-warning/15 text-warning",
  respondida: "bg-success/15 text-success",
  arquivada: "bg-muted text-muted-foreground",
};
