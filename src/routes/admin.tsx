import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ChefHat,
  History,
  LogOut,
  Loader2,
  Bell,
  BellOff,
  Store,
  Wallet,
  BarChart3,
} from "lucide-react";
import {
  useRealtimePedidos,
  useNotificacoesPedidos,
  somAtivo,
  definirSomAtivo,
} from "@/hooks/use-realtime";
import { fetchPedidosAtivos } from "@/lib/cardapio";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminGate,
});

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/cardapio", label: "Cardápio", icon: BookOpen },
  { to: "/admin/comandas", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/cozinha", label: "Cozinha", icon: ChefHat },
  { to: "/admin/balcao", label: "Venda no balcão", icon: Store },
  { to: "/admin/faturamento", label: "Faturamento", icon: Wallet },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
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
  const { setSomLigado } = useNotificacoesPedidos();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [som, setSom] = useState(true);

  useEffect(() => {
    const atual = somAtivo();
    setSom(atual);
    setSomLigado(atual);
  }, [setSomLigado]);

  const { data: pedidosAtivos = [] } = useQuery({
    queryKey: ["pedidos", "ativos"],
    queryFn: fetchPedidosAtivos,
    refetchInterval: 15000,
  });
  const pendentes = pedidosAtivos.filter((p) => p.status === "recebido" && !p.visualizado).length;

  function alternarSom() {
    const novo = !som;
    setSom(novo);
    definirSomAtivo(novo);
    setSomLigado(novo);
  }

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-5 md:flex">
        <div className="flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <img
              src="/logo.png"
              alt="Queiroz Bolos"
              className="size-6 rounded-full object-cover shrink-0"
            />
            <span>Cardápio Digital</span>
          </Link>
          <button
            type="button"
            onClick={alternarSom}
            aria-label={som ? "Desativar som de notificação" : "Ativar som de notificação"}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent"
          >
            {som ? (
              <Bell className="size-4" strokeWidth={1.5} />
            ) : (
              <BellOff className="size-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 px-2">
          <img
            src="/logo.png"
            alt="Queiroz Bolos"
            className="size-5 rounded-full object-cover shrink-0"
          />
          <span className="text-xs font-medium text-muted-foreground">Queiroz Bolos</span>
        </div>
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
              {l.to === "/admin/comandas" && pendentes > 0 && (
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-destructive text-[11px] font-medium text-destructive-foreground">
                  {pendentes}
                </span>
              )}
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
          <Link
            to="/"
            className="mr-1 flex shrink-0 items-center gap-1.5 border-r border-border pr-2"
          >
            <img src="/logo.png" alt="Queiroz Bolos" className="size-6 rounded-full object-cover" />
          </Link>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: "exact" in l ? l.exact : false }}
              activeProps={{ className: "bg-primary-soft text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className={cn("relative shrink-0 rounded-lg px-3 py-1.5 text-sm")}
            >
              {l.label}
              {l.to === "/admin/comandas" && pendentes > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {pendentes}
                </span>
              )}
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
