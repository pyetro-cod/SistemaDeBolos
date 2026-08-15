import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Receipt, TrendingUp, Wallet, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { addMonths } from "date-fns";
import { fetchPedidosFechados, brl, FORMA_PAGAMENTO_LABEL } from "@/lib/cardapio";
import {
  calcularIntervalo,
  calcularMetricas,
  faturamentoUltimosMeses,
  filtrarPedidosPorIntervalo,
  rotuloIntervalo,
} from "@/lib/relatorios";

export const Route = createFileRoute("/admin/faturamento")({
  head: () => ({
    meta: [
      { title: "Faturamento mensal — Cardápio Digital" },
      {
        name: "description",
        content: "Faturamento por mês, ticket médio, produto mais vendido e formas de pagamento.",
      },
    ],
  }),
  component: FaturamentoMensal,
});

function FaturamentoMensal() {
  const [referencia, setReferencia] = useState(() => new Date());
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos", "fechados"],
    queryFn: fetchPedidosFechados,
  });

  const { inicio, fim } = calcularIntervalo("mes", referencia);
  const pedidosDoMes = useMemo(
    () => filtrarPedidosPorIntervalo(pedidos, inicio, fim),
    [pedidos, inicio, fim],
  );
  const metricas = useMemo(() => calcularMetricas(pedidosDoMes), [pedidosDoMes]);
  const historico = useMemo(() => faturamentoUltimosMeses(pedidos, 6), [pedidos]);

  const cards = [
    { label: "Faturamento do mês", value: brl(metricas.faturamento), icon: TrendingUp },
    { label: "Pedidos", value: String(metricas.totalPedidos), icon: Receipt },
    { label: "Ticket médio", value: brl(metricas.ticketMedio), icon: Wallet },
    {
      label: "Produto mais vendido",
      value: metricas.produtoMaisVendido?.nome ?? "—",
      hint: metricas.produtoMaisVendido
        ? `${metricas.produtoMaisVendido.quantidade} unidades`
        : undefined,
      icon: Flame,
    },
  ];

  return (
    <main className="px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Faturamento mensal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o desempenho financeiro mês a mês.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReferencia((r) => addMonths(r, -1))}
            aria-label="Mês anterior"
            className="size-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="mx-auto size-4" strokeWidth={1.5} />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-medium capitalize">
            {rotuloIntervalo("mes", referencia)}
          </span>
          <button
            onClick={() => setReferencia((r) => addMonths(r, 1))}
            aria-label="Próximo mês"
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
            {c.hint && <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Últimos 6 meses</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => brl(v)}
                  width={80}
                />
                <Tooltip formatter={(value) => brl(Number(value))} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Formas de pagamento</h2>
          <div className="mt-4 space-y-3">
            {metricas.formasPagamento.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem pedidos no período.</p>
            )}
            {metricas.formasPagamento.map((f) => {
              const pct =
                metricas.faturamento > 0 ? Math.round((f.total / metricas.faturamento) * 100) : 0;
              return (
                <div key={f.forma}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{FORMA_PAGAMENTO_LABEL[f.forma]}</span>
                    <span className="text-muted-foreground">
                      {brl(f.total)} · {f.quantidade} pedido(s)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}