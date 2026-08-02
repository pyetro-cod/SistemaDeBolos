import { useEffect } from "react";
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
