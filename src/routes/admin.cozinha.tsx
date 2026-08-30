import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Truck, Store, Sparkles } from "lucide-react";
import {
  avancarStatus,
  fetchPedidosAtivos,
  proximoStatus,
  statusLabel,
  STATUS_FLUXO,
  TAMANHO_LABEL,
} from "@/lib/cardapio";
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

const COLUNA_LABEL: Record<(typeof STATUS_FLUXO)[number], string> = {
  recebido: "Novo pedido",
  preparo: "Em preparo",
  pronto: "Saiu / pronto p/ retirada",
  entregue: "Finalizado",
};

const PERIODOS: Periodo[] = ["dia", "semana", "mes", "ano"];

function Cozinha() {
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [referencia, setReferencia] = useState(() => new Date());

  const { data: todosPedidos = [] } = useQuery({
    queryKey: ["pedidos", "ativos"],
    queryFn: fetchPedidosAtivos,
  });

  const { inicio, fim } = useMemo(
    () => calcularIntervalo(periodo, referencia),
    [periodo, referencia],
  );

  const pedidos = useMemo(
    () => filtrarPedidosPorIntervalo(todosPedidos, inicio, fim),
    [todosPedidos, inicio, fim],
  );

  const avancar = useMutation({
    mutationFn: avancarStatus,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Pedido movido");
    },
  });

  return (
    <main className="px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Painel de produção</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualização automática conforme os pedidos chegam.
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

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_FLUXO.map((status) => {
          const lista = pedidos.filter((p) => p.status === status);
          return (
            <section key={status} className="rounded-lg border border-border bg-sidebar p-3">
              <header className="flex items-center justify-between px-1 pb-3">
                <h2 className="text-sm font-semibold">{COLUNA_LABEL[status]}</h2>
                <span className="text-xs text-muted-foreground">{lista.length}</span>
              </header>

              <div className="space-y-2">
                {lista.map((pedido) => {
                  const next = proximoStatus(pedido.status);
                  const novo = pedido.status === "recebido" && !pedido.visualizado;
                  return (
                    <article
                      key={pedido.id}
                      className={cn(
                        "panel p-3",
                        novo && "border-primary/50 ring-1 ring-primary/30",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                          {novo && <Sparkles className="size-3.5 text-primary" strokeWidth={1.5} />}
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
                          {statusLabel(next, pedido.tipo_entrega)}
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