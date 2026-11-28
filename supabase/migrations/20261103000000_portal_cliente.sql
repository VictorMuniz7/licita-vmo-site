-- =====================================================================
-- Portal do cliente Licita-VMO + Radar de licitações
-- Banco compartilhado com o sistema Licita-VMO (mesmo projeto Supabase).
-- Rode no SQL Editor do Supabase ou com `supabase db push`.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Planos à venda
-- ---------------------------------------------------------------------
create table if not exists public.plans (
  id              text primary key,                -- 'radar' | 'licita' | 'combo'
  name            text not null,
  tagline         text,
  price_cents     integer,                         -- null = preço ainda não definido (não vende)
  includes_radar  boolean not null default false,
  includes_licita boolean not null default false,
  max_users       integer not null default 4,      -- acessos totais ao Licita-VMO (dono + 3)
  features        jsonb not null default '[]'::jsonb,
  highlight       boolean not null default false,
  active          boolean not null default true,
  sort            integer not null default 0,
  created_at      timestamptz not null default now()
);

insert into public.plans (id, name, tagline, price_cents, includes_radar, includes_licita, features, highlight, sort) values
  ('radar', 'Radar', 'Encontre e entenda cada licitação sem abrir o edital', 9700, true, false,
   '["Alertas filtrados pelo perfil da empresa","Resumo do edital em texto e em áudio no WhatsApp","Perguntas ao edital pelo WhatsApp","Lembrete de todos os prazos","Cofre com até 10 certidões"]'::jsonb,
   false, 1),
  -- PREÇO PROVISÓRIO: ajuste price_cents quando o valor do Licita-VMO for definido
  ('licita', 'Licita-VMO', 'Gestão completa dos processos de licitação da empresa', 19700, false, true,
   '["Licitações, itens e prazos da equipe num lugar só","Proposta e declarações em PDF","Atas, contratos e anexos guardados","Relatórios de ganhas, perdidas e contratantes","Cofre de certidões com alerta de vencimento","Até 4 usuários com perfis e auditoria"]'::jsonb,
   false, 2),
  ('combo', 'Radar + Gestão', 'Do alerta no WhatsApp à proposta pronta', 24700, true, true,
   '["Tudo do Radar e do Licita-VMO","Licitação encontrada vira processo com um toque","Compatibilidade pelos atestados e certidões","Aviso de quais licitações cada certidão vencida trava","Até 4 usuários com acesso"]'::jsonb,
   true, 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Conta do cliente (uma por CNPJ). owner_id = quem comprou.
-- ---------------------------------------------------------------------
create table if not exists public.accounts (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null unique references auth.users(id) on delete cascade,
  company_name       text not null,               -- razão social
  trade_name         text,                        -- nome fantasia
  cnpj               text not null unique check (cnpj ~ '^[0-9]{14}$'),
  phone              text,
  billing_email      text,
  address_zip        text,
  address_city       text,
  address_state      text check (address_state is null or address_state ~ '^[A-Z]{2}$'),
  asaas_customer_id  text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Assinatura (no máximo uma "viva" por conta)
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  account_id             uuid not null references public.accounts(id) on delete cascade,
  plan_id                text not null references public.plans(id),
  status                 text not null default 'pending'
                         check (status in ('pending','active','overdue','canceled')),
  price_cents            integer not null,
  asaas_subscription_id  text unique,
  next_due_date          date,
  access_until           date,           -- após cancelar, acesso vale até aqui
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create unique index if not exists subscriptions_uma_viva_por_conta
  on public.subscriptions(account_id) where status in ('pending','active','overdue');

-- ---------------------------------------------------------------------
-- Cobranças (espelho das cobranças do Asaas)
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  account_id         uuid not null references public.accounts(id) on delete cascade,
  subscription_id    uuid references public.subscriptions(id) on delete set null,
  asaas_payment_id   text not null unique,
  value_cents        integer not null,
  status             text not null,          -- status do Asaas: PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED...
  billing_type       text,
  due_date           date,
  paid_at            date,
  invoice_url        text,
  description        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Usuários com acesso ao Licita-VMO (dono + até 3). Escrita só pelas Edge Functions.
-- ---------------------------------------------------------------------
create table if not exists public.account_members (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  user_id     uuid not null unique references auth.users(id) on delete cascade, -- um usuário pertence a uma conta
  name        text not null,
  email       text not null,
  role        text not null default 'member' check (role in ('owner','member')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists account_members_account on public.account_members(account_id);

-- ---------------------------------------------------------------------
-- Perfil de busca do radar
-- ---------------------------------------------------------------------
create table if not exists public.radar_profiles (
  account_id        uuid primary key references public.accounts(id) on delete cascade,
  keywords          text[] not null default '{}',
  excluded_keywords text[] not null default '{}',
  cnaes             text[] not null default '{}',
  states            text[] not null default '{}',
  cities            text[] not null default '{}',
  min_value_cents   bigint,
  max_value_cents   bigint,
  only_me_epp       boolean not null default false,   -- só licitações exclusivas ME/EPP
  whatsapp_numbers  text[] not null default '{}',
  audio_summary     boolean not null default true,
  alert_hour        smallint not null default 6 check (alert_hour between 0 and 23),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Eventos do webhook (idempotência)
-- ---------------------------------------------------------------------
create table if not exists public.billing_events (
  id           text primary key,         -- id do evento no Asaas
  event        text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.tg_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists touch_accounts on public.accounts;
create trigger touch_accounts before update on public.accounts for each row execute function public.tg_touch_updated_at();
drop trigger if exists touch_subscriptions on public.subscriptions;
create trigger touch_subscriptions before update on public.subscriptions for each row execute function public.tg_touch_updated_at();
drop trigger if exists touch_payments on public.payments;
create trigger touch_payments before update on public.payments for each row execute function public.tg_touch_updated_at();
drop trigger if exists touch_radar on public.radar_profiles;
create trigger touch_radar before update on public.radar_profiles for each row execute function public.tg_touch_updated_at();

-- Dono vira o primeiro membro e ganha um perfil de radar vazio
create or replace function public.tg_account_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text; v_email text;
begin
  select coalesce(raw_user_meta_data->>'full_name', email), email into v_name, v_email
    from auth.users where id = new.owner_id;
  insert into public.account_members(account_id, user_id, name, email, role)
    values (new.id, new.owner_id, v_name, v_email, 'owner')
    on conflict (user_id) do nothing;
  insert into public.radar_profiles(account_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists account_created on public.accounts;
create trigger account_created after insert on public.accounts for each row execute function public.tg_account_created();

-- Trava de usuários: máximo definido no plano (4), contando o dono
create or replace function public.tg_members_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  select count(*) into v_count from public.account_members where account_id = new.account_id;
  if v_count >= 4 then
    raise exception 'Limite de 4 usuários por conta atingido' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists members_limit on public.account_members;
create trigger members_limit before insert on public.account_members for each row execute function public.tg_members_limit();

-- ---------------------------------------------------------------------
-- Funções de acesso (usadas pelo portal E pelo sistema Licita-VMO)
-- ---------------------------------------------------------------------
create or replace function public.current_account_id() returns uuid
language sql stable security definer set search_path = public as $$
  select account_id from public.account_members where user_id = auth.uid() and active limit 1
$$;

create or replace function public.is_account_owner(p_account uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.accounts where id = p_account and owner_id = auth.uid())
$$;

-- Assinatura que dá direito de uso hoje
create or replace function public.account_live_subscription(p_account uuid)
returns public.subscriptions
language sql stable security definer set search_path = public as $$
  select s.* from public.subscriptions s
   where s.account_id = p_account
     and (s.status = 'active'
          -- tolerância de 7 dias para fatura vencida
          or (s.status = 'overdue' and s.next_due_date >= current_date - 7)
          or (s.status = 'canceled' and s.access_until >= current_date))
   order by s.created_at desc limit 1
$$;

-- Chame no Licita-VMO logo após o login: supabase.rpc('my_entitlements')
create or replace function public.my_entitlements()
returns table(account_id uuid, company_name text, role text, plan_id text, status text, licita boolean, radar boolean)
language sql stable security definer set search_path = public as $$
  select m.account_id, a.company_name, m.role, s.plan_id, s.status,
         coalesce(p.includes_licita, false) and m.active as licita,
         coalesce(p.includes_radar, false) as radar
    from public.account_members m
    join public.accounts a on a.id = m.account_id
    left join lateral (select * from public.account_live_subscription(m.account_id)) s on true
    left join public.plans p on p.id = s.plan_id
   where m.user_id = auth.uid()
$$;

create or replace function public.has_licita_access() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select licita from public.my_entitlements() limit 1), false)
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.plans            enable row level security;
alter table public.accounts         enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.payments         enable row level security;
alter table public.account_members  enable row level security;
alter table public.radar_profiles   enable row level security;
alter table public.billing_events   enable row level security;  -- sem políticas: só service role

drop policy if exists plans_leitura on public.plans;
create policy plans_leitura on public.plans for select using (active);

-- conta: membros leem; dono cria e edita (CNPJ e cliente Asaas não mudam pelo front)
drop policy if exists accounts_leitura on public.accounts;
create policy accounts_leitura on public.accounts for select using (id = public.current_account_id() or owner_id = auth.uid());
drop policy if exists accounts_criar on public.accounts;
create policy accounts_criar on public.accounts for insert with check (
  owner_id = auth.uid()
  and asaas_customer_id is null
  and not exists (select 1 from public.account_members where user_id = auth.uid())
);
drop policy if exists accounts_editar on public.accounts;
create policy accounts_editar on public.accounts for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- CNPJ, dono e cliente Asaas só mudam pelas Edge Functions (service role)
create or replace function public.tg_accounts_campos_travados() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.cnpj is distinct from old.cnpj
    or new.owner_id is distinct from old.owner_id
    or new.asaas_customer_id is distinct from old.asaas_customer_id) then
    raise exception 'CNPJ e titular da conta não podem ser alterados pelo painel' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists accounts_campos_travados on public.accounts;
create trigger accounts_campos_travados before update on public.accounts for each row execute function public.tg_accounts_campos_travados();

-- assinatura e cobranças: só o dono lê; escrita só pelas Edge Functions
drop policy if exists subs_leitura on public.subscriptions;
create policy subs_leitura on public.subscriptions for select using (public.is_account_owner(account_id));
drop policy if exists pays_leitura on public.payments;
create policy pays_leitura on public.payments for select using (public.is_account_owner(account_id));

-- membros: todos da conta leem; escrita só pelas Edge Functions
drop policy if exists members_leitura on public.account_members;
create policy members_leitura on public.account_members for select using (account_id = public.current_account_id() or public.is_account_owner(account_id));

-- radar: dono lê e edita; membros leem
drop policy if exists radar_leitura on public.radar_profiles;
create policy radar_leitura on public.radar_profiles for select using (account_id = public.current_account_id());
drop policy if exists radar_editar on public.radar_profiles;
create policy radar_editar on public.radar_profiles for update using (public.is_account_owner(account_id)) with check (public.is_account_owner(account_id));

grant execute on function public.my_entitlements() to authenticated;
grant execute on function public.has_licita_access() to authenticated;
grant execute on function public.current_account_id() to authenticated;
