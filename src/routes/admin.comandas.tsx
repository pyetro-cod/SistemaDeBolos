import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Truck,
  Store,
  Sparkles,
} from "lucide-react";
import {
  avancarStatus,
  brl,
  fetchPedidosAtivos,
  marcarVisualizado,
  proximoStatus,
  statusLabel,
  TAMANHO_LABEL,
  TIPO_ENTREGA_LABEL,
  FORMA_PAGAMENTO_LABEL,
} from "@/lib/cardapio";
import {
  calcularIntervalo,
  deslocarReferencia,
  filtrarPedidosPorIntervalo,
  rotuloIntervalo,
  PERIODO_LABEL,
  type Periodo,
} from "@/lib/relatorios";
import { StatusPedido } from "@/components/status-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

const PERIODOS: Periodo[] = ["dia", "semana", "mes", "ano"];

function Pedidos() {
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [referencia, setReferencia] = useState(() => new Date());

  const { data: todosPedidosAtivos = [] } = useQuery({
    queryKey: ["pedidos", "ativos"],
    queryFn: fetchPedidosAtivos,
  });

  const { inicio, fim } = useMemo(() => calcularIntervalo(periodo, referencia), [periodo, referencia]);

  // Mais recente primeiro + filtrado pelo período selecionado.
  const pedidos = useMemo(() => {
    const filtrados = filtrarPedidosPorIntervalo(todosPedidosAtivos, inicio, fim);
    return [...filtrados].sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
    );
  }, [todosPedidosAtivos, inicio, fim]);

  const avancar = useMutation({
    mutationFn: avancarStatus,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Status atualizado");
    },
  });

  const naoVistos = todosPedidosAtivos
    .filter((p) => p.status === "recebido" && !p.visualizado)
    .map((p) => p.id);

  useEffect(() => {
    if (naoVistos.length === 0) return;
    const t = setTimeout(() => {
      marcarVisualizado(naoVistos).then(() => queryClient.invalidateQueries());
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naoVistos.join(",")]);

  return (
    <main className="px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Pedidos ativos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pedidos.length} pedido(s) em andamento.
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
        {pedidos.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground">
            Nenhum pedido em aberto nesse período.
          </p>
        )}
        {pedidos.map((pedido) => {
          const next = proximoStatus(pedido.status);
          const novo = pedido.status === "recebido" && !pedido.visualizado;
          return (
            <article
              key={pedido.id}
              className={cn("panel p-5", novo && "border-primary/50 ring-1 ring-primary/30")}
            >
              <div className="flex flex-wrap items-center gap-3">
                {novo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    <Sparkles className="size-3" strokeWidth={1.5} />
                    Novo pedido
                  </span>
                )}
                <span className="text-sm font-semibold">{pedido.nome_cliente || "Cliente"}</span>
                <StatusPedido status={pedido.status} tipoEntrega={pedido.tipo_entrega} />
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
                  Avançar para {statusLabel(next, pedido.tipo_entrega)}
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