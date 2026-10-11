import { useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Janela para agrupar eventos em rajada (1 pedido gera 1 evento + 1 por item). */
const DEBOUNCE_MS = 300;

type Pendentes = { pedidos: boolean; produtos: boolean; pedidoIds: Set<string> };

/**
 * Agrupa os eventos do Realtime e invalida apenas as queries afetadas,
 * em vez de recarregar o app inteiro a cada mudança.
 */
function criarInvalidador(queryClient: QueryClient) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendentes: Pendentes = { pedidos: false, produtos: false, pedidoIds: new Set() };

  const executar = () => {
    const { pedidos, produtos, pedidoIds } = pendentes;
    pendentes = { pedidos: false, produtos: false, pedidoIds: new Set() };
    timer = null;

    if (pedidos) queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    if (produtos) queryClient.invalidateQueries({ queryKey: ["produtos"] });
    pedidoIds.forEach((id) => queryClient.invalidateQueries({ queryKey: ["pedido", id] }));
  };

  return {
    agendar(mudanca: { pedidos?: boolean; produtos?: boolean; pedidoId?: string | null }) {
      if (mudanca.pedidos) pendentes.pedidos = true;
      if (mudanca.produtos) pendentes.produtos = true;
      if (mudanca.pedidoId) pendentes.pedidoIds.add(mudanca.pedidoId);
      if (!timer) timer = setTimeout(executar, DEBOUNCE_MS);
    },
    cancelar() {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}

type Linha = Record<string, unknown>;

function campo(payload: RealtimePostgresChangesPayload<Linha>, nome: string) {
  const linha = (payload.eventType === "DELETE" ? payload.old : payload.new) as Linha;
  const valor = linha?.[nome];
  return typeof valor === "string" ? valor : null;
}

/**
 * Mantém as queries de pedidos sincronizadas em tempo real.
 * Com `pedidoId`, escuta só aquele pedido (página pública de acompanhamento).
 */
export function useRealtimePedidos(pedidoId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidador = criarInvalidador(queryClient);

    const channel = pedidoId
      ? supabase.channel(`pedido-${pedidoId}`).on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pedidos", filter: `id=eq.${pedidoId}` },
          () => invalidador.agendar({ pedidoId }),
        )
      : supabase
          .channel("cardapio-digital")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pedidos" },
            (payload: RealtimePostgresChangesPayload<Linha>) =>
              invalidador.agendar({
                pedidos: true,
                // creating/deleting an order moves stock; status updates don't
                produtos: payload.eventType !== "UPDATE",
                pedidoId: campo(payload, "id"),
              }),
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "itens_pedido" },
            (payload: RealtimePostgresChangesPayload<Linha>) =>
              invalidador.agendar({ pedidos: true, pedidoId: campo(payload, "pedido_id") }),
          );

    channel.subscribe();

    return () => {
      invalidador.cancelar();
      supabase.removeChannel(channel);
    };
  }, [queryClient, pedidoId]);
}

const CHAVE_SOM = "cardapio_som_ativo";

export function somAtivo() {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(CHAVE_SOM);
  return v === null ? true : v === "1";
}

export function definirSomAtivo(ativo: boolean) {
  window.localStorage.setItem(CHAVE_SOM, ativo ? "1" : "0");
}

/** Toca um bipe curto usando a Web Audio API (sem depender de arquivo de áudio). */
function tocarBipe() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1180].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + i * 0.16 + 0.24);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {
    // ambiente sem suporte a áudio — ignora silenciosamente
  }
}

/**
 * Observa a chegada de novos pedidos online: toca som (se ativo) e
 * mantém a contagem de pedidos novos ainda não visualizados pelo admin.
 */
export function useNotificacoesPedidos() {
  const [ultimoNovoId, setUltimoNovoId] = useState<string | null>(null);
  const somRef = useRef(somAtivo());

  useEffect(() => {
    const channel = supabase
      .channel("cardapio-notificacoes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos", filter: "origem=eq.online" },
        // data refresh is handled by useRealtimePedidos; this only signals the new order
        (payload) => {
          setUltimoNovoId((payload.new as { id: string }).id);
          if (somRef.current) tocarBipe();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { ultimoNovoId, setSomLigado: (v: boolean) => (somRef.current = v) };
}