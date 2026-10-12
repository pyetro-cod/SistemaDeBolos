import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subMonths,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FormaPagamento, Pedido } from "@/lib/cardapio";

export type Periodo = "dia" | "semana" | "mes" | "ano";

export const PERIODO_LABEL: Record<Periodo, string> = {
  dia: "Dia",
  semana: "Semana",
  mes: "Mês",
  ano: "Ano",
};

export function calcularIntervalo(periodo: Periodo, referencia: Date) {
  switch (periodo) {
    case "dia":
      return { inicio: startOfDay(referencia), fim: endOfDay(referencia) };
    case "semana":
      return {
        inicio: startOfWeek(referencia, { weekStartsOn: 0 }),
        fim: endOfWeek(referencia, { weekStartsOn: 0 }),
      };
    case "mes":
      return { inicio: startOfMonth(referencia), fim: endOfMonth(referencia) };
    case "ano":
      return { inicio: startOfYear(referencia), fim: endOfYear(referencia) };
  }
}

export function deslocarReferencia(periodo: Periodo, referencia: Date, direcao: 1 | -1) {
  switch (periodo) {
    case "dia":
      return addDays(referencia, direcao);
    case "semana":
      return addWeeks(referencia, direcao);
    case "mes":
      return addMonths(referencia, direcao);
    case "ano":
      return addYears(referencia, direcao);
  }
}

export function rotuloIntervalo(periodo: Periodo, referencia: Date) {
  const { inicio, fim } = calcularIntervalo(periodo, referencia);
  switch (periodo) {
    case "dia":
      return format(referencia, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    case "semana":
      return `${format(inicio, "dd/MM", { locale: ptBR })} – ${format(fim, "dd/MM/yyyy", { locale: ptBR })}`;
    case "mes":
      return format(referencia, "MMMM 'de' yyyy", { locale: ptBR });
    case "ano":
      return format(referencia, "yyyy", { locale: ptBR });
  }
}

export function filtrarPedidosPorIntervalo(pedidos: Pedido[], inicio: Date, fim: Date) {
  return pedidos.filter((p) => {
    const data = new Date(p.criado_em);
    return data >= inicio && data <= fim;
  });
}

export type ProdutoVendido = { nome: string; quantidade: number; total: number };
export type FormaPagamentoResumo = { forma: FormaPagamento; quantidade: number; total: number };

export type Metricas = {
  totalPedidos: number;
  faturamento: number;
  ticketMedio: number;
  entregas: number;
  retiradas: number;
  produtoMaisVendido: ProdutoVendido | null;
  produtosVendidos: ProdutoVendido[];
  formasPagamento: FormaPagamentoResumo[];
};

/** PIX só conta pro relatório se o pagamento já foi confirmado; outras formas contam sempre. */
export function pedidoValidoParaRelatorio(pedido: Pedido) {
  if (pedido.forma_pagamento === "pix") return pedido.pagamento_confirmado;
  return true;
}

export function filtrarPedidosValidos(pedidos: Pedido[]) {
  return pedidos.filter(pedidoValidoParaRelatorio);
}

export function calcularMetricas(pedidos: Pedido[]): Metricas {
  const totalPedidos = pedidos.length;
  const faturamento = pedidos.reduce((a, p) => a + p.total, 0);
  const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0;
  const entregas = pedidos.filter((p) => p.tipo_entrega === "entrega").length;
  const retiradas = totalPedidos - entregas;

  const produtosMap = new Map<string, ProdutoVendido>();
  for (const p of pedidos) {
    for (const i of p.itens_pedido ?? []) {
      const atual = produtosMap.get(i.nome_produto) ?? {
        nome: i.nome_produto,
        quantidade: 0,
        total: 0,
      };
      atual.quantidade += i.quantidade;
      atual.total += i.preco_unitario * i.quantidade;
      produtosMap.set(i.nome_produto, atual);
    }
  }
  const produtosVendidos = [...produtosMap.values()].sort((a, b) => b.quantidade - a.quantidade);
  const produtoMaisVendido = produtosVendidos[0] ?? null;

  const formasMap = new Map<FormaPagamento, FormaPagamentoResumo>();
  for (const p of pedidos) {
    const atual = formasMap.get(p.forma_pagamento) ?? {
      forma: p.forma_pagamento,
      quantidade: 0,
      total: 0,
    };
    atual.quantidade += 1;
    atual.total += p.total;
    formasMap.set(p.forma_pagamento, atual);
  }
  const formasPagamento = [...formasMap.values()].sort((a, b) => b.total - a.total);

  return {
    totalPedidos,
    faturamento,
    ticketMedio,
    entregas,
    retiradas,
    produtoMaisVendido,
    produtosVendidos,
    formasPagamento,
  };
}

export type FaturamentoMes = { mes: string; label: string; total: number };

export function faturamentoUltimosMeses(
  pedidos: Pedido[],
  quantidade = 6,
  referencia: Date = new Date(),
): FaturamentoMes[] {
  const meses: FaturamentoMes[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const ref = subMonths(referencia, i);
    const { inicio, fim } = calcularIntervalo("mes", ref);
    const total = filtrarPedidosPorIntervalo(pedidos, inicio, fim).reduce(
      (a, p) => a + p.total,
      0,
    );
    meses.push({
      mes: format(ref, "yyyy-MM"),
      label: format(ref, "MMM/yy", { locale: ptBR }),
      total,
    });
  }
  return meses;
}