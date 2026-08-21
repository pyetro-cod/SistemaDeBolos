import { supabase } from "@/integrations/supabase/client";

export const ESTABELECIMENTO_ID = "11111111-1111-1111-1111-111111111111";

export type PedidoStatus = "recebido" | "preparo" | "pronto" | "entregue" | "fechado";

export type TipoEntrega = "retirada" | "entrega";

export type FormaPagamento = "pix" | "cartao" | "dinheiro";

export type Tamanho = "inteiro" | "metade";

export type Origem = "online" | "balcao";

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_inteiro: number;
  preco_metade: number;

  // Estoque principal:
  // 1 bolo inteiro = 2 metades
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
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  referencia: string | null;

  forma_pagamento: FormaPagamento;
  total: number;
  origem: Origem;
  visualizado: boolean;
  pagamento_confirmado: boolean;
  criado_em: string;
  atualizado_em: string;

  itens_pedido?: ItemPedido[];
};

export const STATUS_FLUXO: PedidoStatus[] = ["recebido", "preparo", "pronto", "entregue"];

export const STATUS_LABEL: Record<PedidoStatus, string> = {
  recebido: "Novo pedido",
  preparo: "Em preparo",
  pronto: "Saiu para entrega",
  entregue: "Finalizado",
  fechado: "Concluído",
};

/**
 * Rótulo do status "pronto", que muda conforme
 * o tipo de entrega do pedido.
 */
export function statusLabel(status: PedidoStatus, tipoEntrega: TipoEntrega) {
  if (status === "pronto") {
    return tipoEntrega === "entrega" ? "Saiu para entrega" : "Pronto para retirada";
  }

  return STATUS_LABEL[status];
}

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

export function traduzErroPedido(mensagem: string) {
  if (mensagem.includes("estoque insuficiente")) {
    return mensagem.replace("estoque insuficiente para", "Estoque insuficiente para");
  }

  if (mensagem.includes("produto indisponível")) {
    return "Um dos produtos ficou indisponível. Atualize a página.";
  }

  if (mensagem.includes("nome do cliente")) {
    return "Preencha seu nome.";
  }

  if (mensagem.includes("tipo_entrega")) {
    return "Escolha uma forma de entrega.";
  }

  if (mensagem.includes("forma_pagamento")) {
    return "Escolha uma forma de pagamento.";
  }

  if (mensagem.includes("pedido sem itens")) {
    return "Seu carrinho está vazio.";
  }

  if (mensagem.includes("venda sem itens")) {
    return "Adicione ao menos um item.";
  }

  return mensagem;
}

export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export function proximoStatus(status: PedidoStatus): PedidoStatus | null {
  const i = STATUS_FLUXO.indexOf(status);

  if (i < 0 || i === STATUS_FLUXO.length - 1) {
    return null;
  }

  return STATUS_FLUXO[i + 1];
}

export function precoPorTamanho(produto: Produto, tamanho: Tamanho) {
  return tamanho === "inteiro" ? produto.preco_inteiro : produto.preco_metade;
}

/**
 * Quantidade de bolos inteiros disponíveis.
 *
 * O estoque_inteiro é o estoque principal.
 */
export function inteirosDisponiveis(produto: Produto) {
  return produto.estoque_inteiro;
}

/**
 * Calcula quantas metades correspondem aos bolos inteiros.
 *
 * Exemplo:
 * 1 inteiro = 2 metades
 * 2 inteiros = 4 metades
 * 3 inteiros = 6 metades
 */
export function metadesDisponiveis(produto: Produto) {
  return produto.estoque_inteiro * 2;
}

/**
 * Enquanto existir pelo menos 1 bolo inteiro,
 * as opções Inteiro e Metade ficam disponíveis.
 */
export function disponivelPorTamanho(produto: Produto, _tamanho: Tamanho) {
  return produto.estoque_inteiro >= 1;
}

export const ORDEM_CATEGORIAS = ["Bolos", "Doces", "Salgados", "Bebidas", "Outros"];

function ordemCategoria(c: string) {
  const i = ORDEM_CATEGORIAS.indexOf(c);

  return i < 0 ? ORDEM_CATEGORIAS.length : i;
}

type ProdutoBanco = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_inteiro: number | string;
  preco_metade: number | string;
  estoque_inteiro: number | string;
  estoque_metade: number | string;
  foto_url: string | null;
  categoria: string;
  tags: string[];
  ativo: boolean;
};

function normalizeProduto(p: ProdutoBanco): Produto {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    preco_inteiro: Number(p.preco_inteiro),
    preco_metade: Number(p.preco_metade),
    estoque_inteiro: Number(p.estoque_inteiro),
    estoque_metade: Number(p.estoque_metade),
    foto_url: p.foto_url,
    categoria: p.categoria,
    tags: p.tags,
    ativo: p.ativo,
  };
}

export async function fetchProdutos(somenteAtivos = false): Promise<Produto[]> {
  let query = supabase
    .from("produtos")
    .select("*")
    .eq("estabelecimento_id", ESTABELECIMENTO_ID)
    .order("nome");

  if (somenteAtivos) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((produto) => normalizeProduto(produto as ProdutoBanco))
    .sort(
      (a: Produto, b: Produto) =>
        ordemCategoria(a.categoria) - ordemCategoria(b.categoria) ||
        a.nome.localeCompare(b.nome, "pt-BR"),
    );
}

const PEDIDO_SELECT = "*, itens_pedido(*)";

type ItemPedidoBanco = {
  id: string;
  pedido_id: string;
  produto_id: string;
  nome_produto: string;
  preco_unitario: number | string;
  quantidade: number;
  tamanho: Tamanho;
  observacoes: string | null;
};

type PedidoBanco = {
  id: string;
  status: PedidoStatus;
  nome_cliente: string;
  telefone: string | null;
  tipo_entrega: TipoEntrega;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  referencia: string | null;
  forma_pagamento: FormaPagamento;
  total: number | string;
  origem: Origem;
  visualizado: boolean;
  pagamento_confirmado: boolean;
  criado_em: string;
  atualizado_em: string;
  itens_pedido?: ItemPedidoBanco[] | null;
};

function normalizePedido(p: PedidoBanco): Pedido {
  return {
    ...p,
    total: Number(p.total),
    itens_pedido: (p.itens_pedido ?? []).map((item) => ({
      ...item,
      preco_unitario: Number(item.preco_unitario),
    })),
  };
}

export async function fetchPedidoPorId(id: string): Promise<Pedido | null> {
  const rpc = supabase.rpc as unknown as (
    functionName: "obter_pedido_publico",
    args: { p_id: string },
  ) => Promise<{ data: unknown; error: unknown }>;

  const { data, error } = await rpc("obter_pedido_publico", {
    p_id: id,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const pedido = data as {
    id: string;
    status: PedidoStatus;
    nome_cliente: string;
    tipo_entrega: TipoEntrega;
    endereco: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    referencia: string | null;
    forma_pagamento: FormaPagamento;
    total: number | string;
    pagamento_confirmado: boolean;
    criado_em: string;
    atualizado_em: string;
    itens?: Array<{
      id: string;
      produto_id: string;
      nome_produto: string;
      preco_unitario: number | string;
      quantidade: number;
      tamanho: Tamanho;
      observacoes: string | null;
    }>;
  };

  return {
    id: pedido.id,
    status: pedido.status,
    nome_cliente: pedido.nome_cliente,
    telefone: null,

    tipo_entrega: pedido.tipo_entrega,

    endereco: pedido.endereco,
    numero: pedido.numero,
    complemento: pedido.complemento,
    bairro: pedido.bairro,
    referencia: pedido.referencia,

    forma_pagamento: pedido.forma_pagamento,
    total: Number(pedido.total),

    origem: "online",
    visualizado: true,
    pagamento_confirmado: pedido.pagamento_confirmado,

    criado_em: pedido.criado_em,
    atualizado_em: pedido.atualizado_em,

    itens_pedido: (pedido.itens ?? []).map((item) => ({
      id: item.id,
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      nome_produto: item.nome_produto,
      preco_unitario: Number(item.preco_unitario),
      quantidade: item.quantidade,
      tamanho: item.tamanho,
      observacoes: item.observacoes,
    })),
  };
}

/**
 * Busca pedidos por intervalo de datas,
 * independente do status.
 */
export async function fetchPedidosPorPeriodo(inicio: Date, fim: Date): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .gte("criado_em", inicio.toISOString())
    .lte("criado_em", fim.toISOString())
    .order("criado_em", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((pedido) => normalizePedido(pedido as unknown as PedidoBanco));
}

export async function fetchPedidosAtivos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .neq("status", "fechado")
    .order("criado_em", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((pedido) => normalizePedido(pedido as unknown as PedidoBanco));
}

export async function fetchPedidosFechados(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .eq("status", "fechado")
    .order("atualizado_em", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((pedido) => normalizePedido(pedido as unknown as PedidoBanco));
}

export async function fetchPedidosDoDia(): Promise<Pedido[]> {
  const inicio = new Date();

  inicio.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .gte("criado_em", inicio.toISOString());

  if (error) {
    throw error;
  }

  return (data ?? []).map((pedido) => normalizePedido(pedido as unknown as PedidoBanco));
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
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;

  formaPagamento: FormaPagamento;
};

function itensParaPayload(itens: NovoItem[]) {
  return itens.map((item) => ({
    produto_id: item.produto.id,
    quantidade: item.quantidade,
    tamanho: item.tamanho,
    observacoes: item.observacoes || null,
  }));
}

export async function criarPedido(cliente: DadosCliente, itens: NovoItem[]) {
  console.log("DADOS DO PEDIDO:", cliente);

  const { data, error } = await supabase.rpc(
    "criar_pedido_publico" as never,
    {
      p_nome_cliente: cliente.nome,
      p_telefone: cliente.telefone || null,

      p_tipo_entrega: cliente.tipoEntrega,

      p_endereco: cliente.tipoEntrega === "entrega" ? cliente.endereco || null : null,

      p_numero: cliente.tipoEntrega === "entrega" ? cliente.numero || null : null,

      p_complemento: cliente.tipoEntrega === "entrega" ? cliente.complemento || null : null,

      p_bairro: cliente.tipoEntrega === "entrega" ? cliente.bairro || null : null,

      p_referencia: cliente.tipoEntrega === "entrega" ? cliente.referencia || null : null,

      p_forma_pagamento: cliente.formaPagamento,

      p_itens: itensParaPayload(itens),
    } as never,
  );

  if (error) {
    console.error("ERRO COMPLETO AO CRIAR PEDIDO:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    throw error;
  }

  return data as string;
}

/**
 * Registra uma venda feita presencialmente no balcão.
 */
export async function registrarVendaBalcao(formaPagamento: FormaPagamento, itens: NovoItem[]) {
  const { data, error } = await supabase.rpc(
    "registrar_venda_balcao" as never,
    {
      p_forma_pagamento: formaPagamento,
      p_itens: itensParaPayload(itens),
    } as never,
  );

  if (error) {
    throw error;
  }

  return data as string;
}

export async function avancarStatus(pedido: Pedido) {
  const next = proximoStatus(pedido.status);

  if (!next) {
    return;
  }

  const { error } = await supabase
    .from("pedidos")
    .update({
      status: next,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", pedido.id);

  if (error) {
    throw error;
  }
}

export async function definirStatus(pedidoId: string, status: PedidoStatus) {
  const { error } = await supabase
    .from("pedidos")
    .update({
      status,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", pedidoId);

  if (error) {
    throw error;
  }
}

export async function concluirPedido(pedidoId: string) {
  const { error } = await supabase
    .from("pedidos")
    .update({
      status: "fechado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", pedidoId);

  if (error) {
    throw error;
  }
}

export async function marcarVisualizado(pedidoIds: string[]) {
  if (pedidoIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("pedidos")
    .update({
      visualizado: true,
    } as never)
    .in("id", pedidoIds);

  if (error) {
    throw error;
  }
}

export async function salvarProduto(
  produto: Partial<Produto> & {
    id?: string;
    quantidadeInteiros?: number;
  },
) {
  /*
   * O estoque principal é estoque_inteiro.
   *
   * 1 inteiro = 2 metades
   * 2 inteiros = 4 metades
   * 3 inteiros = 6 metades
   */
  const estoque_inteiro =
    produto.quantidadeInteiros !== undefined
      ? Math.max(0, Math.round(produto.quantidadeInteiros))
      : (produto.estoque_inteiro ?? 0);

  const estoque_metade = estoque_inteiro * 2;

  const payload = {
    estabelecimento_id: ESTABELECIMENTO_ID,
    nome: produto.nome ?? "",
    descricao: produto.descricao || null,
    preco_inteiro: produto.preco_inteiro ?? 0,
    preco_metade: produto.preco_metade ?? 0,

    estoque_inteiro,
    estoque_metade,

    foto_url: produto.foto_url || null,
    categoria: produto.categoria || "Outros",
    tags: produto.tags ?? [],
    ativo: produto.ativo ?? true,
  };

  if (produto.id) {
    const { error } = await supabase.from("produtos").update(payload).eq("id", produto.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.from("produtos").insert(payload);

    if (error) {
      throw error;
    }
  }
}

export async function excluirProduto(id: string) {
  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function confirmarPagamentoPix(pedidoId: string) {
  const { error } = await supabase
    .from("pedidos")
    .update({
      pagamento_confirmado: true,
    } as never)
    .eq("id", pedidoId);

  if (error) {
    throw error;
  }
}
