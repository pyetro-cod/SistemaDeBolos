import { cn } from "@/lib/utils";
import type { PedidoStatus, TipoEntrega } from "@/lib/cardapio";
import { statusLabel } from "@/lib/cardapio";

const pedidoTone: Record<PedidoStatus, string> = {
  recebido: "bg-primary-soft text-primary border-primary/30",
  preparo: "bg-warning/10 text-warning border-warning/25",
  pronto: "bg-success/10 text-success border-success/25",
  entregue: "bg-muted text-muted-foreground border-border",
  fechado: "bg-muted text-muted-foreground border-border",
};

export function StatusPedido({
  status,
  tipoEntrega = "retirada",
  className,
}: {
  status: PedidoStatus;
  tipoEntrega?: TipoEntrega;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        pedidoTone[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(status, tipoEntrega)}
    </span>
  );
}