import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { brl, type Pedido } from "@/lib/cardapio";

type PedidoTroco = Pick<Pedido, "forma_pagamento" | "valor_para_troco" | "troco">;

/**
 * Selo de troco para pedidos em dinheiro.
 * - Com troco: "Levar troco R$ 28,00 · paga com R$ 50,00"
 * - Sem troco (cliente não informou valor ou pagou o valor exato): "Dinheiro · sem troco"
 * Não renderiza nada para Pix ou cartão.
 */
export function TrocoBadge({ pedido, className }: { pedido: PedidoTroco; className?: string }) {
  if (pedido.forma_pagamento !== "dinheiro") return null;

  const pagaCom = Number(pedido.valor_para_troco ?? 0);
  const troco = Number(pedido.troco ?? 0);

  if (pagaCom <= 0 || troco <= 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        <Banknote className="size-3.5" strokeWidth={1.5} />
        Dinheiro · sem troco
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-warning/25 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning",
        className,
      )}
    >
      <Banknote className="size-3.5" strokeWidth={1.5} />
      Levar troco {brl(troco)}
      <span className="font-normal opacity-80">· paga com {brl(pagaCom)}</span>
    </span>
  );
}
