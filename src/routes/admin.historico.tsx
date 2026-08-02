import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { brl, fetchPedidosFechados, TAMANHO_LABEL, TIPO_ENTREGA_LABEL } from "@/lib/cardapio";

export const Route = createFileRoute("/admin/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de pedidos — Cardápio Digital" },
      {
        name: "description",
        content: "Consulte pedidos concluídos por data e confira o faturamento do período.",
      },
      { property: "og:title", content: "Histórico de pedidos — Cardápio Digital" },
      { property: "og:description", content: "Pedidos concluídos com filtro por data." },
    ],
  }),
  component: Historico,
});

function Historico() {
  const [data, setData] = useState("");
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos", "fechados"],
    queryFn: fetchPedidosFechados,
  });

  const filtrados = data
    ? pedidos.filter((p) => p.atualizado_em.slice(0, 10) === data)
    : pedidos;
  const total = filtrados.reduce((a, p) => a + p.total, 0);

  return (
    <main className="px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Histórico</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtrados.length} pedido(s) · {brl(total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
          />
          {data && (
            <button
              onClick={() => setData("")}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filtrados.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground">
            Nenhum pedido concluído nesse período.
          </p>
        )}
        {filtrados.map((pedido) => (
          <article key={pedido.id} className="panel p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">{pedido.nome_cliente || "Cliente"}</span>
              <span className="text-xs text-muted-foreground">
                {TIPO_ENTREGA_LABEL[pedido.tipo_entrega]}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(pedido.atualizado_em).toLocaleString("pt-BR")}
              </span>
              <span className="ml-auto text-sm font-medium">{brl(pedido.total)}</span>
            </div>
            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
              {pedido.itens_pedido?.map((i) => (
                <li key={i.id}>
                  {i.quantidade}× {i.nome_produto} ({TAMANHO_LABEL[i.tamanho]})
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
