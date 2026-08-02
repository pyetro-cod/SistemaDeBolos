import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Truck, Store } from "lucide-react";
import {
  avancarStatus,
  fetchPedidosAtivos,
  proximoStatus,
  STATUS_FLUXO,
  STATUS_LABEL,
  TAMANHO_LABEL,
} from "@/lib/cardapio";

export const Route = createFileRoute("/admin/cozinha")({
  head: () => ({
    meta: [
      { title: "Painel de produção (KDS) — Cardápio Digital" },
      {
        name: "description",
        content: "Kanban de pedidos por status, otimizado para a tela da confeitaria.",
      },
      { property: "og:title", content: "Painel de produção (KDS) — Cardápio Digital" },
      { property: "og:description", content: "Kanban de pedidos por status para a produção." },
    ],
  }),
  component: Cozinha,
});

function Cozinha() {
  const queryClient = useQueryClient();
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos", "ativos"],
    queryFn: fetchPedidosAtivos,
  });

  const avancar = useMutation({
    mutationFn: avancarStatus,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Pedido movido");
    },
  });

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl">Painel de produção</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Atualização automática conforme os pedidos chegam.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_FLUXO.map((status) => {
          const lista = pedidos.filter((p) => p.status === status);
          return (
            <section key={status} className="rounded-lg border border-border bg-sidebar p-3">
              <header className="flex items-center justify-between px-1 pb-3">
                <h2 className="text-sm font-semibold">{STATUS_LABEL[status]}</h2>
                <span className="text-xs text-muted-foreground">{lista.length}</span>
              </header>

              <div className="space-y-2">
                {lista.map((pedido) => {
                  const next = proximoStatus(pedido.status);
                  return (
                    <article key={pedido.id} className="panel p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {pedido.nome_cliente || "Cliente"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {pedido.tipo_entrega === "entrega" ? (
                            <Truck className="size-3.5" strokeWidth={1.5} />
                          ) : (
                            <Store className="size-3.5" strokeWidth={1.5} />
                          )}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {pedido.itens_pedido?.map((i) => (
                          <li key={i.id}>
                            {i.quantidade}× {i.nome_produto} ({TAMANHO_LABEL[i.tamanho]})
                            {i.observacoes && (
                              <span className="block text-xs text-warning">{i.observacoes}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {next && (
                        <button
                          onClick={() => avancar.mutate(pedido)}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                        >
                          {STATUS_LABEL[next]}
                          <ArrowRight className="size-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                    </article>
                  );
                })}
                {lista.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">Vazio</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
