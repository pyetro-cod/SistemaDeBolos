import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  avancarStatus,
  confirmarPagamentoPix,
  traduzErroPedido,
  type Pedido,
} from "@/lib/cardapio";

function mensagemDeErro(err: unknown, padrao: string) {
  const mensagem = (err as { message?: string } | null)?.message;
  return traduzErroPedido(mensagem ?? padrao);
}

/**
 * Avança o pedido para a próxima etapa do fluxo (recebido → preparo → pronto → entregue).
 * Uso: const avancar = useAvancarStatus("Pedido movido"); avancar.mutate(pedido);
 */
export function useAvancarStatus(mensagemSucesso = "Status atualizado") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedido: Pedido) => avancarStatus(pedido),
    onSuccess: () => {
      // Invalida todas as consultas que começam com "pedidos" (ativos, fechados, dia, período).
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success(mensagemSucesso);
    },
    onError: (err: unknown) => {
      toast.error(mensagemDeErro(err, "Não foi possível atualizar o pedido."));
    },
  });
}

/**
 * Confirma o pagamento via Pix de um pedido.
 * Uso: const confirmarPix = useConfirmarPix(); confirmarPix.mutate(pedido.id);
 */
export function useConfirmarPix(mensagemSucesso = "Pagamento Pix confirmado") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedidoId: string) => confirmarPagamentoPix(pedidoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success(mensagemSucesso);
    },
    onError: (err: unknown) => {
      toast.error(mensagemDeErro(err, "Não foi possível confirmar o pagamento."));
    },
  });
}

/**
 * Marca pedidos como visualizados direto no cache do React Query, sem refazer a consulta.
 * Uso: marcarVisualizado(ids).then(() => marcarVisualizadosEmCache(queryClient, ids));
 */
export function marcarVisualizadosEmCache(queryClient: QueryClient, pedidoIds: string[]) {
  if (pedidoIds.length === 0) return;
  const ids = new Set(pedidoIds);

  queryClient.setQueriesData<unknown>({ queryKey: ["pedidos"] }, (antigo) => {
    // Só mexe em listas de pedidos; qualquer outro formato de cache fica como está.
    if (!Array.isArray(antigo)) return antigo;
    return antigo.map((p) => (p && ids.has(p.id) ? { ...p, visualizado: true } : p));
  });
}
