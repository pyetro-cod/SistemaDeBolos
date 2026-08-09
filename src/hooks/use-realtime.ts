import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Mantém as queries de pedidos sincronizadas em tempo real. */
export function useRealtimePedidos() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("cardapio-digital")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
        queryClient.invalidateQueries();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "itens_pedido" }, () => {
        queryClient.invalidateQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
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
  const queryClient = useQueryClient();
  const [ultimoNovoId, setUltimoNovoId] = useState<string | null>(null);
  const somRef = useRef(somAtivo());

  useEffect(() => {
    const channel = supabase
      .channel("cardapio-notificacoes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos", filter: "origem=eq.online" },
        (payload) => {
          queryClient.invalidateQueries();
          setUltimoNovoId((payload.new as { id: string }).id);
          if (somRef.current) tocarBipe();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { ultimoNovoId, setSomLigado: (v: boolean) => (somRef.current = v) };
}