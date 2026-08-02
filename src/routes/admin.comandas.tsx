import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Clock, Truck, Store } from "lucide-react";
import {
  avancarStatus,
  brl,
  fetchPedidosAtivos,
  proximoStatus,
  STATUS_LABEL,
  TAMANHO_LABEL,
  TIPO_ENTREGA_LABEL,
  FORMA_PAGAMENTO_LABEL,
} from "@/lib/cardapio";
import { StatusPedido } from "@/components/status-badge";

export const Route = createFileRoute("/admin/comandas")({
  head: () => ({
    meta: [
      { title: "Pedidos ativos — Cardápio Digital" },
      {
        name: "description",
        content: "Acompanhe os pedidos em andamento e avance o status até a entrega.",
      },
      { property: "og:title", content: "Pedidos ativos — Cardápio Digital" },
      { property: "og:description", content: "Pedidos em andamento, em tempo real." },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  const queryClient = useQueryClient();
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos", "ativos"],
    queryFn: fetchPedidosAtivos,
  });

  const avancar = useMutation({
    mutationFn: avancarStatus,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Status atualizado");
    },
  });

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl">Pedidos ativos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pedidos.length} pedido(s) em andamento.
      </p>

      <div className="mt-6 space-y-3">
        {pedidos.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground">
            Nenhum pedido em aberto agora.
          </p>
        )}
        {pedidos.map((pedido) => {
          const next = proximoStatus(pedido.status);
          return (
            <article key={pedido.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">{pedido.nome_cliente || "Cliente"}</span>
                <StatusPedido status={pedido.status} />
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  {pedido.tipo_entrega === "entrega" ? (
                    <Truck className="size-3.5" strokeWidth={1.5} />
                  ) : (
                    <Store className="size-3.5" strokeWidth={1.5} />
                  )}
                  {TIPO_ENTREGA_LABEL[pedido.tipo_entrega]}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" strokeWidth={1.5} />
                  {new Date(pedido.criado_em).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="ml-auto text-sm font-medium">{brl(pedido.total)}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                {pedido.telefone && <span>Tel: {pedido.telefone}</span>}
                {pedido.endereco && <span>Endereço: {pedido.endereco}</span>}
                <span>Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.forma_pagamento]}</span>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
                {pedido.itens_pedido?.map((i) => (
                  <li key={i.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {i.quantidade}× {i.nome_produto} ({TAMANHO_LABEL[i.tamanho]})
                      {i.observacoes ? ` — ${i.observacoes}` : ""}
                    </span>
                    <span>{brl(i.preco_unitario * i.quantidade)}</span>
                  </li>
                ))}
              </ul>

              {next && (
                <button
                  onClick={() => avancar.mutate(pedido)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Avançar para {STATUS_LABEL[next]}
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
