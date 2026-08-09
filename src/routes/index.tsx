import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Banknote,
  CreditCard,
  Landmark,
  Leaf,
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
      { property: "og:title", content: "Queiroz Bolos — Cardápio Digital" },
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
  const totalCarrinho = carrinho.reduce(
    (a, i) => a + precoPorTamanho(i.produto, i.tamanho) * i.quantidade,
    0,
  );

  function adicionar(produto: Produto, tamanho: Tamanho, quantidade: number) {
    setCarrinho((atual) => {
      const existe = atual.find((i) => i.produto.id === produto.id && i.tamanho === tamanho);
      if (existe) {
        return atual.map((i) =>
          i.produto.id === produto.id && i.tamanho === tamanho
            ? { ...i, quantidade: i.quantidade + quantidade }
            : i,
        );
      }
      return [...atual, { produto, tamanho, quantidade }];
    });
    toast.success(`${produto.nome} adicionado`);
    setCarrinhoAberto(true);
  }

  function alterarQtd(produtoId: string, tamanho: Tamanho, delta: number) {
    setCarrinho((atual) =>
      atual
        .map((i) =>
          i.produto.id === produtoId && i.tamanho === tamanho
            ? { ...i, quantidade: i.quantidade + delta }
            : i,
        )
        .filter((i) => i.quantidade > 0),
    );
  }

  const criar = useMutation({
    mutationFn: (dados: DadosCliente) => criarPedido(dados, carrinho),
    onSuccess: (id) => {
      toast.success("Pedido enviado!");
      navigate({ to: "/pedido/$id", params: { id } });
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
      <header className="sticky top-0 z-20 -mx-5 border-b border-border bg-background/85 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Queiroz Bolos" className="size-10 rounded-full object-cover border border-border shrink-0" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">Queiroz Bolos</h1>
              <p className="text-xs text-muted-foreground">Bolos inteiros ou metade</p>
            </div>
          </div>
          <button
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

      <section className="pt-8">
        <h2 className="text-2xl leading-tight">Os melhores bolos da cidade.</h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Escolha entre bolos inteiros ou metade. Faça seu pedido online e retire na loja ou receba
          em casa.
        </p>
      </section>

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

      {produtos.length === 0 && (
        <p className="panel mt-8 p-8 text-center text-sm text-muted-foreground">
          Nenhum bolo disponível no momento.
        </p>
      )}

      {carrinhoAberto && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-black/50"
          onClick={() => setCarrinhoAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-background"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Meu carrinho</h2>
              <button
                onClick={() => setCarrinhoAberto(false)}
                aria-label="Fechar carrinho"
                className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="mx-auto size-4" strokeWidth={1.5} />
              </button>
            </div>

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

      {carrinho.length > 0 && !carrinhoAberto && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{brl(totalCarrinho)}</p>
            </div>
            <button
              onClick={() => setCarrinhoAberto(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ShoppingBag className="size-4" strokeWidth={1.5} />
              Ver carrinho
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CardProduto({
  produto,
  onAdicionar,
}: {
  produto: Produto;
  onAdicionar: (produto: Produto, tamanho: Tamanho, quantidade: number) => void;
}) {
  const [tamanho, setTamanho] = useState<Tamanho>("inteiro");
  const [quantidade, setQuantidade] = useState(1);

  const preco = precoPorTamanho(produto, tamanho);
  const semEstoque = !disponivelPorTamanho(produto, tamanho);
  const maxQuantidade =
    tamanho === "inteiro" ? inteirosDisponiveis(produto) : inteirosDisponiveis(produto) * 2;

  return (
    <div className="panel flex flex-col gap-3 overflow-hidden p-0">
      {produto.foto_url && (
        <img src={produto.foto_url} alt={produto.nome} className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
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
                  setQuantidade(1);
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

        <p className="text-xs text-muted-foreground">
          {semEstoque
            ? "Sem estoque para este tamanho"
            : `${maxQuantidade} ${maxQuantidade === 1 ? "disponível" : "disponíveis"}`}
        </p>

        <div className="mt-auto flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
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
          <button
            type="button"
            disabled={semEstoque}
            onClick={() => {
              onAdicionar(produto, tamanho, quantidade);
              setQuantidade(1);
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

function Carrinho({
  itens,
  onAlterarQtd,
  onFinalizar,
  enviando,
}: {
  itens: ItemCarrinho[];
  onAlterarQtd: (produtoId: string, tamanho: Tamanho, delta: number) => void;
  onFinalizar: (dados: DadosCliente) => void;
  enviando: boolean;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retirada");
  const [endereco, setEndereco] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");

  const total = itens.reduce((a, i) => a + precoPorTamanho(i.produto, i.tamanho) * i.quantidade, 0);
  const podeEnviar =
    itens.length > 0 &&
    nome.trim().length > 0 &&
    (tipoEntrega === "retirada" || endereco.trim().length > 0);

  if (itens.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p>
    );
  }

  return (
    <div className="space-y-5">
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
                <button
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
                <button
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

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-semibold">{brl(total)}</span>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Seu nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Telefone (opcional)</span>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </label>

        <div>
          <span className="text-xs text-muted-foreground">Entrega</span>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => setTipoEntrega("retirada")}
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

        {tipoEntrega === "entrega" && (
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">Endereço</span>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
            />
          </label>
        )}

        <div>
          <span className="text-xs text-muted-foreground">Forma de pagamento</span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(
              [
                { id: "pix", label: "Pix", icon: Landmark },
                { id: "cartao", label: "Cartão", icon: CreditCard },
                { id: "dinheiro", label: "Dinheiro", icon: Banknote },
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
        </div>
      </div>

      <button
        type="button"
        disabled={!podeEnviar || enviando}
        onClick={() => onFinalizar({ nome, telefone, tipoEntrega, endereco, formaPagamento })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Finalizar pedido
      </button>
    </div>
  );
}