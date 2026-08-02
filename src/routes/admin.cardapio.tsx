import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { brl, excluirProduto, fetchProdutos, salvarProduto, type Produto } from "@/lib/cardapio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/cardapio")({
  head: () => ({
    meta: [
      { title: "Gestão de cardápio — Cardápio Digital" },
      {
        name: "description",
        content: "Crie, edite e organize os bolos por categoria, preço, estoque e disponibilidade.",
      },
      { property: "og:title", content: "Gestão de cardápio — Cardápio Digital" },
      { property: "og:description", content: "Bolos por categoria, preço, estoque e status." },
    ],
  }),
  component: GestaoCardapio,
});

type Rascunho = {
  id?: string;
  nome: string;
  descricao: string;
  precoInteiro: string;
  precoMetade: string;
  estoqueInteiro: string;
  estoqueMetade: string;
  categoria: string;
  foto_url: string;
  tags: string[];
  ativo: boolean;
};

const vazio: Rascunho = {
  nome: "",
  descricao: "",
  precoInteiro: "",
  precoMetade: "",
  estoqueInteiro: "0",
  estoqueMetade: "0",
  categoria: "Bolos",
  foto_url: "",
  tags: [],
  ativo: true,
};

const CATEGORIAS = ["Bolos", "Doces", "Salgados", "Bebidas", "Outros"];
const TAGS = ["vegano", "sem glúten", "sem açúcar", "encomenda"];

function numero(v: string) {
  return Number(v.replace(",", ".")) || 0;
}

function GestaoCardapio() {
  const queryClient = useQueryClient();
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos", "todos"],
    queryFn: () => fetchProdutos(false),
  });

  const salvar = useMutation({
    mutationFn: (r: Rascunho) =>
      salvarProduto({
        id: r.id,
        nome: r.nome,
        descricao: r.descricao,
        preco_inteiro: numero(r.precoInteiro),
        preco_metade: numero(r.precoMetade),
        estoque_inteiro: Math.max(0, Math.round(numero(r.estoqueInteiro))),
        estoque_metade: Math.max(0, Math.round(numero(r.estoqueMetade))),
        categoria: r.categoria,
        foto_url: r.foto_url,
        tags: r.tags,
        ativo: r.ativo,
      }),
    onSuccess: () => {
      setRascunho(null);
      queryClient.invalidateQueries();
      toast.success("Produto salvo");
    },
    onError: () => toast.error("Não foi possível salvar"),
  });

  const remover = useMutation({
    mutationFn: excluirProduto,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Produto excluído");
    },
    onError: () => toast.error("Produto já usado em um pedido"),
  });

  const alternarAtivo = useMutation({
    mutationFn: (p: Produto) => salvarProduto({ ...p, ativo: !p.ativo }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const categorias = Array.from(new Set([...CATEGORIAS, ...produtos.map((p) => p.categoria)]));

  return (
    <main className="px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Cardápio</h1>
          <p className="mt-1 text-sm text-muted-foreground">{produtos.length} produtos cadastrados.</p>
        </div>
        <button
          onClick={() => setRascunho(vazio)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          Novo produto
        </button>
      </div>

      {rascunho && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvar.mutate(rascunho);
          }}
          className="panel mt-6 space-y-4 p-5"
        >
          <h2 className="text-sm font-semibold">
            {rascunho.id ? "Editar produto" : "Novo produto"}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Nome">
              <input
                required
                value={rascunho.nome}
                onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                className={inputCls}
              />
            </Campo>
            <Campo label="Categoria">
              <select
                value={rascunho.categoria}
                onChange={(e) => setRascunho({ ...rascunho, categoria: e.target.value })}
                className={inputCls}
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Campo label="Preço inteiro (R$)">
              <input
                required
                inputMode="decimal"
                value={rascunho.precoInteiro}
                onChange={(e) => setRascunho({ ...rascunho, precoInteiro: e.target.value })}
                className={inputCls}
              />
            </Campo>
            <Campo label="Preço metade (R$)">
              <input
                required
                inputMode="decimal"
                value={rascunho.precoMetade}
                onChange={(e) => setRascunho({ ...rascunho, precoMetade: e.target.value })}
                className={inputCls}
              />
            </Campo>
            <Campo label="Estoque inteiro">
              <input
                required
                inputMode="numeric"
                value={rascunho.estoqueInteiro}
                onChange={(e) => setRascunho({ ...rascunho, estoqueInteiro: e.target.value })}
                className={inputCls}
              />
            </Campo>
            <Campo label="Estoque metade">
              <input
                required
                inputMode="numeric"
                value={rascunho.estoqueMetade}
                onChange={(e) => setRascunho({ ...rascunho, estoqueMetade: e.target.value })}
                className={inputCls}
              />
            </Campo>
          </div>

          <Campo label="URL da foto (opcional)">
            <input
              value={rascunho.foto_url}
              onChange={(e) => setRascunho({ ...rascunho, foto_url: e.target.value })}
              className={inputCls}
            />
          </Campo>

          <Campo label="Descrição">
            <textarea
              rows={2}
              value={rascunho.descricao}
              onChange={(e) => setRascunho({ ...rascunho, descricao: e.target.value })}
              className={inputCls}
            />
          </Campo>

          <div className="flex flex-wrap items-center gap-2">
            {TAGS.map((t) => {
              const ativo = rascunho.tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setRascunho({
                      ...rascunho,
                      tags: ativo
                        ? rascunho.tags.filter((x) => x !== t)
                        : [...rascunho.tags, t],
                    })
                  }
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    ativo
                      ? "border-primary/40 bg-primary-soft text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {t}
                </button>
              );
            })}
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={rascunho.ativo}
                onChange={(e) => setRascunho({ ...rascunho, ativo: e.target.checked })}
                className="accent-primary"
              />
              Ativo no cardápio
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvar.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setRascunho(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-8">
        {categorias
          .filter((c) => produtos.some((p) => p.categoria === c))
          .map((categoria) => (
            <section key={categoria}>
              <h2 className="text-sm font-semibold text-muted-foreground">{categoria}</h2>
              <ul className="mt-3 space-y-2">
                {produtos
                  .filter((p) => p.categoria === categoria)
                  .map((p) => (
                    <li key={p.id} className="panel flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{p.nome}</h3>
                          {p.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        {p.descricao && (
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {p.descricao}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Inteiro: {brl(p.preco_inteiro)} · estoque {p.estoque_inteiro}</span>
                          <span>Metade: {brl(p.preco_metade)} · estoque {p.estoque_metade}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alternarAtivo.mutate(p)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                          p.ativo
                            ? "border-primary/30 bg-primary-soft text-primary"
                            : "border-border text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {p.ativo ? "Ativo" : "Inativo"}
                      </button>
                      <button
                        onClick={() =>
                          setRascunho({
                            id: p.id,
                            nome: p.nome,
                            descricao: p.descricao ?? "",
                            precoInteiro: String(p.preco_inteiro),
                            precoMetade: String(p.preco_metade),
                            estoqueInteiro: String(p.estoque_inteiro),
                            estoqueMetade: String(p.estoque_metade),
                            categoria: p.categoria,
                            foto_url: p.foto_url ?? "",
                            tags: p.tags,
                            ativo: p.ativo,
                          })
                        }
                        aria-label={`Editar ${p.nome}`}
                        className="size-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent"
                      >
                        <Pencil className="mx-auto size-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => remover.mutate(p.id)}
                        aria-label={`Excluir ${p.nome}`}
                        className="size-8 rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      >
                        <Trash2 className="mx-auto size-3.5" strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
