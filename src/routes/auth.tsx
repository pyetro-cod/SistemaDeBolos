import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChefHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no painel — Cardápio Digital" },
      {
        name: "description",
        content: "Acesse o painel do lojista para gerenciar cardápio, comandas e cozinha.",
      },
      { property: "og:title", content: "Entrar no painel — Cardápio Digital" },
      { property: "og:description", content: "Login do lojista do Cardápio Digital." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/admin", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Sign-up is disabled in Supabase Auth; admin accounts are created in the dashboard.
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="panel w-full max-w-md p-8">
        <div className="flex items-center gap-2 text-primary">
          <ChefHat className="size-5" strokeWidth={1.75} />
          <span className="text-sm font-semibold">Painel do lojista</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Área restrita. O cardápio do cliente continua aberto normalmente para os clientes.
        </p>

        <form onSubmit={handleEmail} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary/50"
              placeholder="voce@restaurante.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary/50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="pill flex w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    </main>
  );
}
