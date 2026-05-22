import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MessageSquareHeart, LayoutDashboard, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { KIND_LABELS } from "@/lib/suggestions";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, profile, isStaff, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { to: "/dashboard", label: "Minhas sugestões", icon: LayoutDashboard },
    ...(isStaff ? [{ to: "/admin", label: "Painel da escola", icon: ShieldCheck }] : []),
  ] as const;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="border-b p-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-hero shadow-glow">
              <MessageSquareHeart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold">Escuta de Verdade</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <div className="rounded-lg bg-sidebar-accent p-3 text-sm">
            <p className="font-semibold truncate">{profile?.full_name || user.email}</p>
            <p className="text-xs text-muted-foreground">
              {profile ? KIND_LABELS[profile.kind] : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
            className="mt-2 w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-hero">
              <MessageSquareHeart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">EscutaEscola</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <nav className="flex gap-1 border-b bg-card px-2 py-2 md:hidden">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto max-w-6xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
