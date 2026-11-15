import { salvarPedidoLocal } from "@/lib/pedidos-locais";
import { MeusPedidos } from "@/components/ui/meus-pedidos";

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

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (!numeros) return "";
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

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

  function entrarEmContatoWhatsApp() {
    const numeroWhatsApp = "558396420239";
    const mensagem = "Olá! Gostaria de entrar em contato com a Queiroz Bolos.";
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank");
  }

  const criar = useMutation({
    mutationFn: (dados: DadosClienteCarrinho) => criarPedido(dados, carrinho),
    onSuccess: (id) => {
      salvarPedidoLocal(id);
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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-12 sm:px-5">
      <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur sm:-mx-5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Queiroz Bolos"
              className="size-12 shrink-0 rounded-full border-2 border-primary/20 object-cover"
            />

            <div>
              <h1 className="text-lg font-extrabold leading-tight tracking-tight">Queiroz Bolos</h1>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                Bolos inteiros ou metade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MeusPedidos />

            <button
              type="button"
              onClick={() => setCarrinhoAberto(true)}
              className="relative inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary/10"
            >
              <ShoppingBag className="size-5" strokeWidth={2} />
              <span className="hidden sm:inline">Carrinho</span>
              <span className="sm:hidden">Sacola</span>

              {qtdCarrinho > 0 && (
                <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground shadow">
                  {qtdCarrinho}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl bg-primary/5 px-5 py-8 mt-6 sm:px-7 sm:py-10">
        <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
          Feito com carinho para você
        </span>

        <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Os melhores bolos da cidade.
        </h2>

        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
          Escolha seu bolo favorito, selecione o tamanho e faça seu pedido online. Você pode retirar
          na loja ou receber em casa.
        </p>
      </section>

      {categorias.map((categoria) => (
        <section key={categoria} className="mt-9">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-7 w-1.5 rounded-full bg-primary" />
            <h3 className="text-xl font-extrabold tracking-tight">{categoria}</h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {produtos
              .filter((p) => p.categoria === categoria)
              .map((p) => (
                <CardProduto key={p.id} produto={p} onAdicionar={adicionar} />
              ))}
          </div>
        </section>
      ))}

      {produtos.length === 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Nenhum bolo disponível no momento.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Volte em breve para conferir nossas opções.
          </p>
        </div>
      )}

      {!carrinhoAberto && (
        <button
          type="button"
          onClick={entrarEmContatoWhatsApp}
          aria-label="Falar com a Queiroz Bolos pelo WhatsApp"
          title="Fale conosco pelo WhatsApp"
          className="fixed bottom-6 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition-all duration-200 hover:scale-110 hover:bg-green-700 active:scale-95"
        >
          <MessageCircle className="size-7" strokeWidth={2.5} />
        </button>
      )}

      {carrinhoAberto && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-black/60 backdrop-blur-[2px]"
          onClick={() => setCarrinhoAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-background px-5 py-5">
              <div>
                <h2 className="text-lg font-extrabold">Meu carrinho</h2>
                <p className="text-xs text-muted-foreground">
                  Confira seu pedido antes de finalizar
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                aria-label="Fechar carrinho"
                className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
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
    tamanho === "inteiro" ? Math.floor(produto.estoque_meios / 2) : produto.estoque_meios;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      {produto.foto_url ? (
        <div className="relative h-52 overflow-hidden bg-muted sm:h-56">
          <img
            src={produto.foto_url}
            alt={produto.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center bg-muted">
          <ShoppingBag className="size-12 text-muted-foreground/50" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold leading-tight tracking-tight">{produto.nome}</h4>

            {produto.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
              >
                {t === "vegano" ? (
                  <Leaf className="size-3.5" strokeWidth={2} />
                ) : t === "sem glúten" ? (
                  <WheatOff className="size-3.5" strokeWidth={2} />
                ) : null}
                {t}
              </span>
            ))}
          </div>

          {produto.descricao && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {produto.descricao}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-muted/50 p-3">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            Escolha o tamanho
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(["inteiro", "metade"] as Tamanho[]).map((t) => {
              const disponivel = disponivelPorTamanho(produto, t);
              const selecionado = tamanho === t;

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
                    "flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-2 py-2 transition-all disabled:cursor-not-allowed disabled:opacity-40",
                    selecionado
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-extrabold">
                    {t === "inteiro" ? "Inteiro" : "Metade"}
                  </span>
                  <span className="mt-0.5 text-base font-black">
                    {brl(precoPorTamanho(produto, t))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {semEstoque
              ? "Sem estoque para este tamanho"
              : `${maxQuantidade} ${maxQuantidade === 1 ? "disponível" : "disponíveis"}`}
          </span>

          {!semEstoque && (
            <span className="text-xs font-bold text-green-700 dark:text-green-400">Disponível</span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              disabled={quantidade === 0}
              onClick={() => setQuantidade((q) => Math.max(0, q - 1))}
              aria-label="Diminuir quantidade"
              className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent disabled:opacity-30"
            >
              <Minus className="size-4" strokeWidth={2.5} />
            </button>

            <span className="w-6 text-center text-base font-extrabold tabular-nums">
              {quantidade}
            </span>

            <button
              type="button"
              disabled={semEstoque || quantidade >= maxQuantidade}
              onClick={() => setQuantidade((q) => Math.min(maxQuantidade, q + 1))}
              aria-label="Aumentar quantidade"
              className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent disabled:opacity-30"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            disabled={semEstoque || quantidade === 0}
            onClick={() => {
              onAdicionar(produto, tamanho, quantidade);
              setQuantidade(0);
            }}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingBag className="size-4" strokeWidth={2.5} />
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}

type DadosClienteCarrinho = DadosCliente & {
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;
  taxaEntrega?: number;
  precisaTroco?: "sim" | "nao" | "";
  valorRecebido?: number | null;
  troco?: number | null;
  subtotal?: number;
  total?: number;
};

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
  const [mostrarErros, setMostrarErros] = useState(false);

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

  const subtotal = itens.reduce(
    (a, i) => a + precoPorTamanho(i.produto, i.tamanho) * i.quantidade,
    0,
  );

  const taxaEntrega = tipoEntrega === "entrega" && bairro ? (TAXAS_ENTREGA[bairro] ?? 0) : 0;

  const total = subtotal + taxaEntrega;

  const valorRecebidoNumero = Number(valorRecebido.replace(",", "."));

  const valorRecebidoInvalido =
    valorRecebido !== "" && (!Number.isFinite(valorRecebidoNumero) || valorRecebidoNumero <= 0);

  const trocoInsuficiente =
    formaPagamento === "dinheiro" &&
    precisaTroco === "sim" &&
    (valorRecebido === "" || valorRecebidoInvalido || valorRecebidoNumero < total);

  const erros = {
    nome: nome.trim().length < 3 ? "Informe seu nome com pelo menos 3 caracteres." : "",

    telefone:
      telefone.replace(/\D/g, "").length !== 11
        ? "Informe um telefone válido com DDD e 11 dígitos."
        : "",

    endereco:
      tipoEntrega === "entrega" && endereco.trim().length < 3 ? "Informe sua rua ou avenida." : "",

    numero:
      tipoEntrega === "entrega" && !/^(\d+|S\/N)$/i.test(numero.trim())
        ? "Informe um número válido ou S/N."
        : "",

    bairro: tipoEntrega === "entrega" && !bairro ? "Selecione seu bairro." : "",

    troco:
      formaPagamento === "dinheiro" && precisaTroco === "" ? "Informe se precisa de troco." : "",

    valorRecebido:
      formaPagamento === "dinheiro" &&
      precisaTroco === "sim" &&
      (valorRecebido === "" || valorRecebidoInvalido || valorRecebidoNumero < total)
        ? "Informe um valor igual ou superior ao total do pedido."
        : "",
  };

  const formularioValido = Object.values(erros).every((erro) => !erro);

  function finalizarPedido() {
    setMostrarErros(true);

    if (itens.length === 0 || !formularioValido || trocoInsuficiente) {
      return;
    }

    onFinalizar({
      nome: nome.trim(),
      telefone: telefone.trim(),
      tipoEntrega,
      endereco: tipoEntrega === "entrega" ? endereco.trim() : "",
      numero: tipoEntrega === "entrega" ? numero.trim() : "",
      complemento: tipoEntrega === "entrega" ? complemento.trim() : "",
      bairro: tipoEntrega === "entrega" ? bairro : "",
      referencia: tipoEntrega === "entrega" ? referencia.trim() : "",
      taxaEntrega,
      formaPagamento,
      precisaTroco: formaPagamento === "dinheiro" ? precisaTroco : "",
      valorRecebido:
        formaPagamento === "dinheiro" && precisaTroco === "sim" ? valorRecebidoNumero : null,
      troco:
        formaPagamento === "dinheiro" && precisaTroco === "sim" && valorRecebidoNumero >= total
          ? valorRecebidoNumero - total
          : null,
      subtotal,
      total,
    });
  }

  const classeInput =
    "w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium outline-none transition-all placeholder:font-normal focus:border-primary focus:ring-2 focus:ring-primary/10";

  const classeLabel = "block text-sm font-bold text-foreground";

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-bold">Seu carrinho está vazio.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Adicione seus bolos favoritos para continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-base font-extrabold">Itens do pedido</h3>

        {itens.map((item) => (
          <div
            key={`${item.produto.id}-${item.tamanho}`}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{item.produto.nome}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {item.tamanho === "inteiro" ? "Bolo inteiro" : "Meio bolo"}
                </p>
                <p className="mt-1 text-base font-black text-primary">
                  {brl(precoPorTamanho(item.produto, item.tamanho) * item.quantidade)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border p-1">
                <button
                  type="button"
                  onClick={() => onAlterarQtd(item.produto.id, item.tamanho, -1)}
                  aria-label="Diminuir"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
                >
                  {item.quantidade === 1 ? (
                    <Trash2 className="size-4" strokeWidth={2} />
                  ) : (
                    <Minus className="size-4" strokeWidth={2} />
                  )}
                </button>

                <span className="w-6 text-center text-sm font-extrabold">{item.quantidade}</span>

                <button
                  type="button"
                  onClick={() => onAlterarQtd(item.produto.id, item.tamanho, 1)}
                  aria-label="Aumentar"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
                >
                  <Plus className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-muted/30 p-4">
        <h3 className="mb-3 text-base font-extrabold">Resumo do pedido</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
            <span className="text-sm font-bold">{brl(subtotal)}</span>
          </div>

          {tipoEntrega === "entrega" && bairro && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Taxa de entrega</span>
              <span className="text-sm font-bold">{brl(taxaEntrega)}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-base font-extrabold">Total</span>
            <span className="text-2xl font-black text-primary">{brl(total)}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-5">
        <div>
          <h3 className="text-base font-extrabold">Seus dados</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Preencha seus dados para identificarmos seu pedido.
          </p>
        </div>

        <label className="block space-y-2">
          <span className={classeLabel}>Nome completo *</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite seu nome"
            className={cn(
              classeInput,
              mostrarErros && erros.nome ? "border-destructive" : "border-border",
            )}
          />
          {mostrarErros && erros.nome && (
            <p className="text-xs font-semibold text-destructive">{erros.nome}</p>
          )}
        </label>

        <label className="block space-y-2">
          <span className={classeLabel}>Telefone / WhatsApp *</span>
          <input
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            placeholder="(83) 99999-9999"
            inputMode="tel"
            maxLength={15}
            className={cn(
              classeInput,
              mostrarErros && erros.telefone ? "border-destructive" : "border-border",
            )}
          />
          {mostrarErros && erros.telefone && (
            <p className="text-xs font-semibold text-destructive">{erros.telefone}</p>
          )}
        </label>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div>
          <h3 className="text-base font-extrabold">Recebimento do pedido</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Escolha como deseja receber seus bolos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all",
              tipoEntrega === "retirada"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            <Store className="size-6" strokeWidth={2} />
            Retirar na loja
          </button>

          <button
            type="button"
            onClick={() => setTipoEntrega("entrega")}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all",
              tipoEntrega === "entrega"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            <Truck className="size-6" strokeWidth={2} />
            Receber em casa
          </button>
        </div>
      </section>

      {tipoEntrega === "entrega" && (
        <section className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div>
            <h3 className="text-base font-extrabold">Endereço de entrega</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Informe onde deseja receber seu pedido.
            </p>
          </div>

          <label className="block space-y-2">
            <span className={classeLabel}>Rua / Avenida *</span>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Digite sua rua ou avenida"
              className={cn(
                classeInput,
                mostrarErros && erros.endereco ? "border-destructive" : "border-border",
              )}
            />
            {mostrarErros && erros.endereco && (
              <p className="text-xs font-semibold text-destructive">{erros.endereco}</p>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className={classeLabel}>Número *</span>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="123 ou S/N"
                className={cn(
                  classeInput,
                  mostrarErros && erros.numero ? "border-destructive" : "border-border",
                )}
              />
              {mostrarErros && erros.numero && (
                <p className="text-xs font-semibold text-destructive">{erros.numero}</p>
              )}
            </label>

            <label className="block space-y-2">
              <span className={classeLabel}>Complemento</span>
              <input
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Casa, apto..."
                className={cn(classeInput, "border-border")}
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className={classeLabel}>Bairro *</span>
            <select
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className={cn(
                classeInput,
                mostrarErros && erros.bairro ? "border-destructive" : "border-border",
              )}
            >
              <option value="">Selecione o bairro</option>
              {Object.entries(TAXAS_ENTREGA).map(([nomeBairro, taxa]) => (
                <option key={nomeBairro} value={nomeBairro}>
                  {nomeBairro} - {brl(taxa)}
                </option>
              ))}
            </select>
            {mostrarErros && erros.bairro && (
              <p className="text-xs font-semibold text-destructive">{erros.bairro}</p>
            )}
          </label>

          <label className="block space-y-2">
            <span className={classeLabel}>Ponto de referência</span>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ex: perto da praça, em frente à escola..."
              className={cn(classeInput, "border-border")}
            />
          </label>

          {bairro && (
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div>
                <p className="text-sm font-extrabold">Taxa de entrega</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{bairro}</p>
              </div>
              <span className="text-lg font-black text-primary">{brl(taxaEntrega)}</span>
            </div>
          )}
        </section>
      )}

      <section className="space-y-4 border-t border-border pt-5">
        <div>
          <h3 className="text-base font-extrabold">Forma de pagamento</h3>
          <p className="mt-1 text-xs text-muted-foreground">Selecione como deseja pagar.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
                "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 p-2 text-sm font-bold transition-all",
                formaPagamento === op.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <op.icon className="size-6" strokeWidth={2} />
              {op.label}
            </button>
          ))}
        </div>

        {formaPagamento === "dinheiro" && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <span className="text-sm font-bold">Vai precisar de troco? *</span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrecisaTroco("sim");
                  setValorRecebido("");
                }}
                className={cn(
                  "rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all",
                  precisaTroco === "sim"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                Sim, preciso
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrecisaTroco("nao");
                  setValorRecebido("");
                }}
                className={cn(
                  "rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all",
                  precisaTroco === "nao"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                Não preciso
              </button>
            </div>

            {mostrarErros && erros.troco && (
              <p className="text-xs font-semibold text-destructive">{erros.troco}</p>
            )}

            {precisaTroco === "sim" && (
              <div className="space-y-2">
                <label className="block space-y-2">
                  <span className={classeLabel}>Vai pagar com quanto?</span>
                  <input
                    inputMode="decimal"
                    placeholder="Ex: 50"
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    className={cn(
                      classeInput,
                      mostrarErros && erros.valorRecebido ? "border-destructive" : "border-border",
                    )}
                  />
                </label>

                {valorRecebido && (
                  <p
                    className={cn(
                      "text-sm font-bold",
                      trocoInsuficiente ? "text-destructive" : "text-green-700 dark:text-green-400",
                    )}
                  >
                    {valorRecebidoInvalido
                      ? "Digite um valor válido. Ex: 50"
                      : valorRecebidoNumero < total
                        ? "O valor informado é menor que o total do pedido."
                        : `Troco: ${brl(valorRecebidoNumero - total)}`}
                  </p>
                )}

                {mostrarErros && erros.valorRecebido && (
                  <p className="text-xs font-semibold text-destructive">{erros.valorRecebido}</p>
                )}
              </div>
            )}
          </div>
        )}

        {formaPagamento === "pix" && (
          <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
            O QR Code do PIX aparece na próxima tela, assim que o pedido for enviado.
          </p>
        )}
      </section>

      <div className="border-t border-border pt-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">Total do pedido</span>
          <span className="text-xl font-black text-primary">{brl(total)}</span>
        </div>

        <button
          type="button"
          disabled={enviando}
          onClick={finalizarPedido}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-extrabold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="size-5" strokeWidth={2.5} />
          {enviando ? "Enviando pedido..." : "Finalizar pedido"}
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Confira os dados antes de confirmar seu pedido.
        </p>
      </div>
    </div>
  );
}
