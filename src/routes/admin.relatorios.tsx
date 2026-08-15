import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Receipt, TrendingUp, Truck, Store } from "lucide-react";
import { fetchPedidosPorPeriodo, brl } from "@/lib/cardapio";
import {
  calcularIntervalo,
  calcularMetricas,
  deslocarReferencia,
  rotuloIntervalo,
  PERIODO_LABEL,
  type Periodo,
} from "@/lib/relatorios";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Cardápio Digital" },
      {
        name: "description",
        content: "Pedidos, faturamento, entregas e produtos vendidos por dia, semana, mês ou ano.",
      },
    ],
  }),
  component: Relatorios,
});

const PERIODOS: Periodo[] = ["dia", "semana", "mes", "ano"];

function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [referencia, setReferencia] = useState(() => new Date());

  const { inicio, fim } = useMemo(() => calcularIntervalo(periodo, referencia), [periodo, referencia]);

  const { data: pedidosDoPeriodo = [] } = useQuery({
    queryKey: ["pedidos", "periodo", periodo, inicio.toISOString(), fim.toISOString()],
    queryFn: () => fetchPedidosPorPeriodo(inicio, fim),
  });

  const metricas = useMemo(() => calcularMetricas(pedidosDoPeriodo), [pedidosDoPeriodo]);

  const cards = [
    { label: "Pedidos", value: String(metricas.totalPedidos), icon: Receipt },
    { label: "Faturamento", value: brl(metricas.faturamento), icon: TrendingUp },
    { label: "Entregas", value: String(metricas.entregas), icon: Truck },
    { label: "Retiradas", value: String(metricas.retiradas), icon: Store },
  ];

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl">Relatórios</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Filtre por período e acompanhe pedidos, faturamento e produtos vendidos.
      </p>

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
            <PopoverContent className="w-auto p-0" align="center">
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <c.icon className="size-4" strokeWidth={1.5} />
              {c.label}
            </div>
            <p className="mt-3 truncate text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="panel mt-8 p-5">
        <h2 className="text-sm font-semibold">Produtos vendidos</h2>
        {metricas.produtosVendidos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma venda no período.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Produto</th>
                  <th className="pb-2 font-medium">Quantidade</th>
                  <th className="pb-2 text-right font-medium">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {metricas.produtosVendidos.map((p) => (
                  <tr key={p.nome} className="border-b border-border last:border-0">
                    <td className="py-2">{p.nome}</td>
                    <td className="py-2">{p.quantidade}</td>
                    <td className="py-2 text-right">{brl(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}