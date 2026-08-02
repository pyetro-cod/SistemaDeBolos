-- Adapta o schema de "restaurante com mesa" para "loja de bolos com retirada/entrega".

-- 1) Pedidos: remove mesa, adiciona dados do cliente e forma de retirada/pagamento
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS mesa_id CASCADE;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS chamou_garcom;

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS nome_cliente text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS tipo_entrega text NOT NULL DEFAULT 'retirada'
    CHECK (tipo_entrega IN ('retirada', 'entrega')),
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS forma_pagamento text NOT NULL DEFAULT 'pix'
    CHECK (forma_pagamento IN ('pix', 'cartao', 'dinheiro'));

-- 2) Remove o conceito de mesa por completo
DROP TABLE IF EXISTS public.mesas CASCADE;
DROP TYPE IF EXISTS public.mesa_status;

-- 3) Produtos: preço e estoque separados por tamanho (inteiro/metade)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS preco_inteiro numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_metade numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_inteiro int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_metade int NOT NULL DEFAULT 0;

UPDATE public.produtos SET preco_inteiro = preco WHERE preco_inteiro = 0;
ALTER TABLE public.produtos DROP COLUMN IF EXISTS preco;

-- 4) Itens do pedido: guarda o tamanho escolhido (inteiro/metade)
ALTER TABLE public.itens_pedido
  ADD COLUMN IF NOT EXISTS tamanho text NOT NULL DEFAULT 'inteiro'
    CHECK (tamanho IN ('inteiro', 'metade'));

-- 5) Limpa o catálogo de exemplo (bar/restaurante) e cadastra bolos
DELETE FROM public.itens_pedido;
DELETE FROM public.pedidos;
DELETE FROM public.produtos;

UPDATE public.estabelecimentos
  SET nome = 'Sweet Cake'
  WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.produtos
  (estabelecimento_id, nome, descricao, preco_inteiro, preco_metade, estoque_inteiro, estoque_metade, categoria, tags, ativo)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bolo de Chocolate', 'Massa fofinha, cobertura cremosa e raspas de chocolate.', 120.00, 65.00, 4, 2, 'Bolos', '{}', true),
  ('11111111-1111-1111-1111-111111111111', 'Bolo de Morango', 'Massa branca, recheio de morango com chantilly fresco.', 135.00, 72.00, 2, 1, 'Bolos', '{}', true),
  ('11111111-1111-1111-1111-111111111111', 'Bolo de Leite Ninho', 'Recheio cremoso de leite ninho com cobertura especial.', 140.00, 75.00, 5, 3, 'Bolos', '{}', true),
  ('11111111-1111-1111-1111-111111111111', 'Red Velvet', 'Massa aveludada com recheio de cream cheese.', 160.00, 85.00, 1, 2, 'Bolos', '{}', true);
