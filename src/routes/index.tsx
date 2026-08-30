import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Banknote,
  CreditCard,
  Landmark,
  Leaf,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  WheatOff,
  X,
} from "lucide-react";

import {
  brl,
  criarPedido,
  disponivelPorTamanho,
  fetchProdutos,
  inteirosDisponiveis,
  precoPorTamanho,
  traduzErroPedido,
  type DadosCliente,
  type FormaPagamento,
  type NovoItem,
  type Produto,
  type Tamanho,
  type TipoEntrega,
} from "@/lib/cardapio";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Queiroz Bolos — Cardápio Digital" },
      {
        name: "description",
        content:
          "Escolha entre bolos inteiros ou metade, faça seu pedido online e retire na loja ou receba em casa.",
      },
      {
        property: "og:title",
        content: "Queiroz Bolos — Cardápio Digital",
      },
      {
        property: "og:description",
        content: "Bolos inteiros ou metade, pedido online, retirada ou entrega.",
      },
    ],
  }),

  component: Index,
});

type ItemCarrinho = NovoItem;

function Index() {
  const navigate = useNavigate();

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos", "ativos"],
    queryFn: () => fetchProdutos(true),
  });

  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria))),
    [produtos],
  );

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const qtdCarrinho = carrinho.reduce((a, i) => a + i.quantidade, 0);

  function adicionar(produto: Produto, tamanho: Tamanho, quantidade: number) {
    setCarrinho((atual) => {
      const existe = atual.find((i) => i.produto.id === produto.id && i.tamanho === tamanho);

      if (existe) {
        return atual.map((i) =>
          i.produto.id === produto.id && i.tamanho === tamanho
            ? {
                ...i,
                quantidade: i.quantidade + quantidade,
              }
            : i,
        );
      }

      return [
        ...atual,
        {
          produto,
          tamanho,
          quantidade,
        },
      ];
    });

    toast.success(`${produto.nome} adicionado`);

    setCarrinhoAberto(true);
  }

  function alterarQtd(produtoId: string, tamanho: Tamanho, delta: number) {
    setCarrinho((atual) =>
      atual
        .map((i) =>
          i.produto.id === produtoId && i.tamanho === tamanho
            ? {
                ...i,
                quantidade: i.quantidade + delta,
              }
            : i,
        )
        .filter((i) => i.quantidade > 0),
    );
  }

  /*
   * ==========================================
   * CONTATO PELO WHATSAPP
   * ==========================================
   */

  function entrarEmContatoWhatsApp() {
    const numeroWhatsApp = "558396420239";

    const mensagem = "Olá! Gostaria de entrar em contato com a Queiroz Bolos.";

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank");
  }

  /*
   * ==========================================
   * CRIAR PEDIDO
   * ==========================================
   */

  const criar = useMutation({
    mutationFn: (dados: DadosClienteCarrinho) => criarPedido(dados, carrinho),

    onSuccess: (id) => {
      toast.success("Pedido enviado!");

      navigate({
        to: "/pedido/$id",
        params: { id },
      });
    },

    onError: (err) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "";

      toast.error(msg ? traduzErroPedido(msg) : "Não foi possível enviar o pedido");
    },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-10">
      {/* ========================================= */}
      {/* CABEÇALHO                                 */}
      {/* ========================================= */}

      <header className="sticky top-0 z-20 -mx-5 border-b border-border bg-background/85 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Queiroz Bolos"
              className="size-10 shrink-0 rounded-full border border-border object-cover"
            />

            <div>
              <h1 className="text-lg font-semibold leading-tight">Queiroz Bolos</h1>

              <p className="text-xs text-muted-foreground">Bolos inteiros ou metade</p>
            </div>
          </div>

          {/* ===================================== */}
          {/* BOTÃO DO CARRINHO                      */}
          {/* ===================================== */}

          <button
            type="button"
            onClick={() => setCarrinhoAberto(true)}
            className="relative inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          >
            <ShoppingBag className="size-4" strokeWidth={1.5} />
            Carrinho
            {qtdCarrinho > 0 && (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                {qtdCarrinho}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ========================================= */}
      {/* APRESENTAÇÃO                              */}
      {/* ========================================= */}

      <section className="pt-8">
        <h2 className="text-2xl leading-tight">Os melhores bolos da cidade.</h2>

        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Escolha entre bolos inteiros ou metade. Faça seu pedido online e retire na loja ou receba
          em casa.
        </p>
      </section>

      {/* ========================================= */}
      {/* PRODUTOS                                  */}
      {/* ========================================= */}

      {categorias.map((categoria) => (
        <section key={categoria} className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground">{categoria}</h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {produtos
              .filter((p) => p.categoria === categoria)
              .map((p) => (
                <CardProduto key={p.id} produto={p} onAdicionar={adicionar} />
              ))}
          </div>
        </section>
      ))}

      {/* ========================================= */}
      {/* NENHUM PRODUTO                            */}
      {/* ========================================= */}

      {produtos.length === 0 && (
        <p className="panel mt-8 p-8 text-center text-sm text-muted-foreground">
          Nenhum bolo disponível no momento.
        </p>
      )}

      {/* ========================================= */}
      {/* BOTÃO FLUTUANTE DO WHATSAPP              */}
      {/* ========================================= */}

      {!carrinhoAberto && (
        <button
          type="button"
          onClick={entrarEmContatoWhatsApp}
          aria-label="Falar com a Queiroz Bolos pelo WhatsApp"
          title="Fale conosco pelo WhatsApp"
          className="fixed bottom-6 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-green-700 active:scale-95"
        >
          <MessageCircle className="size-7" strokeWidth={2} />
        </button>
      )}

      {/* ========================================= */}
      {/* CARRINHO LATERAL                         */}
      {/* ========================================= */}

      {carrinhoAberto && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-black/50"
          onClick={() => setCarrinhoAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-background"
          >
            {/* CABEÇALHO DO CARRINHO */}

            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Meu carrinho</h2>

              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                aria-label="Fechar carrinho"
                className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="mx-auto size-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* CONTEÚDO */}

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <Carrinho
                itens={carrinho}
                onAlterarQtd={alterarQtd}
                onFinalizar={(dados) => criar.mutate(dados)}
                enviando={criar.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
 * ======================================================
 * CARD DO PRODUTO
 * ======================================================
 */

function CardProduto({
  produto,
  onAdicionar,
}: {
  produto: Produto;

  onAdicionar: (produto: Produto, tamanho: Tamanho, quantidade: number) => void;
}) {
  const [tamanho, setTamanho] = useState<Tamanho>("inteiro");

  const [quantidade, setQuantidade] = useState(0);

  const preco = precoPorTamanho(produto, tamanho);

  const semEstoque = !disponivelPorTamanho(produto, tamanho);

  const maxQuantidade =
    tamanho === "inteiro" ? inteirosDisponiveis(produto) : inteirosDisponiveis(produto) * 2;

  return (
    <div className="panel flex flex-col gap-3 overflow-hidden p-0">
      {/* FOTO */}

      {produto.foto_url && (
        <img src={produto.foto_url} alt={produto.nome} className="h-40 w-full object-cover" />
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* INFORMAÇÕES */}

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">{produto.nome}</h4>

            {produto.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {t === "vegano" ? (
                  <Leaf className="size-3" strokeWidth={1.5} />
                ) : t === "sem glúten" ? (
                  <WheatOff className="size-3" strokeWidth={1.5} />
                ) : null}

                {t}
              </span>
            ))}
          </div>

          {produto.descricao && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {produto.descricao}
            </p>
          )}
        </div>

        {/* TAMANHO */}

        <div className="flex gap-1.5">
          {(["inteiro", "metade"] as Tamanho[]).map((t) => {
            const disponivel = disponivelPorTamanho(produto, t);

            return (
              <button
                key={t}
                type="button"
                disabled={!disponivel}
                onClick={() => {
                  setTamanho(t);
                  setQuantidade(0);
                }}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",

                  tamanho === t
                    ? "border-primary/40 bg-primary-soft text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {t === "inteiro" ? "Inteiro" : "Metade"} · {brl(precoPorTamanho(produto, t))}
              </button>
            );
          })}
        </div>

        {/* ESTOQUE */}

        <p className="text-xs text-muted-foreground">
          {semEstoque
            ? "Sem estoque para este tamanho"
            : `${maxQuantidade} ${maxQuantidade === 1 ? "disponível" : "disponíveis"}`}
        </p>

        {/* QUANTIDADE */}

        <div className="mt-auto flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(0, q - 1))}
              aria-label="Diminuir quantidade"
              className="size-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
            >
              <Minus className="mx-auto size-3.5" strokeWidth={1.5} />
            </button>

            <span className="w-6 text-center text-sm">{quantidade}</span>

            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.min(maxQuantidade || 1, q + 1))}
              aria-label="Aumentar quantidade"
              className="size-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
            >
              <Plus className="mx-auto size-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* ADICIONAR */}

          <button
            type="button"
            disabled={semEstoque || quantidade === 0}
            onClick={() => {
              onAdicionar(produto, tamanho, quantidade);

              setQuantidade(0);
            }}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * ======================================================
 * DADOS DO CLIENTE
 * ======================================================
 */

type DadosClienteCarrinho = DadosCliente & {
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;
  taxaEntrega?: number;
  formaPagamento?: FormaPagamento;

  precisaTroco?: "sim" | "nao" | "";

  valorRecebido?: number | null;

  troco?: number | null;

  subtotal?: number;
  total?: number;
};

/*
 * ======================================================
 * CARRINHO
 * ======================================================
 */

function Carrinho({
  itens,
  onAlterarQtd,
  onFinalizar,
  enviando,
}: {
  itens: ItemCarrinho[];

  onAlterarQtd: (produtoId: string, tamanho: Tamanho, delta: number) => void;

  onFinalizar: (dados: DadosClienteCarrinho) => void;

  enviando: boolean;
}) {
  const [nome, setNome] = useState("");

  const [telefone, setTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retirada");

  const [endereco, setEndereco] = useState("");

  const [numero, setNumero] = useState("");

  const [complemento, setComplemento] = useState("");

  const [bairro, setBairro] = useState("");

  const [referencia, setReferencia] = useState("");

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");

  const [valorRecebido, setValorRecebido] = useState("");

  const [precisaTroco, setPrecisaTroco] = useState<"sim" | "nao" | "">("");

  /*
   * ==========================================
   * TAXAS DE ENTREGA
   * ==========================================
   */

  const TAXAS_ENTREGA: Record<string, number> = {
    "Alto Alegre": 2,
    Pedregal: 2,
    Centro: 2,
    "Santa Rosa": 2,
    Oriente: 2,
    Renascer: 2,
    "Alto do Jorge": 2,
    Mandacaru: 3,
    "Zé Marcolino": 2,
    "Alto da Caixa d'Água": 2,
    "Conjunto Habitacional Sebastião Vitorino": 2,
    Alvorada: 3,
    "Conjunto Habitacional Pedro Ferreira Filho": 3,
    "Carro Quebrado": 3,
    "Frei Damião": 2,
    "Várzea Redonda": 3,
  };

  /*
   * ==========================================
   * SUBTOTAL
   * ==========================================
   */

  const subtotal = itens.reduce(
    (a, i) => a + precoPorTamanho(i.produto, i.tamanho) * i.quantidade,
    0,
  );

  /*
   * ==========================================
   * TAXA
   * ==========================================
   */

  const taxaEntrega = tipoEntrega === "entrega" && bairro ? (TAXAS_ENTREGA[bairro] ?? 0) : 0;

  /*
   * ==========================================
   * TOTAL
   * ==========================================
   */

  const total = subtotal + taxaEntrega;

  /*
   * ==========================================
   * VALIDAÇÃO
   * ==========================================
   */

  const podeEnviar =
    itens.length > 0 &&
    nome.trim().length > 0 &&
    telefone.trim().length > 0 &&
    (tipoEntrega === "retirada" ||
      (endereco.trim().length > 0 &&
        numero.trim().length > 0 &&
        bairro.trim().length > 0 &&
        referencia.trim().length > 0));

  /*
   * ==========================================
   * TROCO
   * ==========================================
   */

  const valorRecebidoNumero = Number(valorRecebido.replace(",", "."));

  const trocoInsuficiente =
    formaPagamento === "dinheiro" &&
    precisaTroco === "sim" &&
    (valorRecebido === "" || valorRecebidoNumero < total);

  /*
   * ==========================================
   * CARRINHO VAZIO
   * ==========================================
   */

  if (itens.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p>
    );
  }

  return (
    <div className="space-y-5">
      {/* ======================================= */}
      {/* ITENS                                  */}
      {/* ======================================= */}

      <div className="space-y-3">
        {itens.map((item) => (
          <div key={`${item.produto.id}-${item.tamanho}`} className="panel p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.produto.nome}</p>

                <p className="text-xs text-muted-foreground">
                  {item.tamanho === "inteiro" ? "Inteiro" : "Metade"} ·{" "}
                  {brl(precoPorTamanho(item.produto, item.tamanho) * item.quantidade)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {/* DIMINUIR */}

                <button
                  type="button"
                  onClick={() => onAlterarQtd(item.produto.id, item.tamanho, -1)}
                  aria-label="Diminuir"
                  className="size-7 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
                >
                  {item.quantidade === 1 ? (
                    <Trash2 className="mx-auto size-3.5" strokeWidth={1.5} />
                  ) : (
                    <Minus className="mx-auto size-3.5" strokeWidth={1.5} />
                  )}
                </button>

                <span className="w-5 text-center text-sm">{item.quantidade}</span>

                {/* AUMENTAR */}

                <button
                  type="button"
                  onClick={() => onAlterarQtd(item.produto.id, item.tamanho, 1)}
                  aria-label="Aumentar"
                  className="size-7 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
                >
                  <Plus className="mx-auto size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================= */}
      {/* RESUMO                                  */}
      {/* ======================================= */}

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>

          <span className="text-sm">{brl(subtotal)}</span>
        </div>

        {tipoEntrega === "entrega" && bairro && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de entrega</span>

            <span className="text-sm">{brl(taxaEntrega)}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-medium">Total</span>

          <span className="text-lg font-semibold">{brl(total)}</span>
        </div>
      </div>

      {/* ======================================= */}
      {/* DADOS DO CLIENTE                        */}
      {/* ======================================= */}

      <div className="space-y-3 border-t border-border pt-4">
        {/* NOME */}

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Nome</span>

          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite seu nome"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </label>

        {/* TELEFONE */}

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Telefone</span>

          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(83) 99999-9999"
            inputMode="tel"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </label>

        {/* ===================================== */}
        {/* TIPO DE ENTREGA                       */}
        {/* ===================================== */}

        <div>
          <span className="text-xs text-muted-foreground">Como deseja receber o pedido?</span>

          <div className="mt-1.5 flex gap-2">
            {/* RETIRADA */}

            <button
              type="button"
              onClick={() => {
                setTipoEntrega("retirada");

                setEndereco("");
                setNumero("");
                setComplemento("");
                setBairro("");
                setReferencia("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",

                tipoEntrega === "retirada"
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <Store className="size-4" strokeWidth={1.5} />
              Retirar na loja
            </button>

            {/* ENTREGA */}

            <button
              type="button"
              onClick={() => setTipoEntrega("entrega")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",

                tipoEntrega === "entrega"
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <Truck className="size-4" strokeWidth={1.5} />
              Receber em casa
            </button>
          </div>
        </div>

        {/* ===================================== */}
        {/* ENDEREÇO                              */}
        {/* ===================================== */}

        {tipoEntrega === "entrega" && (
          <div className="space-y-3 rounded-lg border border-border bg-background p-3">
            <div>
              <p className="text-sm font-medium">Endereço de entrega</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Informe os dados para receber seu pedido.
              </p>
            </div>

            {/* RUA */}

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Rua / Avenida</span>

              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Digite sua rua ou avenida"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
              />
            </label>

            {/* NÚMERO + COMPLEMENTO */}

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs text-muted-foreground">Número</span>

                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ex: 123"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-muted-foreground">Complemento</span>

                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Casa, apto..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
                />
              </label>
            </div>

            {/* BAIRRO */}

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Bairro</span>

              <select
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
              >
                <option value="">Selecione o bairro</option>

                {Object.entries(TAXAS_ENTREGA).map(([nomeBairro, taxa]) => (
                  <option key={nomeBairro} value={nomeBairro}>
                    {nomeBairro} - {brl(taxa)}
                  </option>
                ))}
              </select>
            </label>

            {/* REFERÊNCIA */}

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Ponto de referência</span>

              <input
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ex: perto da praça, em frente à escola..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
              />
            </label>

            {/* TAXA */}

            {bairro && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-primary-soft p-3">
                <div>
                  <p className="text-sm font-medium">Taxa de entrega</p>

                  <p className="text-xs text-muted-foreground">{bairro}</p>
                </div>

                <span className="text-sm font-semibold text-primary">{brl(taxaEntrega)}</span>
              </div>
            )}
          </div>
        )}

        {/* ===================================== */}
        {/* FORMA DE PAGAMENTO                    */}
        {/* ===================================== */}

        <div>
          <span className="text-xs text-muted-foreground">Forma de pagamento</span>

          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(
              [
                {
                  id: "pix",
                  label: "Pix",
                  icon: Landmark,
                },
                {
                  id: "cartao",
                  label: "Cartão",
                  icon: CreditCard,
                },
                {
                  id: "dinheiro",
                  label: "Dinheiro",
                  icon: Banknote,
                },
              ] as const
            ).map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setFormaPagamento(op.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors",

                  formaPagamento === op.id
                    ? "border-primary/40 bg-primary-soft text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                <op.icon className="size-4" strokeWidth={1.5} />

                {op.label}
              </button>
            ))}
          </div>

          {/* DINHEIRO */}

          {formaPagamento === "dinheiro" && (
            <div className="mt-3 rounded-lg border border-border bg-background p-3">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Vai precisar de troco?</span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrecisaTroco("sim");
                      setValorRecebido("");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",

                      precisaTroco === "sim"
                        ? "border-primary/40 bg-primary-soft text-primary"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    Sim
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrecisaTroco("nao");
                      setValorRecebido("");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",

                      precisaTroco === "nao"
                        ? "border-primary/40 bg-primary-soft text-primary"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    Não
                  </button>
                </div>
              </div>

              {precisaTroco === "sim" && (
                <div className="mt-3 space-y-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs text-muted-foreground">Vai pagar com quanto?</span>

                    <input
                      inputMode="decimal"
                      placeholder="Ex: 50"
                      value={valorRecebido}
                      onChange={(e) => setValorRecebido(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
                    />
                  </label>

                  {valorRecebido && (
                    <p
                      className={cn(
                        "text-sm font-medium",

                        valorRecebidoNumero < total ? "text-destructive" : "text-success",
                      )}
                    >
                      {valorRecebidoNumero < total
                        ? "O valor informado é menor que o total do pedido."
                        : `Troco: ${brl(valorRecebidoNumero - total)}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PIX */}

          {formaPagamento === "pix" && (
            <p className="mt-3 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              O QR Code do PIX aparece na próxima tela, assim que o pedido for enviado.
            </p>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* FINALIZAR PEDIDO                        */}
      {/* ======================================= */}

      <button
        type="button"
        disabled={!podeEnviar || enviando || trocoInsuficiente}
        onClick={() =>
          onFinalizar({
            nome,
            telefone,

            tipoEntrega,

            endereco,
            numero,
            complemento,
            bairro,
            referencia,

            taxaEntrega,

            formaPagamento,

            precisaTroco: formaPagamento === "dinheiro" ? precisaTroco : "",

            valorRecebido:
              formaPagamento === "dinheiro" && precisaTroco === "sim" ? valorRecebidoNumero : null,

            troco:
              formaPagamento === "dinheiro" &&
              precisaTroco === "sim" &&
              valorRecebidoNumero >= total
                ? valorRecebidoNumero - total
                : null,

            subtotal,
            total,
          })
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Enviando pedido..." : "Finalizar pedido"}
      </button>
    </div>
  );
}
