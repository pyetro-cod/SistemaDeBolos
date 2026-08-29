import { useEffect, useRef } from "react";

import { toast } from "sonner";

import { PixQrCode } from "@/components/ui/pix-qrcode";

import { createFileRoute, Link } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";

import { ArrowLeft, Store, Truck, MessageCircle } from "lucide-react";

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

// WhatsApp da Queiroz Bolos
const NUMERO_WHATSAPP = "558396420239";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Acompanhar pedido — Queiroz Bolos" },
      {
        name: "description",
        content: "Acompanhe o status do seu pedido em tempo real.",
      },
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

  const pagamentoAnterior = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (!pedido) return;

    if (pagamentoAnterior.current === false && pedido.pagamento_confirmado) {
      toast.success("Pagamento confirmado! Seu pedido já está sendo preparado. 🎉");
    }

    pagamentoAnterior.current = pedido.pagamento_confirmado;
  }, [pedido?.pagamento_confirmado]);

  /**
   * Abre o WhatsApp da loja com uma mensagem
   * contendo apenas o nome do cliente e o pedido
   * para enviar o comprovante.
   */
  const enviarComprovanteWhatsApp = () => {
    if (!pedido) {
      toast.error("Pedido não encontrado.");
      return;
    }

    const mensagem = `Olá, sou ${pedido.nome_cliente}.

Segue abaixo o comprovante do pagamento.`;

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 pb-10">
      <header className="sticky top-0 z-20 -mx-5 border-b border-border bg-background/85 px-5 py-4 backdrop-blur">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Queiroz Bolos
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
            {/* CABEÇALHO DO PEDIDO */}
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

            {/* FLUXO DO STATUS */}
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

            {/* PAGAMENTO PIX */}
            {pedido.forma_pagamento === "pix" && !pedido.pagamento_confirmado && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 text-sm font-medium">Pagamento via PIX</p>

                <PixQrCode valor={pedido.total} identificador={pedido.id} />
              </div>
            )}

            {pedido.forma_pagamento === "pix" && pedido.pagamento_confirmado && (
              <p className="mt-5 rounded-lg border border-success/25 bg-success/10 p-3 text-center text-sm text-success">
                Pagamento PIX confirmado ✓
              </p>
            )}

            {/* DADOS DO CLIENTE */}
            <div className="mt-5 space-y-4 border-t border-border pt-4">
              <div>
                <h3 className="text-sm font-semibold">Dados do cliente</h3>

                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Nome</span>

                    <p className="font-medium">{pedido.nome_cliente}</p>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">Telefone</span>

                    <p>{pedido.telefone}</p>
                  </div>
                </div>
              </div>

              {/* TIPO DE ENTREGA */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {pedido.tipo_entrega === "entrega" ? (
                    <Truck className="size-4" strokeWidth={1.5} />
                  ) : (
                    <Store className="size-4" strokeWidth={1.5} />
                  )}

                  {TIPO_ENTREGA_LABEL[pedido.tipo_entrega]}
                </div>
              </div>

              {/* ENDEREÇO DE ENTREGA */}
              {pedido.tipo_entrega === "entrega" && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">Endereço de entrega</h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Informe os dados para receber seu pedido.
                  </p>

                  <div className="mt-3 space-y-3 text-sm">
                    {/* RUA */}
                    <div>
                      <span className="text-xs text-muted-foreground">Rua / Avenida</span>

                      <p>{pedido.endereco || "Não informado"}</p>
                    </div>

                    {/* NÚMERO + COMPLEMENTO */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground">Número</span>

                        <p>{pedido.numero || "Não informado"}</p>
                      </div>

                      <div>
                        <span className="text-xs text-muted-foreground">Complemento</span>

                        <p>{pedido.complemento || "Não informado"}</p>
                      </div>
                    </div>

                    {/* BAIRRO */}
                    <div>
                      <span className="text-xs text-muted-foreground">Bairro</span>

                      <p>{pedido.bairro || "Não informado"}</p>
                    </div>

                    {/* REFERÊNCIA */}
                    <div>
                      <span className="text-xs text-muted-foreground">Ponto de referência</span>

                      <p>{pedido.referencia || "Não informado"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGAMENTO */}
              <div className="border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">Forma de pagamento</span>

                <p className="mt-1 text-sm">{FORMA_PAGAMENTO_LABEL[pedido.forma_pagamento]}</p>
              </div>
            </div>

            {/* ITENS DO PEDIDO */}
            <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
              {pedido.itens_pedido?.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {i.quantidade}× {i.nome_produto} ({TAMANHO_LABEL[i.tamanho]})
                    {i.observacoes ? ` — ${i.observacoes}` : ""}
                  </span>

                  <span className="whitespace-nowrap">{brl(i.preco_unitario * i.quantidade)}</span>
                </li>
              ))}
            </ul>

            {/* TOTAL */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>

              <span className="text-lg font-semibold">{brl(pedido.total)}</span>
            </div>

            {/* BOTÃO WHATSAPP */}
            <button
              type="button"
              onClick={enviarComprovanteWhatsApp}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <MessageCircle className="size-5" strokeWidth={2} />
              Enviar comprovante pelo WhatsApp
            </button>
          </article>
        )}
      </section>
    </main>
  );
}
