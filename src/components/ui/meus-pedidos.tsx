import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardList, X } from "lucide-react";
import { fetchPedidoPorId, brl, TIPO_ENTREGA_LABEL } from "@/lib/cardapio";
import { listarPedidosLocais, removerPedidoLocal } from "@/lib/pedidos-locais";
import { StatusPedido } from "@/components/status-badge";

export function MeusPedidos() {
  const [aberto, setAberto] = useState(false);
  const salvos = listarPedidosLocais();

  const resultados = useQueries({
    queries: salvos.map((p) => ({
      queryKey: ["pedido", p.id],
      queryFn: () => fetchPedidoPorId(p.id),
      enabled: aberto,
      staleTime: 10_000,
    })),
  });

  // Remove do localStorage pedidos que não existem mais no banco (ex: apagados manualmente)
  resultados.forEach((r, i) => {
    if (r.isFetched && r.data === null) {
      removerPedidoLocal(salvos[i].id);
    }
  });

  const pedidosValidos = resultados
    .map((r) => r.data)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (salvos.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
      >
        <ClipboardList className="size-4" strokeWidth={1.5} />
        Meus pedidos
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/50"
          onClick={() => setAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-background"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Meus pedidos recentes</h2>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="mx-auto size-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {pedidosValidos.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum pedido recente encontrado neste dispositivo.
                </p>
              )}

              <div className="space-y-3">
                {pedidosValidos.map((pedido) => (
                  <Link
                    key={pedido.id}
                    to="/pedido/$id"
                    params={{ id: pedido.id }}
                    onClick={() => setAberto(false)}
                    className="panel block p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        #{pedido.id.slice(0, 6)} ·{" "}
                        {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                      </span>
                      <StatusPedido status={pedido.status} tipoEntrega={pedido.tipo_entrega} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {TIPO_ENTREGA_LABEL[pedido.tipo_entrega]}
                      </span>
                      <span className="text-sm font-medium">{brl(pedido.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}