-- Schema completo da Sweet Cake (rode isso uma única vez em um projeto Supabase novo)

CREATE TYPE public.pedido_status AS ENUM ('recebido','preparo','pronto','entregue','fechado');

CREATE TABLE public.estabelecimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  logo_url text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estabelecimentos TO anon, authenticated;
GRANT ALL ON public.estabelecimentos TO service_role;
ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estabelecimentos_public" ON public.estabelecimentos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  preco_inteiro numeric(10,2) NOT NULL DEFAULT 0,
  preco_metade numeric(10,2) NOT NULL DEFAULT 0,
  estoque_inteiro int NOT NULL DEFAULT 0,
  estoque_metade int NOT NULL DEFAULT 0,
  foto_url text,
  categoria text NOT NULL DEFAULT 'Outros',
  tags text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO anon, authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_public" ON public.produtos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.pedido_status NOT NULL DEFAULT 'recebido',
  nome_cliente text NOT NULL DEFAULT '',
  telefone text,
  tipo_entrega text NOT NULL DEFAULT 'retirada' CHECK (tipo_entrega IN ('retirada','entrega')),
  endereco text,
  forma_pagamento text NOT NULL DEFAULT 'pix' CHECK (forma_pagamento IN ('pix','cartao','dinheiro')),
  total numeric(10,2) NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO anon, authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedidos_public" ON public.pedidos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.itens_pedido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  nome_produto text NOT NULL,
  preco_unitario numeric(10,2) NOT NULL DEFAULT 0,
  quantidade int NOT NULL DEFAULT 1,
  tamanho text NOT NULL DEFAULT 'inteiro' CHECK (tamanho IN ('inteiro','metade')),
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_pedido TO anon, authenticated;
GRANT ALL ON public.itens_pedido TO service_role;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens_pedido_public" ON public.itens_pedido FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_pedido;

INSERT INTO public.estabelecimentos (id, nome) VALUES
 ('11111111-1111-1111-1111-111111111111', 'Sweet Cake');

INSERT INTO public.produtos
  (estabelecimento_id, nome, descricao, preco_inteiro, preco_metade, estoque_inteiro, estoque_metade, categoria, tags, ativo)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bolo de Chocolate', 'Massa fofinha, cobertura cremosa e raspas de chocolate.', 120.00, 65.00, 4, 2, 'Bolos', '{}', true),
  ('11111111-1111-1111-1111-111111111111', 'Bolo de Morango', 'Massa branca, recheio de morango com chantilly fresco.', 135.00, 72.00, 2, 1, 'Bolos', '{}', true),
  ('11111111-1111-1111-1111-111111111111', 'Bolo de Leite Ninho', 'Recheio cremoso de leite ninho com cobertura especial.', 140.00, 75.00, 5, 3, 'Bolos', '{}', true),
  ('11111111-1111-1111-1111-111111111111', 'Red Velvet', 'Massa aveludada com recheio de cream cheese.', 160.00, 85.00, 1, 2, 'Bolos', '{}', true);
