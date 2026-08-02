import { supabase } from "@/integrations/supabase/client";

export const ESTABELECIMENTO_ID = "11111111-1111-1111-1111-111111111111";

export type PedidoStatus = "recebido" | "preparo" | "pronto" | "entregue" | "fechado";
export type TipoEntrega = "retirada" | "entrega";
export type FormaPagamento = "pix" | "cartao" | "dinheiro";
export type Tamanho = "inteiro" | "metade";

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_inteiro: number;
  preco_metade: number;
  estoque_inteiro: number;
  estoque_metade: number;
  foto_url: string | null;
  categoria: string;
  tags: string[];
  ativo: boolean;
};

export type ItemPedido = {
  id: string;
  pedido_id: string;
  produto_id: string;
  nome_produto: string;
  preco_unitario: number;
  quantidade: number;
  tamanho: Tamanho;
  observacoes: string | null;
};

export type Pedido = {
  id: string;
  status: PedidoStatus;
  nome_cliente: string;
  telefone: string | null;
  tipo_entrega: TipoEntrega;
  endereco: string | null;
  forma_pagamento: FormaPagamento;
  total: number;
  criado_em: string;
  atualizado_em: string;
  itens_pedido?: ItemPedido[];
};

export const STATUS_FLUXO: PedidoStatus[] = ["recebido", "preparo", "pronto", "entregue"];

export const STATUS_LABEL: Record<PedidoStatus, string> = {
  recebido: "Recebido",
  preparo: "Em preparo",
  pronto: "Pronto",
  entregue: "Entregue",
  fechado: "Concluído",
};

export const TIPO_ENTREGA_LABEL: Record<TipoEntrega, string> = {
  retirada: "Retirada na loja",
  entrega: "Entrega",
};

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

export const TAMANHO_LABEL: Record<Tamanho, string> = {
  inteiro: "Inteiro",
  metade: "Metade",
};

export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function proximoStatus(status: PedidoStatus): PedidoStatus | null {
  const i = STATUS_FLUXO.indexOf(status);
  if (i < 0 || i === STATUS_FLUXO.length - 1) return null;
  return STATUS_FLUXO[i + 1];
}

export function precoPorTamanho(produto: Produto, tamanho: Tamanho) {
  return tamanho === "inteiro" ? produto.preco_inteiro : produto.preco_metade;
}

export function estoquePorTamanho(produto: Produto, tamanho: Tamanho) {
  return tamanho === "inteiro" ? produto.estoque_inteiro : produto.estoque_metade;
}

const db = supabase as unknown as {
  from: (table: string) => any;
};

export const ORDEM_CATEGORIAS = ["Bolos", "Doces", "Salgados", "Bebidas", "Outros"];

function ordemCategoria(c: string) {
  const i = ORDEM_CATEGORIAS.indexOf(c);
  return i < 0 ? ORDEM_CATEGORIAS.length : i;
}

function normalizeProduto(p: any): Produto {
  return {
    ...p,
    preco_inteiro: Number(p.preco_inteiro),
    preco_metade: Number(p.preco_metade),
    estoque_inteiro: Number(p.estoque_inteiro),
    estoque_metade: Number(p.estoque_metade),
  };
}

export async function fetchProdutos(somenteAtivos = false): Promise<Produto[]> {
  let query = db
    .from("produtos")
    .select("*")
    .eq("estabelecimento_id", ESTABELECIMENTO_ID)
    .order("nome");
  if (somenteAtivos) query = query.eq("ativo", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? [])
    .map(normalizeProduto)
    .sort(
      (a: Produto, b: Produto) =>
        ordemCategoria(a.categoria) - ordemCategoria(b.categoria) ||
        a.nome.localeCompare(b.nome, "pt-BR"),
    );
}

const PEDIDO_SELECT = "*, itens_pedido(*)";

function normalizePedido(p: any): Pedido {
  return {
    ...p,
    total: Number(p.total),
    itens_pedido: (p.itens_pedido ?? []).map((i: any) => ({
      ...i,
      preco_unitario: Number(i.preco_unitario),
    })),
  };
}

export async function fetchPedidoPorId(id: string): Promise<Pedido | null> {
  const { data, error } = await db.from("pedidos").select(PEDIDO_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalizePedido(data) : null;
}

export async function fetchPedidosAtivos(): Promise<Pedido[]> {
  const { data, error } = await db
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .neq("status", "fechado")
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizePedido);
}

export async function fetchPedidosFechados(): Promise<Pedido[]> {
  const { data, error } = await db
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .eq("status", "fechado")
    .order("atualizado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizePedido);
}

export async function fetchPedidosDoDia(): Promise<Pedido[]> {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const { data, error } = await db
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .gte("criado_em", inicio.toISOString());
  if (error) throw error;
  return (data ?? []).map(normalizePedido);
}

export type NovoItem = {
  produto: Produto;
  tamanho: Tamanho;
  quantidade: number;
  observacoes?: string;
};

export type DadosCliente = {
  nome: string;
  telefone: string;
  tipoEntrega: TipoEntrega;
  endereco?: string;
  formaPagamento: FormaPagamento;
};

export async function criarPedido(cliente: DadosCliente, itens: NovoItem[]) {
  const total = itens.reduce(
    (acc, i) => acc + precoPorTamanho(i.produto, i.tamanho) * i.quantidade,
    0,
  );
  const { data: pedido, error } = await db
    .from("pedidos")
    .insert({
      status: "recebido",
      nome_cliente: cliente.nome,
      telefone: cliente.telefone || null,
      tipo_entrega: cliente.tipoEntrega,
      endereco: cliente.tipoEntrega === "entrega" ? cliente.endereco || null : null,
      forma_pagamento: cliente.formaPagamento,
      total,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: itensError } = await db.from("itens_pedido").insert(
    itens.map((i) => ({
      pedido_id: pedido.id,
      produto_id: i.produto.id,
      nome_produto: i.produto.nome,
      preco_unitario: precoPorTamanho(i.produto, i.tamanho),
      quantidade: i.quantidade,
      tamanho: i.tamanho,
      observacoes: i.observacoes || null,
    })),
  );
  if (itensError) throw itensError;

  for (const i of itens) {
    const coluna = i.tamanho === "inteiro" ? "estoque_inteiro" : "estoque_metade";
    const atual = estoquePorTamanho(i.produto, i.tamanho);
    await db
      .from("produtos")
      .update({ [coluna]: Math.max(0, atual - i.quantidade) })
      .eq("id", i.produto.id);
  }

  return pedido.id as string;
}

export async function avancarStatus(pedido: Pedido) {
  const next = proximoStatus(pedido.status);
  if (!next) return;
  const { error } = await db
    .from("pedidos")
    .update({ status: next, atualizado_em: new Date().toISOString() })
    .eq("id", pedido.id);
  if (error) throw error;
}

export async function definirStatus(pedidoId: string, status: PedidoStatus) {
  const { error } = await db
    .from("pedidos")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", pedidoId);
  if (error) throw error;
}

export async function concluirPedido(pedidoId: string) {
  const { error } = await db
    .from("pedidos")
    .update({ status: "fechado", atualizado_em: new Date().toISOString() })
    .eq("id", pedidoId);
  if (error) throw error;
}

export async function salvarProduto(produto: Partial<Produto> & { id?: string }) {
  const payload = {
    estabelecimento_id: ESTABELECIMENTO_ID,
    nome: produto.nome,
    descricao: produto.descricao || null,
    preco_inteiro: produto.preco_inteiro ?? 0,
    preco_metade: produto.preco_metade ?? 0,
    estoque_inteiro: produto.estoque_inteiro ?? 0,
    estoque_metade: produto.estoque_metade ?? 0,
    foto_url: produto.foto_url || null,
    categoria: produto.categoria || "Outros",
    tags: produto.tags ?? [],
    ativo: produto.ativo ?? true,
  };
  if (produto.id) {
    const { error } = await db.from("produtos").update(payload).eq("id", produto.id);
    if (error) throw error;
  } else {
    const { error } = await db.from("produtos").insert(payload);
    if (error) throw error;
  }
}

export async function excluirProduto(id: string) {
  const { error } = await db.from("produtos").delete().eq("id", id);
  if (error) throw error;
}
