import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt, TrendingUp, Flame, PackageX } from "lucide-react";
import { brl, fetchPedidosDoDia, fetchProdutos, inteirosDisponiveis } from "@/lib/cardapio";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard do lojista — Cardápio Digital" },
      {
        name: "description",
        content: "Métricas do dia, faturamento e estoque dos bolos da sua confeitaria.",
      },
      { property: "og:title", content: "Dashboard do lojista — Cardápio Digital" },
      { property: "og:description", content: "Métricas do dia e estoque em tempo real." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos", "dia"],
    queryFn: fetchPedidosDoDia,
  });
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos", "todos"],
    queryFn: () => fetchProdutos(false),
  });

  const faturamento = pedidos.reduce((a, p) => a + p.total, 0);

  const contagem = new Map<string, number>();
  for (const p of pedidos) {
    for (const i of p.itens_pedido ?? []) {
      contagem.set(i.nome_produto, (contagem.get(i.nome_produto) ?? 0) + i.quantidade);
    }
  }
  const maisVendido = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];

  const metricas = [
    { label: "Pedidos hoje", value: String(pedidos.length), icon: Receipt },
    { label: "Faturamento", value: brl(faturamento), icon: TrendingUp },
    {
      label: "Mais vendido",
      value: maisVendido ? `${maisVendido[0]}` : "—",
      hint: maisVendido ? `${maisVendido[1]} unidades` : undefined,
      icon: Flame,
    },
  ];

  const estoqueBaixo = produtos.filter((p) => p.ativo && inteirosDisponiveis(p) <= 1);

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Resumo do dia e estoque da confeitaria.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {metricas.map((m) => (
          <div key={m.label} className="panel p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <m.icon className="size-4" strokeWidth={1.5} />
              {m.label}
            </div>
            <p className="mt-3 truncate text-2xl font-semibold">{m.value}</p>
            {m.hint && <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>}
          </div>
        ))}
      </div>

      <h2 className="mt-10 flex items-center gap-2 text-sm font-semibold">
        <PackageX className="size-4 text-muted-foreground" strokeWidth={1.5} />
        Estoque baixo
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {estoqueBaixo.length === 0 && (
          <p className="panel p-5 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Nenhum bolo com estoque baixo.
          </p>
        )}
        {estoqueBaixo.map((p) => {
          const inteiros = inteirosDisponiveis(p);
          return (
            <div key={p.id} className="panel p-4">
              <p className="text-sm font-semibold">{p.nome}</p>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>Inteiros disponíveis: {inteiros}</span>
                <span>Estoque (meios): {p.estoque_meios}</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}