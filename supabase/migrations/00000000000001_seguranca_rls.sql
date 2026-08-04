-- Reforça a segurança: RLS restritivo + criação/consulta de pedido via função segura (RPC).
-- Rode isso DEPOIS do 00000000000000_schema_completo.sql, no SQL Editor do Supabase.

-- ============================================================
-- 1) PRODUTOS: leitura pública, escrita só para admin logado
-- ============================================================
DROP POLICY IF EXISTS "produtos_public" ON public.produtos;
DROP POLICY IF EXISTS "produtos_select_public" ON public.produtos;
DROP POLICY IF EXISTS "produtos_insert_admin" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update_admin" ON public.produtos;
DROP POLICY IF EXISTS "produtos_delete_admin" ON public.produtos;

CREATE POLICY "produtos_select_public" ON public.produtos
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "produtos_insert_admin" ON public.produtos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "produtos_update_admin" ON public.produtos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "produtos_delete_admin" ON public.produtos
  FOR DELETE TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.produtos FROM anon;
GRANT SELECT ON public.produtos TO anon;

-- ============================================================
-- 2) PEDIDOS e ITENS_PEDIDO: nada de acesso direto para anon.
--    O cliente só cria/consulta pedido através das funções abaixo.
-- ============================================================
DROP POLICY IF EXISTS "pedidos_public" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_admin_all" ON public.pedidos;
CREATE POLICY "pedidos_admin_all" ON public.pedidos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "itens_pedido_public" ON public.itens_pedido;
DROP POLICY IF EXISTS "itens_pedido_admin_all" ON public.itens_pedido;
CREATE POLICY "itens_pedido_admin_all" ON public.itens_pedido
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON public.pedidos FROM anon;
REVOKE ALL ON public.itens_pedido FROM anon;

-- ============================================================
-- 3) Criar pedido: função única, atômica, roda com privilégio elevado
--    (valida estoque, grava pedido + itens, desconta estoque — tudo ou nada)
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_pedido_publico(
  p_nome_cliente text,
  p_telefone text,
  p_tipo_entrega text,
  p_endereco text,
  p_forma_pagamento text,
  p_itens jsonb -- [{"produto_id": "...", "quantidade": 1, "tamanho": "inteiro", "observacoes": "..."}]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_produto public.produtos%ROWTYPE;
  v_qtd int;
  v_preco numeric(10,2);
  v_estoque int;
BEGIN
  IF trim(coalesce(p_nome_cliente, '')) = '' THEN
    RAISE EXCEPTION 'nome do cliente é obrigatório';
  END IF;
  IF p_tipo_entrega NOT IN ('retirada', 'entrega') THEN
    RAISE EXCEPTION 'tipo_entrega inválido';
  END IF;
  IF p_forma_pagamento NOT IN ('pix', 'cartao', 'dinheiro') THEN
    RAISE EXCEPTION 'forma_pagamento inválida';
  END IF;
  IF p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'pedido sem itens';
  END IF;

  INSERT INTO public.pedidos (status, nome_cliente, telefone, tipo_entrega, endereco, forma_pagamento, total)
  VALUES ('recebido', p_nome_cliente, p_telefone, p_tipo_entrega,
          CASE WHEN p_tipo_entrega = 'entrega' THEN p_endereco ELSE NULL END,
          p_forma_pagamento, 0)
  RETURNING id INTO v_pedido_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens) LOOP
    -- FOR UPDATE trava a linha do produto até o fim da transação, evitando
    -- que dois pedidos simultâneos vendam a mesma última unidade em estoque.
    SELECT * INTO v_produto
    FROM public.produtos
    WHERE id = (v_item->>'produto_id')::uuid AND ativo = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'produto indisponível';
    END IF;

    v_qtd := GREATEST(1, (v_item->>'quantidade')::int);

    IF (v_item->>'tamanho') = 'inteiro' THEN
      v_preco := v_produto.preco_inteiro;
      v_estoque := v_produto.estoque_inteiro;
    ELSIF (v_item->>'tamanho') = 'metade' THEN
      v_preco := v_produto.preco_metade;
      v_estoque := v_produto.estoque_metade;
    ELSE
      RAISE EXCEPTION 'tamanho inválido';
    END IF;

    IF v_estoque < v_qtd THEN
      RAISE EXCEPTION 'estoque insuficiente para %', v_produto.nome;
    END IF;

    INSERT INTO public.itens_pedido
      (pedido_id, produto_id, nome_produto, preco_unitario, quantidade, tamanho, observacoes)
    VALUES
      (v_pedido_id, v_produto.id, v_produto.nome, v_preco, v_qtd, v_item->>'tamanho', v_item->>'observacoes');

    v_total := v_total + v_preco * v_qtd;

    IF (v_item->>'tamanho') = 'inteiro' THEN
      UPDATE public.produtos SET estoque_inteiro = estoque_inteiro - v_qtd WHERE id = v_produto.id;
    ELSE
      UPDATE public.produtos SET estoque_metade = estoque_metade - v_qtd WHERE id = v_produto.id;
    END IF;
  END LOOP;

  UPDATE public.pedidos SET total = v_total WHERE id = v_pedido_id;

  RETURN v_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_pedido_publico(text, text, text, text, text, jsonb) TO anon, authenticated;

-- ============================================================
-- 4) Consultar pedido: só retorna o pedido cujo ID exato foi informado
--    (o ID do pedido, um UUID longo, funciona como uma senha de acesso).
--    Não expõe telefone nem permite listar todos os pedidos.
-- ============================================================
CREATE OR REPLACE FUNCTION public.obter_pedido_publico(p_id uuid)
RETURNS TABLE (
  id uuid,
  status public.pedido_status,
  nome_cliente text,
  tipo_entrega text,
  endereco text,
  forma_pagamento text,
  total numeric,
  criado_em timestamptz,
  atualizado_em timestamptz,
  itens jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.status, p.nome_cliente, p.tipo_entrega, p.endereco, p.forma_pagamento,
    p.total, p.criado_em, p.atualizado_em,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'nome_produto', i.nome_produto,
          'preco_unitario', i.preco_unitario,
          'quantidade', i.quantidade,
          'tamanho', i.tamanho,
          'observacoes', i.observacoes
        )
      ) FILTER (WHERE i.id IS NOT NULL),
      '[]'::jsonb
    ) AS itens
  FROM public.pedidos p
  LEFT JOIN public.itens_pedido i ON i.pedido_id = p.id
  WHERE p.id = p_id
  GROUP BY p.id;
$$;

GRANT EXECUTE ON FUNCTION public.obter_pedido_publico(uuid) TO anon, authenticated;
