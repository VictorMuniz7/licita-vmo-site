# Contexto do projeto (handoff)

Portal de vendas + painel do cliente do **Radar de licitações** e do **Licita-VMO** (VMO Sistemas, Maringá-PR).
Leia também o `README.md` (implantação, integração, pendências).

## Stack
- Angular 22 (standalone, zoneless, signals, control flow `@if/@for`), Tailwind 4 (`src/styles.css`, tokens da marca VMO), fontes auto-hospedadas: Space Grotesk nos títulos e números (`.display/.titulo/.subtitulo/.num`, `font-display`), Archivo no texto.
- Logo (`src/app/shared/logo.ts` e `public/favicon.svg`) segue a geometria do arquivo oficial `vmo-sistemas-logo-sem-titulo.svg`: o V é recortado pelo pentágono, sem pontas para fora.
- Supabase **compartilhado com o sistema Licita-VMO** (mesmo login e banco). Edge Functions em Deno.
- Pagamento: Asaas (assinatura mensal, `billingType: UNDEFINED` → cliente escolhe Pix/boleto/cartão na fatura).

## Decisões do dono do projeto (não mudar sem perguntar)
- Planos à venda agora: **Radar (R$ 97)**, **Licita-VMO (R$ 197, PREÇO PROVISÓRIO)**, **Radar + Gestão (R$ 247)**. "Ajuda por edital" e "Contadores" ficam de fora por enquanto.
- **4 usuários no total por conta** (titular + 3), sem compra de usuário extra. Trava no banco (`tg_members_limit`).
- Radar e Licita-VMO são produtos independentes; o radar é desenvolvido por outra pessoa.
- Identidade visual igual à apresentação executiva da VMO (petróleo/abismo/ciano, cantos chanfrados `.chanfro`).

## Onde está o quê
- `src/app/core/` — config, modelos, `auth.service`, `portal.service` (estado do cliente), guards, `demo.ts` (modo demonstração quando `config.supabaseUrl` está vazio).
- `src/app/pages/public/` — landing (`home.html`), planos, contratar (checkout).
- `src/app/pages/auth/` — entrar, cadastro, recuperar/definir senha (também destino dos convites).
- `src/app/pages/painel/` — visão geral, usuários, radar, faturas, assinatura, empresa.
- `supabase/migrations/…portal_cliente.sql` — tabelas, RLS, `my_entitlements()`, `has_licita_access()`, `current_account_id()`.
- `supabase/functions/` — `criar-checkout`, `asaas-webhook` (sem JWT), `cancelar-assinatura`, `gerenciar-usuarios`.

## Classes CSS próprias
Botões: `btn` + `btn-ciano|btn-escuro|btn-claro|btn-fantasma|btn-perigo` (+ `btn-sm`). Selos: `selo selo-ok|selo-atencao|selo-erro|selo-neutro`. Avisos: `aviso aviso-ok|aviso-erro|aviso-atencao`. Tailwind 4 não permite `@apply` de classe própria — use as duas classes juntas no template.

## Cuidados
- Em guards/funções async, chame `inject()` **antes** de qualquer `await` (senão NG0203).
- Signals com arrays: sempre setar array novo (não mutar), senão `computed` não atualiza.
- `ng build` de produção tem `optimization.fonts: false` de propósito.

## Validado
Fluxo completo em modo demo (Playwright), SQL testado em PostgreSQL local (RLS, limite de 4, acesso por plano, cancelamento), Edge Functions passam no `deno check`.
**Não testado:** chamadas reais ao Asaas, webhook e e-mails de convite do Supabase — testar no sandbox.

## Próximos passos sugeridos
1. Criar projeto Supabase, rodar a migration, publicar as funções, preencher `src/app/core/config.ts`.
2. Testar compra no sandbox do Asaas (inclusive troca de plano: `PUT /subscriptions/{id}`).
3. Páginas de termos de uso e privacidade; sincronizar e-mail de faturas com o cliente Asaas.
4. Integrar o login do Licita-VMO com `rpc('my_entitlements')`.
