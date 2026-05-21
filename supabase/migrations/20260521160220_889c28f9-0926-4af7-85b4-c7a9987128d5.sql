
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.user_kind AS ENUM ('aluno', 'responsavel', 'professor', 'coordenacao', 'admin');
CREATE TYPE public.suggestion_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE public.suggestion_status AS ENUM ('nova', 'em_analise', 'em_andamento', 'respondida', 'arquivada');
CREATE TYPE public.suggestion_type AS ENUM ('sugestao', 'reclamacao', 'elogio', 'duvida');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  kind public.user_kind NOT NULL DEFAULT 'aluno',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','moderator')
  )
$$;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

INSERT INTO public.categories (name, description, color) VALUES
  ('Estrutura', 'Espaço físico, salas, banheiros, manutenção', '#0ea5e9'),
  ('Alimentação', 'Cardápio, cantina, merenda escolar', '#f59e0b'),
  ('Ensino', 'Aulas, professores, conteúdo, didática', '#8b5cf6'),
  ('Convivência', 'Relações entre alunos, bullying, clima escolar', '#ec4899'),
  ('Segurança', 'Entrada, saída, vigilância, acidentes', '#ef4444'),
  ('Tecnologia', 'Internet, equipamentos, sistemas', '#10b981'),
  ('Eventos', 'Festas, passeios, atividades extras', '#f97316'),
  ('Outros', 'Demais assuntos', '#64748b');

-- ============ SUGGESTIONS ============
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type public.suggestion_type NOT NULL DEFAULT 'sugestao',
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 150),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 4000),
  priority public.suggestion_priority NOT NULL DEFAULT 'media',
  status public.suggestion_status NOT NULL DEFAULT 'nova',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_suggestions_author ON public.suggestions(author_id);
CREATE INDEX idx_suggestions_status ON public.suggestions(status);
CREATE INDEX idx_suggestions_created ON public.suggestions(created_at DESC);

-- ============ RESPONSES ============
CREATE TABLE public.suggestion_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suggestion_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_responses_suggestion ON public.suggestion_responses(suggestion_id);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_suggestions_updated BEFORE UPDATE ON public.suggestions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kind public.user_kind;
BEGIN
  BEGIN
    _kind := COALESCE((NEW.raw_user_meta_data->>'kind')::public.user_kind, 'aluno');
  EXCEPTION WHEN OTHERS THEN
    _kind := 'aluno';
  END;

  INSERT INTO public.profiles (id, full_name, kind)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _kind
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- Profiles: user reads/updates own; staff reads all
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_roles: user reads own; only admin manages
CREATE POLICY "roles_select_own_or_admin" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "roles_admin_all" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories: any authenticated reads; admin manages
CREATE POLICY "categories_select_all" ON public.categories
FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_admin_all" ON public.categories
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Suggestions: author sees own; staff sees all
CREATE POLICY "suggestions_select_own_or_staff" ON public.suggestions
FOR SELECT TO authenticated
USING (author_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "suggestions_insert_self" ON public.suggestions
FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "suggestions_update_staff" ON public.suggestions
FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "suggestions_delete_admin" ON public.suggestions
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Responses: visible to suggestion author and staff; only staff creates
CREATE POLICY "responses_select_author_or_staff" ON public.suggestion_responses
FOR SELECT TO authenticated
USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.suggestions s WHERE s.id = suggestion_id AND s.author_id = auth.uid())
);

CREATE POLICY "responses_insert_staff" ON public.suggestion_responses
FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND responder_id = auth.uid());

CREATE POLICY "responses_delete_admin" ON public.suggestion_responses
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
