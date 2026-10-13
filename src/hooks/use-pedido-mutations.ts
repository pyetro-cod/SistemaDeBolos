import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  avancarStatus,
  confirmarPagamentoPix,
  proximoStatus,
  traduzErroPedido,
  type Pedido,
} from "@/lib/cardapio";

const CHAVE_ATIVOS = ["pedidos", "ativos"] as const;

type Contexto = { anterior?: Pedido[] };

function mensagemDeErro(err: unknown, padrao: string) {
  const mensagem = (err as { message?: string } | null)?.message;
  return traduzErroPedido(mensagem ?? padrao);
}

/** Aplica a mudança na lista de pedidos ativos em cache e guarda o snapshot para rollback. */
async function atualizarAtivosEmCache(
  queryClient: QueryClient,
  pedidoId: string,
  mudanca: Partial<Pedido>,
): Promise<Contexto> {
  await queryClient.cancelQueries({ queryKey: CHAVE_ATIVOS });
  const anterior = queryClient.getQueryData<Pedido[]>(CHAVE_ATIVOS);
  queryClient.setQueryData<Pedido[]>(CHAVE_ATIVOS, (lista) =>
    lista?.map((p) => (p.id === pedidoId ? { ...p, ...mudanca } : p)),
  );
  return { anterior };
}

function reverter(queryClient: QueryClient, contexto?: Contexto) {
  if (contexto?.anterior) queryClient.setQueryData(CHAVE_ATIVOS, contexto.anterior);
}

function sincronizar(queryClient: QueryClient, pedidoId: string) {
  // Invalida todas as consultas que começam com "pedidos" (ativos, fechados, dia, período).
  queryClient.invalidateQueries({ queryKey: ["pedidos"] });
  queryClient.invalidateQueries({ queryKey: ["pedido", pedidoId] });
}

/**
 * Avança o pedido para a próxima etapa do fluxo (recebido → preparo → pronto → entregue).
 * A tela muda na hora e o banco confirma em segundo plano; em caso de erro, volta atrás.
 * Uso: const avancar = useAvancarStatus("Pedido movido"); avancar.mutate(pedido);
 */
export function useAvancarStatus(mensagemSucesso = "Status atualizado") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedido: Pedido) => avancarStatus(pedido),
    onMutate: (pedido: Pedido) => {
      const next = proximoStatus(pedido.status);
      return atualizarAtivosEmCache(queryClient, pedido.id, next ? { status: next } : {});
    },
    onSuccess: () => toast.success(mensagemSucesso),
    onError: (err: unknown, _pedido, contexto) => {
      console.error("Erro ao avançar status:", err);
      reverter(queryClient, contexto);
      toast.error(mensagemDeErro(err, "Não foi possível atualizar o pedido."));
    },
    onSettled: (_data, _err, pedido) => sincronizar(queryClient, pedido.id),
  });
}

/**
 * Confirma o pagamento via Pix de um pedido, com atualização otimista.
 * Uso: const confirmarPix = useConfirmarPix(); confirmarPix.mutate(pedido.id);
 */
export function useConfirmarPix(mensagemSucesso = "Pagamento Pix confirmado") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedidoId: string) => confirmarPagamentoPix(pedidoId),
    onMutate: (pedidoId: string) =>
      atualizarAtivosEmCache(queryClient, pedidoId, { pagamento_confirmado: true }),
    onSuccess: () => toast.success(mensagemSucesso),
    onError: (err: unknown, _pedidoId, contexto) => {
      console.error("Erro ao confirmar Pix:", err);
      reverter(queryClient, contexto);
      toast.error(mensagemDeErro(err, "Não foi possível confirmar o pagamento."));
    },
    onSettled: (_data, _err, pedidoId) => sincronizar(queryClient, pedidoId),
  });
}

/**
 * Marca pedidos como visualizados direto no cache do React Query, sem refazer a consulta.
 * Uso: marcarVisualizado(ids).then(() => marcarVisualizadosEmCache(queryClient, ids));
 */
export function marcarVisualizadosEmCache(queryClient: QueryClient, pedidoIds: string[]) {
  if (pedidoIds.length === 0) return;
  const ids = new Set(pedidoIds);

  queryClient.setQueriesData<unknown>({ queryKey: ["pedidos"] }, (antigo: unknown) => {
    // Só mexe em listas de pedidos; qualquer outro formato de cache fica como está.
    if (!Array.isArray(antigo)) return antigo;
    return antigo.map((p) => (p && ids.has(p.id) ? { ...p, visualizado: true } : p));
  });
}
