# Próximos passos — Sweet Cake (Cardápio Digital)

Checklist do que ainda falta fazer, organizado por prioridade. Vá marcando `[x]` conforme for concluindo.

## 🔴 Segurança — fazer antes de divulgar o link pros clientes

- [ ] **Desativar cadastro público de admin** (depois de já ter criado sua própria conta):
  `Authentication → Sign In / Providers → Email` → desativar **"Allow new users to sign up"**
  (manter o **"Enable Email provider"** ativado — esse é o login, não o cadastro)
- [ ] **Reativar "Confirm email"** no Supabase antes de ir pra produção de verdade
  (`Authentication → Sign In / Providers → Email → Confirm email`)
  Foi desativado só pra facilitar os testes iniciais.
- [ ] Confirmar que o `.env` **não** foi commitado no GitHub (checar se `.gitignore` tem `.env`)

## 🟡 Segurança — recomendado, mas não urgente

- [ ] **Cloudflare Turnstile no login/cadastro do admin** — o código já está pronto em `src/routes/auth.tsx`,
  só falta:
  1. Criar o site no [Cloudflare Turnstile](https://dash.cloudflare.com) → pegar Site Key e Secret Key
  2. Colar a Secret Key em `Authentication → Attack Protection` no Supabase
  3. Colar a Site Key em `VITE_TURNSTILE_SITE_KEY` no `.env`
- [ ] **Cloudflare Turnstile no formulário de pedido do cliente** (checkout) — ainda não implementado.
  Protege contra bots/spam de pedidos falsos, já que a função `criar_pedido_publico` é pública
  (necessário, pois o cliente não faz login pra pedir).
- [ ] **Rate limiting** na função `criar_pedido_publico` — hoje não existe limite de quantos pedidos
  o mesmo IP/dispositivo pode criar em sequência.

## 🟢 Conteúdo e ajustes de negócio

- [ ] Trocar o nome "Sweet Cake" pelo nome real da loja
  (aparece no header do cliente em `src/routes/index.tsx` e na sidebar do admin em `src/routes/admin.tsx`)
- [ ] Subir fotos reais dos bolos (campo "URL da foto" no cadastro de produto, dentro do admin)
- [ ] Revisar/apagar os produtos de exemplo (Bolo de Chocolate, Morango, Leite Ninho, Red Velvet)
  e cadastrar o cardápio real

## 🔵 Infraestrutura / Deploy

- [ ] Fazer o deploy em produção — o projeto já vem configurado com Nitro mirando **Cloudflare**
  (`@lovable.dev/vite-tanstack-config`), então **Cloudflare Pages/Workers** é o caminho de menor
  resistência. Configurar as mesmas variáveis do `.env` no painel da plataforma de deploy.
- [ ] Configurar domínio próprio depois do deploy

## ✅ Já feito

- [x] Modelo de dados adaptado (Inteiro/Metade, estoque separado, retirada/entrega)
- [x] RLS corrigido: produtos com leitura pública e escrita só pra admin; pedidos/itens só pra admin
- [x] Criação e consulta de pedido migradas para funções seguras no banco
  (`criar_pedido_publico` e `obter_pedido_publico`), com transação atômica e trava de estoque
