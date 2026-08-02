
CREATE TYPE public.mesa_status AS ENUM ('livre','ocupada','aguardando');
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

CREATE TABLE public.mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  numero int NOT NULL,
  status public.mesa_status NOT NULL DEFAULT 'livre',
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (estabelecimento_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesas TO anon, authenticated;
GRANT ALL ON public.mesas TO service_role;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mesas_public" ON public.mesas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  preco numeric(10,2) NOT NULL DEFAULT 0,
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
  mesa_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  status public.pedido_status NOT NULL DEFAULT 'recebido',
  chamou_garcom boolean NOT NULL DEFAULT false,
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
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_pedido TO anon, authenticated;
GRANT ALL ON public.itens_pedido TO service_role;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens_pedido_public" ON public.itens_pedido FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_pedido;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;

INSERT INTO public.estabelecimentos (id, nome) VALUES
 ('11111111-1111-1111-1111-111111111111', 'Bar do Vale');

INSERT INTO public.mesas (estabelecimento_id, numero, status) VALUES
 ('11111111-1111-1111-1111-111111111111', 1, 'livre'),
 ('11111111-1111-1111-1111-111111111111', 2, 'ocupada'),
 ('11111111-1111-1111-1111-111111111111', 3, 'livre'),
 ('11111111-1111-1111-1111-111111111111', 4, 'aguardando'),
 ('11111111-1111-1111-1111-111111111111', 5, 'livre'),
 ('11111111-1111-1111-1111-111111111111', 6, 'ocupada'),
 ('11111111-1111-1111-1111-111111111111', 7, 'livre'),
 ('11111111-1111-1111-1111-111111111111', 8, 'livre');

INSERT INTO public.produtos (estabelecimento_id, nome, descricao, preco, categoria, tags, ativo) VALUES
 ('11111111-1111-1111-1111-111111111111','Bolinho de Bacalhau','Seis unidades crocantes com aioli de limão',38.00,'Entradas','{}',true),
 ('11111111-1111-1111-1111-111111111111','Batata Rústica','Com alecrim e maionese da casa',29.00,'Entradas','{vegano}',true),
 ('11111111-1111-1111-1111-111111111111','Bruschetta de Tomate','Pão de fermentação natural, tomate e manjericão',26.00,'Entradas','{vegano}',true),
 ('11111111-1111-1111-1111-111111111111','Burger do Vale','180g de blend, cheddar, cebola caramelizada',44.00,'Pratos','{}',true),
 ('11111111-1111-1111-1111-111111111111','Burger Vegano','Hambúrguer de grão-de-bico e maionese vegana',42.00,'Pratos','{vegano}',true),
 ('11111111-1111-1111-1111-111111111111','Filé à Parmegiana','Acompanha arroz e fritas',68.00,'Pratos','{}',true),
 ('11111111-1111-1111-1111-111111111111','Risoto de Cogumelos','Funghi secchi, parmesão e trufa',59.00,'Pratos','{"sem glúten"}',true),
 ('11111111-1111-1111-1111-111111111111','Chopp Pilsen 500ml','Gelado, torneira própria',16.00,'Bebidas','{"sem glúten"}',false),
 ('11111111-1111-1111-1111-111111111111','IPA Artesanal','Long neck 355ml, lúpulo cítrico',24.00,'Bebidas','{}',true),
 ('11111111-1111-1111-1111-111111111111','Caipirinha de Limão','Cachaça artesanal e limão taiti',28.00,'Bebidas','{vegano,"sem glúten"}',true),
 ('11111111-1111-1111-1111-111111111111','Suco de Laranja','Natural, 400ml',14.00,'Bebidas','{vegano,"sem glúten"}',true),
 ('11111111-1111-1111-1111-111111111111','Água com Gás','500ml',8.00,'Bebidas','{vegano,"sem glúten"}',true),
 ('11111111-1111-1111-1111-111111111111','Petit Gateau','Com sorvete de creme',32.00,'Sobremesas','{}',true),
 ('11111111-1111-1111-1111-111111111111','Pudim da Casa','Receita tradicional',22.00,'Sobremesas','{"sem glúten"}',true);
