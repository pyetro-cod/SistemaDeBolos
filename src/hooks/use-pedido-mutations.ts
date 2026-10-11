import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  avancarStatus,
  confirmarPagamentoPix,
  proximoStatus,
  type Pedido,
} from "@/lib/cardapio";

const CHAVE_ATIVOS = ["pedidos", "ativos"] as const;

type Contexto = { anterior?: Pedido[] };

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
  queryClient.invalidateQueries({ queryKey: ["pedidos"] });
  queryClient.invalidateQueries({ queryKey: ["pedido", pedidoId] });
}

/** Avança o status na tela na hora e confirma com o banco em segundo plano. */
export function useAvancarStatus(mensagemSucesso: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: avancarStatus,
    onMutate: (pedido: Pedido) => {
      const next = proximoStatus(pedido.status);
      return atualizarAtivosEmCache(queryClient, pedido.id, next ? { status: next } : {});
    },
    onSuccess: () => toast.success(mensagemSucesso),
    onError: (err, _pedido, contexto) => {
      console.error("Erro ao avançar status:", err);
      reverter(queryClient, contexto);
      toast.error("Não foi possível atualizar o status");
    },
    onSettled: (_data, _err, pedido) => sincronizar(queryClient, pedido.id),
  });
}

export function useConfirmarPix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmarPagamentoPix,
    onMutate: (pedidoId: string) =>
      atualizarAtivosEmCache(queryClient, pedidoId, { pagamento_confirmado: true }),
    onSuccess: () => toast.success("Pagamento PIX confirmado"),
    onError: (err, _pedidoId, contexto) => {
      console.error("Erro ao confirmar PIX:", err);
      reverter(queryClient, contexto);
      toast.error("Não foi possível confirmar o pagamento");
    },
    onSettled: (_data, _err, pedidoId) => sincronizar(queryClient, pedidoId),
  });
}

/** Marca pedidos como vistos direto no cache, sem refetch (o Realtime confirma depois). */
export function marcarVisualizadosEmCache(queryClient: QueryClient, pedidoIds: string[]) {
  const ids = new Set(pedidoIds);
  queryClient.setQueryData<Pedido[]>(CHAVE_ATIVOS, (lista) =>
    lista?.map((p) => (ids.has(p.id) ? { ...p, visualizado: true } : p)),
  );
}
