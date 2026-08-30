import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { brl, fetchPedidosFechados, TAMANHO_LABEL, TIPO_ENTREGA_LABEL } from "@/lib/cardapio";
import {
  calcularIntervalo,
  deslocarReferencia,
  filtrarPedidosPorIntervalo,
  rotuloIntervalo,
  PERIODO_LABEL,
  type Periodo,
} from "@/lib/relatorios";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

const PERIODOS: Periodo[] = ["dia", "semana", "mes", "ano"];

function Historico() {
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [referencia, setReferencia] = useState(() => new Date());

  const { data: todosPedidos = [] } = useQuery({
    queryKey: ["pedidos", "fechados"],
    queryFn: fetchPedidosFechados,
  });

  const { inicio, fim } = useMemo(
    () => calcularIntervalo(periodo, referencia),
    [periodo, referencia],
  );

  const filtrados = useMemo(
    () => filtrarPedidosPorIntervalo(todosPedidos, inicio, fim),
    [todosPedidos, inicio, fim],
  );

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
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-border p-1">
          {PERIODOS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                periodo === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReferencia((r) => deslocarReferencia(periodo, r, -1))}
            aria-label="Período anterior"
            className="size-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="mx-auto size-4" strokeWidth={1.5} />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium capitalize transition-colors hover:bg-accent">
                <CalendarDays className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                {rotuloIntervalo(periodo, referencia)}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={referencia}
                onSelect={(date) => date && setReferencia(date)}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          <button
            onClick={() => setReferencia((r) => deslocarReferencia(periodo, r, 1))}
            aria-label="Próximo período"
            className="size-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
          >
            <ChevronRight className="mx-auto size-4" strokeWidth={1.5} />
          </button>
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
              <span
                className={
                  pedido.origem === "balcao"
                    ? "rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                    : "rounded-md border border-primary/30 bg-primary-soft px-1.5 py-0.5 text-[11px] text-primary"
                }
              >
                {pedido.origem === "balcao" ? "Balcão" : "Online"}
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