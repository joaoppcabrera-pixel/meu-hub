-- =============================================
-- MEU HUB — Schema do banco de dados
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- Contas bancárias (cadastro em Configurações)
create table if not exists contas_bancarias (
  id          text primary key,
  banco_id    text not null,
  nome        text not null,
  tipo        text not null, -- 'corrente' | 'cartao' | 'investimento'
  saldo_inicial numeric default 0,
  limite      numeric,
  dia_fechamento integer,
  dia_vencimento integer,
  created_at  timestamptz default now()
);

-- Categorias (cadastro em Configurações)
create table if not exists categorias (
  id         text primary key,
  nome       text not null,
  cor        text not null,
  created_at timestamptz default now()
);

-- Gastos fixos (linhas da projeção anual)
create table if not exists linhas_fixas (
  id             text primary key,
  nome           text not null,
  tipo           text not null, -- sempre 'gasto'
  categoria      text,
  dia_vencimento integer,
  valores        jsonb default '{}',
  pagos          jsonb default '{}',
  created_at     timestamptz default now()
);

-- Entradas (receitas)
create table if not exists entradas (
  id         text primary key,
  descricao  text not null,
  valor      numeric not null,
  data       date not null,
  categoria  text not null,
  conta_id   text not null,
  created_at timestamptz default now()
);

-- Parcelamentos no cartão
create table if not exists parcelamentos (
  id             text primary key,
  cartao_id      text not null,
  descricao      text not null,
  categoria      text not null,
  valor_total    numeric not null,
  total_parcelas integer not null,
  mes_inicio     integer not null,
  valor_parcela  numeric not null,
  created_at     timestamptz default now()
);

-- Gastos variáveis (dia a dia)
create table if not exists gastos_variaveis (
  id         text primary key,
  descricao  text not null,
  valor      numeric not null,
  data       date not null,
  categoria  text not null,
  meio       text not null, -- 'debito' | 'credito' | 'pix' | 'dinheiro' | 'va'
  cartao_id  text,
  conta_id   text,
  created_at timestamptz default now()
);

-- Reservas e investimentos
create table if not exists reservas (
  id         text primary key,
  nome       text not null,
  tipo       text not null,
  saldo_atual numeric default 0,
  meta       numeric,
  aportes    jsonb default '{}',
  created_at timestamptz default now()
);

-- =============================================
-- Desabilitar RLS (app pessoal, sem autenticação)
-- =============================================
alter table contas_bancarias disable row level security;
alter table categorias disable row level security;
alter table linhas_fixas disable row level security;
alter table entradas disable row level security;
alter table parcelamentos disable row level security;
alter table gastos_variaveis disable row level security;
alter table reservas disable row level security;
