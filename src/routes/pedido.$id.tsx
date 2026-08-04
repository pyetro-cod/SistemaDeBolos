import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Store, Truck } from "lucide-react";
import {
  brl,
  fetchPedidoPorId,
  STATUS_FLUXO,
  STATUS_LABEL,
  TAMANHO_LABEL,
  TIPO_ENTREGA_LABEL,
  FORMA_PAGAMENTO_LABEL,
} from "@/lib/cardapio";
import { useRealtimePedidos } from "@/hooks/use-realtime";
import { StatusPedido } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Acompanhar pedido — Sweet Cake" },
      { name: "description", content: "Acompanhe o status do seu pedido em tempo real." },
    ],
  }),
  component: AcompanharPedido,
});

function AcompanharPedido() {
  const { id } = Route.useParams();
  useRealtimePedidos();

  const { data: pedido, isLoading } = useQuery({
    queryKey: ["pedido", id],
    queryFn: () => fetchPedidoPorId(id),
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 pb-10">
      <header className="sticky top-0 z-20 -mx-5 border-b border-border bg-background/85 px-5 py-4 backdrop-blur">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Sweet Cake
        </Link>
      </header>

      <section className="pt-6">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando pedido…</p>}
        {!isLoading && !pedido && (
          <p className="panel p-6 text-center text-sm text-muted-foreground">
            Não encontramos esse pedido.
          </p>
        )}

        {pedido && (
          <article className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Pedido #{pedido.id.slice(0, 6)} ·{" "}
                {new Date(pedido.criado_em).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <StatusPedido status={pedido.status} />
            </div>

            <ol className="mt-5 flex items-center gap-2">
              {STATUS_FLUXO.map((s, idx) => {
                const atual = STATUS_FLUXO.indexOf(pedido.status);
                const feito = idx <= atual;
                return (
                  <li key={s} className="flex flex-1 flex-col gap-1.5">
                    <span
                      className={cn(
                        "h-1 rounded-full transition-colors",
                        feito ? "bg-primary" : "bg-muted",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px]",
                        feito ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {STATUS_LABEL[s]}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                {pedido.tipo_entrega === "entrega" ? (
                  <Truck className="size-3.5" strokeWidth={1.5} />
                ) : (
                  <Store className="size-3.5" strokeWidth={1.5} />
                )}
                {TIPO_ENTREGA_LABEL[pedido.tipo_entrega]}
              </span>
              {pedido.endereco && <span>{pedido.endereco}</span>}
              <span>Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.forma_pagamento]}</span>
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
              {pedido.itens_pedido?.map((i) => (
                <li key={i.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {i.quantidade}× {i.nome_produto} ({TAMANHO_LABEL[i.tamanho]})
                  </span>
                  <span>{brl(i.preco_unitario * i.quantidade)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{brl(pedido.total)}</span>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
