# Portal Licita-VMO

Site de vendas e painel do cliente do **Radar de licitações** e do **Licita-VMO**.
Angular 22 + Tailwind 4 + Supabase (mesmo projeto do Licita-VMO) + Asaas.

## Rodar agora (modo demonstração)

```bash
npm install
npm start          # http://localhost:4200
```

Com `supabaseUrl` vazio em `src/app/core/config.ts`, o site roda com dados de exemplo salvos no navegador:
- **Entrar** com qualquer e-mail/senha → conta de exemplo (Limpa Bem, plano Radar + Gestão, 3 usuários).
- **Criar conta** → conta vazia, para testar o fluxo de compra do zero (pagamento aprovado na hora).

## O que tem

| Rota | O que faz |
|---|---|
| `/` | Landing: serviços, como funciona, diferenciais, planos, dúvidas |
| `/planos` | Planos e tabela comparativa |
| `/cadastro`, `/entrar`, `/recuperar-senha`, `/definir-senha` | Conta do titular; `/definir-senha` também recebe os convites dos usuários |
| `/em-breve` | Aviso de lançamento em breve (enquanto `vendasAbertas` for `false`) |
| `/contratar/:plano` | Dados da empresa (CNPJ validado) → fatura do Asaas (Pix, boleto ou cartão) |
| `/painel` | Serviços ativos, situação da assinatura, próximos passos |
| `/painel/usuarios` | Convidar, desativar, reativar, remover e reenviar acesso (máx. 4 contando o titular) |
| `/painel/radar` | Perfil de busca: palavras, CNAEs, UFs, cidades, faixa de valor, ME/EPP, WhatsApps, áudio, horário |
| `/painel/faturas` | Cobranças com link para pagar/comprovante |
| `/painel/assinatura` | Trocar de plano ou cancelar (acesso segue até o fim do período pago) |
| `/painel/empresa` | Dados cadastrais (CNPJ travado) |

Usuários que não são titulares só veem a visão geral com o botão do Licita-VMO.

## Colocar em produção

### 1. Banco (Supabase)
No projeto Supabase que o Licita-VMO vai usar, rode `supabase/migrations/20261103000000_portal_cliente.sql` no SQL Editor (pode rodar de novo sem quebrar).
Ele cria planos, contas, assinaturas, cobranças, usuários da conta, perfil do radar, as regras de acesso (RLS) e as funções que o Licita-VMO usa.

> **Preço do Licita-VMO sozinho está provisório (R$ 197).** Ajuste quando definir:
> `update plans set price_cents = 19700 where id = 'licita';` — `null` tira o plano da venda.

Em **Authentication → URL Configuration**: Site URL = endereço do portal, e adicione `https://SEU-DOMINIO/definir-senha` e `https://SEU-DOMINIO/contratar/*` nas Redirect URLs.

### 2. Asaas
1. Crie a conta (comece no **sandbox**: sandbox.asaas.com) e gere a chave de API.
2. Em Integrações → Webhooks, crie um webhook para cobranças e assinaturas apontando para
   `https://<projeto>.supabase.co/functions/v1/asaas-webhook`, com um token de autenticação que você inventa.

### 3. Edge Functions
```bash
supabase link --project-ref <projeto>
supabase secrets set ASAAS_API_KEY=... ASAAS_WEBHOOK_TOKEN=... ASAAS_ENV=sandbox SITE_URL=https://SEU-DOMINIO
supabase functions deploy criar-checkout cancelar-assinatura gerenciar-usuarios
supabase functions deploy asaas-webhook --no-verify-jwt
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem nas funções. Em produção troque `ASAAS_ENV=production`.

### 4. Front
Preencha `src/app/core/config.ts` (URL e anon key do Supabase, endereço do Licita-VMO, WhatsApp e e-mail) e:

> **Pré-lançamento:** com `vendasAbertas: false` (padrão atual), todo botão de contratar e todo acesso a `/contratar/...`
> mostram a página `/em-breve`, com volta para a página principal e um "Quero ser avisado" pelo WhatsApp.
> Os botões e links de Entrar e Criar conta ficam escondidos, e `/entrar`, `/cadastro` e `/painel` também levam a `/em-breve`.
> No dia do lançamento, troque para `true`. Para testar o painel no modo demonstração, troque para `true` também.

```bash
npm run build      # sai em dist/licita-vmo-site/browser
```
Hospede como SPA (Vercel, Netlify, Cloudflare Pages…) com fallback de todas as rotas para `index.html`.

## Integração com o sistema Licita-VMO

Mesmo banco e mesmo login: quem o titular cria no painel já entra no Licita-VMO com o mesmo e-mail e senha.
No Licita-VMO, logo após o login:

```ts
const { data } = await supabase.rpc('my_entitlements');
const acesso = data?.[0];
if (!acesso?.licita) {
  // sem plano com Licita-VMO, assinatura vencida há mais de 7 dias ou usuário desativado
  await supabase.auth.signOut();
  // mostre: "Seu acesso não está ativo. Fale com o titular da conta."
}
// acesso.account_id = empresa do usuário; acesso.role = 'owner' | 'member'
```

Para separar os dados de cada empresa nas tabelas do Licita-VMO, use `account_id` e políticas como:
```sql
create policy por_conta on processos for all
  using (account_id = public.current_account_id() and public.has_licita_access());
```

O radar (feito pela outra pessoa da dupla) lê `radar_profiles` com a service role e só deve alertar contas com `radar = true`
— a consulta `select * from account_live_subscription(account_id)` + `plans.includes_radar` dá isso.

## Regras de negócio implementadas
- Uma assinatura "viva" por CNPJ; um usuário pertence a uma única conta.
- Máximo de **4 usuários** por conta (titular + 3), travado no banco; sem compra de usuário extra.
- Acesso libera quando o Asaas confirma o pagamento (webhook). Fatura vencida: 7 dias de tolerância.
- Troca de plano: o novo valor vale na próxima fatura; quem sai do Licita-VMO perde o acesso na hora.
- Cancelamento: sem novas cobranças, acesso até o fim do período pago.
- Reativação: quem cancela e contrata de novo antes do fim do período pago não paga na hora. A nova assinatura já começa ativa e a primeira fatura vence no dia em que o período pago acabaria. Depois dessa data, contratar de novo cobra no mesmo dia.
- CNPJ e cliente Asaas só mudam pelas Edge Functions.

## Pendências conhecidas
- Mudar o e-mail de faturas no painel não atualiza o cliente no Asaas (atualize lá por enquanto).
- Termos de uso e política de privacidade: o cadastro pede o aceite, mas as páginas ainda não existem.
- Os números da seção "Tem licitação para empresas do seu tamanho" vêm da apresentação executiva (out/2026); revise antes de publicar.
- A trava de 7 dias de tolerância está em `account_live_subscription` no SQL.
