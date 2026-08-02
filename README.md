# Orderly Eats

Crie um MVP de aplicativo web chamado "Cardápio Digital" — um sistema de 

pedidos e comanda digital para restaurantes/bares/lanchonetes pequenos.

## Contexto do produto

O dono do estabelecimento gerencia o cardápio e acompanha pedidos. 

O cliente acessa o cardápio via QR Code na mesa, faz o pedido pelo 

celular, e a cozinha recebe em tempo real. É dividido em dois painéis:

1. Painel do Lojista (admin)

2. Cardápio do Cliente (público, acessado via link/QR Code por mesa)

## Design System (inspirado no Linear — dark, minimalista, denso)

- Fundo principal: quase-preto (#08090A)

- Superfícies/cards: cinza muito escuro (#1C1C1F a #232326)

- Texto principal: branco suave (#F7F8F8)

- Texto secundário: cinza (#8A8F98)

- Cor de destaque (accent): roxo-violeta (#5E6AD2), usada em botões, 

  links e status ativos

- Bordas: cinza translúcido sutil (rgba(255,255,255,0.08))

- Tipografia: Inter, títulos peso 600, corpo peso 400

- Cantos arredondados discretos (8px)

- Ícones lineares finos (outline, não preenchidos)

- Espaçamento generoso entre elementos, hover e transições suaves 

  (nada de efeitos exagerados)

## Painel do Lojista (admin) — telas

1. Login/Dashboard: métricas do dia (pedidos, faturamento, produto 

   mais vendido), lista de mesas com status (livre/ocupada/aguardando)

2. Gestão de Cardápio: listar produtos por categoria, criar/editar/

   excluir produto (nome, descrição, preço, foto, categoria, tags 

   como vegano/sem glúten, ativo/inativo)

3. Comandas Ativas: lista de pedidos em andamento por mesa, com status 

   (Recebido → Em preparo → Pronto → Entregue), botão para avançar status

4. Painel de Cozinha (KDS): visualização tipo Kanban dos pedidos por 

   status, otimizado pra tela grande na cozinha

5. Histórico: comandas fechadas, filtro por data

## Cardápio do Cliente (público) — telas

1. Cardápio: categorias em abas/scroll horizontal, cards de produto 

   com foto, nome, preço, botão de adicionar

2. Carrinho/Pedido: itens selecionados, quantidade, observações, 

   botão "Enviar pedido"

3. Acompanhamento: status do pedido em tempo real, botão "Chamar 

   garçom"

4. Fechamento de conta: resumo da comanda, opção de dividir entre 

   pessoas da mesa

## Modelo de dados sugerido

- estabelecimentos (id, nome, logo)

- mesas (id, numero, estabelecimento_id, status)

- produtos (id, nome, descricao, preco, foto_url, categoria, 

  ativo, estabelecimento_id)

- pedidos (id, mesa_id, status, criado_em)

- itens_pedido (id, pedido_id, produto_id, quantidade, observacoes)

Comece pelo Cardápio do Cliente e o fluxo de pedido, depois o Painel 

do Lojista.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cc9a1a48-2021-4260-bf0a-c8d03ca9f335).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
