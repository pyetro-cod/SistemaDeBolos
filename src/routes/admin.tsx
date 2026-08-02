import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ChefHat,
  History,
  LogOut,
  Loader2,
} from "lucide-react";
import { useRealtimePedidos } from "@/hooks/use-realtime";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminGate,
});

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/cardapio", label: "Cardápio", icon: BookOpen },
  { to: "/admin/comandas", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/cozinha", label: "Cozinha", icon: ChefHat },
  { to: "/admin/historico", label: "Histórico", icon: History },
] as const;

function AdminGate() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"carregando" | "ok">("carregando");

  useEffect(() => {
    let ativo = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!ativo) return;
      if (!session) navigate({ to: "/auth", replace: true });
      else setEstado("ok");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      if (!data.session) navigate({ to: "/auth", replace: true });
      else setEstado("ok");
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (estado === "carregando") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AdminLayout />;
}

function AdminLayout() {
  useRealtimePedidos();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }


  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-5 md:flex">
        <Link to="/" className="px-2 text-sm font-semibold">
          Cardápio Digital
        </Link>
        <p className="mt-1 px-2 text-xs text-muted-foreground">Queiroz Bolos</p>
        <nav className="mt-6 space-y-0.5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: "exact" in l ? l.exact : false }}
              activeProps={{ className: "bg-primary-soft text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-accent" }}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
            >
              <l.icon className="size-4" strokeWidth={1.5} />
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={sair}
          className="mt-auto flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          Sair
        </button>
      </aside>


      <div className="min-w-0 flex-1">
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: "exact" in l ? l.exact : false }}
              activeProps={{ className: "bg-primary-soft text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm"
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={sair}
            className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted-foreground"
          >
            Sair
          </button>
        </nav>

        <Outlet />
      </div>
    </div>
  );
}
