import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Banknote, CreditCard, Landmark, Minus, Plus, Store, Trash2 } from "lucide-react";
import {
  brl,
  disponivelPorTamanho,
  fetchProdutos,
  inteirosDisponiveis,
  precoPorTamanho,
  registrarVendaBalcao,
  traduzErroPedido,
  type FormaPagamento,
  type NovoItem,
  type Produto,
  type Tamanho,
} from "@/lib/cardapio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/balcao")({
  head: () => ({
    meta: [
      { title: "Venda no balcão — Cardápio Digital" },
      {
        name: "description",
        content: "Registre vendas feitas presencialmente na loja, com baixa automática de estoque.",
      },
    ],
  }),
  component: VendaBalcao,
});

function VendaBalcao() {
  const queryClient = useQueryClient();
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos", "todos"],
    queryFn: () => fetchProdutos(false),
  });
  const ativos = produtos.filter((p) => p.ativo);

  const [itens, setItens] = useState<NovoItem[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("dinheiro");

  const total = itens.reduce((a, i) => a + precoPorTamanho(i.produto, i.tamanho) * i.quantidade, 0);

  function adicionar(produto: Produto, tamanho: Tamanho) {
    setItens((atual) => {
      const existe = atual.find((i) => i.produto.id === produto.id && i.tamanho === tamanho);
      if (existe) {
        return atual.map((i) =>
          i.produto.id === produto.id && i.tamanho === tamanho
            ? { ...i, quantidade: i.quantidade + 1 }
            : i,
        );
      }
      return [...atual, { produto, tamanho, quantidade: 1 }];
    });
  }

  function alterarQtd(produtoId: string, tamanho: Tamanho, delta: number) {
    setItens((atual) =>
      atual
        .map((i) =>
          i.produto.id === produtoId && i.tamanho === tamanho
            ? { ...i, quantidade: i.quantidade + delta }
            : i,
        )
        .filter((i) => i.quantidade > 0),
    );
  }

  const registrar = useMutation({
    mutationFn: () => registrarVendaBalcao(formaPagamento, itens),
    onSuccess: () => {
      toast.success("Venda registrada!");
      setItens([]);
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "";
      toast.error(msg ? traduzErroPedido(msg) : "Não foi possível registrar a venda");
    },
  });

  return (
    <main className="px-6 py-8">
      <div className="flex items-center gap-2">
        <Store className="size-5 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="text-2xl">Venda no balcão</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Registre uma venda feita presencialmente na loja. O estoque é descontado na hora.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Lista de produtos */}
        <div className="space-y-3">
          {ativos.length === 0 && (
            <p className="panel p-8 text-center text-sm text-muted-foreground">
              Nenhum produto ativo no cardápio.
            </p>
          )}
          {ativos.map((p) => (
            <div key={p.id} className="panel flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{p.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {inteirosDisponiveis(p)} inteiro(s) em estoque
                </p>
              </div>
              {(["inteiro", "metade"] as Tamanho[]).map((t) => {
                const disponivel = disponivelPorTamanho(p, t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!disponivel}
                    onClick={() => adicionar(p, t)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      "border-border text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary",
                    )}
                  >
                    + {t === "inteiro" ? "Inteiro" : "Metade"} · {brl(precoPorTamanho(p, t))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Resumo da venda */}
        <div className="panel h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold">Resumo da venda</h2>

          {itens.length === 0 && (
            <p className="text-sm text-muted-foreground">Clique em um produto ao lado para adicionar.</p>
          )}

          <div className="space-y-2">
            {itens.map((item) => (
              <div key={`${item.produto.id}-${item.tamanho}`} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.produto.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.tamanho === "inteiro" ? "Inteiro" : "Metade"} ·{" "}
                    {brl(precoPorTamanho(item.produto, item.tamanho) * item.quantidade)}
                  </p>
                </div>
                <button
                  onClick={() => alterarQtd(item.produto.id, item.tamanho, -1)}
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
                  onClick={() => alterarQtd(item.produto.id, item.tamanho, 1)}
                  aria-label="Aumentar"
                  className="size-7 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
                >
                  <Plus className="mx-auto size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>

          {itens.length > 0 && (
            <>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">{brl(total)}</span>
              </div>

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

              <button
                type="button"
                disabled={registrar.isPending}
                onClick={() => registrar.mutate()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                Registrar venda
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}