-- =====================================================================
-- FUTSTATS · banco de dados no Supabase
-- Rode este arquivo inteiro no SQL Editor do projeto (pode rodar de novo:
-- tudo é criado só se ainda não existir). Passo a passo em SUPABASE.md.
--
-- Segurança: o site usa só a chave pública (anon). Quem pode ler e gravar
-- cada tabela é decidido aqui, pelas regras de RLS (row level security).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Administradores: contas que podem editar jogos, times e jogadores.
-- Para tornar alguém administrador (depois de a pessoa criar a conta):
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'seu@email.com';
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admin ve a propria linha" on public.admins;
create policy "admin ve a propria linha" on public.admins for select using (user_id = auth.uid());

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Carimbo de hora do servidor em toda gravação (o relógio do navegador não vale).
create or replace function public.carimbar() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Dados do painel: times, jogadores e jogos, no mesmo formato JSON do site.
-- dados = null marca um item apagado (os visitantes também apagam).
-- ---------------------------------------------------------------------
create table if not exists public.registros (
  colecao text not null check (colecao in ('times', 'jogadores', 'jogos')),
  id text not null,
  dados jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (colecao, id)
);
create index if not exists registros_atualizado_em on public.registros (atualizado_em);
alter table public.registros enable row level security;
drop policy if exists "todos leem os registros" on public.registros;
create policy "todos leem os registros" on public.registros for select using (true);
drop policy if exists "admin cria registros" on public.registros;
create policy "admin cria registros" on public.registros for insert with check (public.eh_admin());
drop policy if exists "admin altera registros" on public.registros;
create policy "admin altera registros" on public.registros for update using (public.eh_admin()) with check (public.eh_admin());
drop trigger if exists registros_carimbo on public.registros;
create trigger registros_carimbo before insert or update on public.registros
  for each row execute function public.carimbar();

-- ---------------------------------------------------------------------
-- Perfis: o nome que aparece nos rankings.
-- ---------------------------------------------------------------------
create table if not exists public.perfis (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 24),
  atualizado_em timestamptz not null default now()
);
alter table public.perfis enable row level security;
drop policy if exists "todos leem perfis" on public.perfis;
create policy "todos leem perfis" on public.perfis for select using (true);
drop policy if exists "cada um cria o seu perfil" on public.perfis;
create policy "cada um cria o seu perfil" on public.perfis for insert with check (user_id = auth.uid());
drop policy if exists "cada um altera o seu perfil" on public.perfis;
create policy "cada um altera o seu perfil" on public.perfis for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists perfis_carimbo on public.perfis;
create trigger perfis_carimbo before insert or update on public.perfis
  for each row execute function public.carimbar();

-- ---------------------------------------------------------------------
-- Dados pessoais sincronizados entre aparelhos (favoritos, quiz, meu time,
-- bolão). Só o dono lê e grava.
-- ---------------------------------------------------------------------
create table if not exists public.dados_usuario (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  chave text not null check (chave in ('fs_favoritos', 'fs_favoritos_jogadores', 'fs_quiz', 'fs_meu_time', 'fs_bolao', 'fs_bolao_nome')),
  valor jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, chave)
);
alter table public.dados_usuario enable row level security;
drop policy if exists "dono le os seus dados" on public.dados_usuario;
create policy "dono le os seus dados" on public.dados_usuario for select using (user_id = auth.uid());
drop policy if exists "dono cria os seus dados" on public.dados_usuario;
create policy "dono cria os seus dados" on public.dados_usuario for insert with check (user_id = auth.uid());
drop policy if exists "dono altera os seus dados" on public.dados_usuario;
create policy "dono altera os seus dados" on public.dados_usuario for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists dados_usuario_carimbo on public.dados_usuario;
create trigger dados_usuario_carimbo before insert or update on public.dados_usuario
  for each row execute function public.carimbar();

-- ---------------------------------------------------------------------
-- Bolão online. O palpite só pode ser feito/alterado com o jogo ainda
-- agendado e antes do horário de início; o dos outros só fica visível
-- depois que o jogo começa (ninguém copia).
-- As datas do site estão no horário de Brasília (UTC−3).
-- ---------------------------------------------------------------------
create or replace function public.jogo_aberto(p_jogo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.registros r
    where r.colecao = 'jogos' and r.id = p_jogo and r.dados is not null
      and r.dados ->> 'status' = 'agendado'
      and (left(r.dados ->> 'data', 16) || ':00-03:00')::timestamptz > now()
  );
$$;

create table if not exists public.bolao_palpites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  competicao_id text not null,
  jogo_id text not null,
  gm smallint not null check (gm between 0 and 20),
  gv smallint not null check (gv between 0 and 20),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, jogo_id)
);
create index if not exists bolao_palpites_comp on public.bolao_palpites (competicao_id);
alter table public.bolao_palpites enable row level security;
drop policy if exists "palpite visivel" on public.bolao_palpites;
create policy "palpite visivel" on public.bolao_palpites for select
  using (user_id = auth.uid() or not public.jogo_aberto(jogo_id));
drop policy if exists "palpitar jogo aberto" on public.bolao_palpites;
create policy "palpitar jogo aberto" on public.bolao_palpites for insert
  with check (user_id = auth.uid() and public.jogo_aberto(jogo_id));
drop policy if exists "mudar palpite de jogo aberto" on public.bolao_palpites;
create policy "mudar palpite de jogo aberto" on public.bolao_palpites for update
  using (user_id = auth.uid() and public.jogo_aberto(jogo_id))
  with check (user_id = auth.uid() and public.jogo_aberto(jogo_id));
drop policy if exists "apagar palpite de jogo aberto" on public.bolao_palpites;
create policy "apagar palpite de jogo aberto" on public.bolao_palpites for delete
  using (user_id = auth.uid() and public.jogo_aberto(jogo_id));
drop trigger if exists bolao_palpites_carimbo on public.bolao_palpites;
create trigger bolao_palpites_carimbo before insert or update on public.bolao_palpites
  for each row execute function public.carimbar();

-- Ranking do bolão (mesma pontuação do site: exato 10 · saldo 7 · resultado 5).
create or replace function public.ranking_bolao(p_comp text)
returns table (user_id uuid, nome text, pontos int, exatos int, acertos int, palpites int)
language sql stable security definer set search_path = public as $$
  with participantes as (
    select b.user_id, count(*)::int as palpites
    from public.bolao_palpites b where b.competicao_id = p_comp group by b.user_id
  ),
  avaliados as (
    select b.user_id,
      case
        when b.gm = (r.dados ->> 'golsMandante')::int and b.gv = (r.dados ->> 'golsVisitante')::int then 10
        when sign(b.gm - b.gv) <> sign((r.dados ->> 'golsMandante')::int - (r.dados ->> 'golsVisitante')::int) then 0
        when b.gm - b.gv = (r.dados ->> 'golsMandante')::int - (r.dados ->> 'golsVisitante')::int then 7
        else 5
      end as pts
    from public.bolao_palpites b
    join public.registros r on r.colecao = 'jogos' and r.id = b.jogo_id
    where b.competicao_id = p_comp and r.dados ->> 'status' = 'encerrado'
      and r.dados ->> 'golsMandante' is not null and r.dados ->> 'golsVisitante' is not null
  )
  select p.user_id, coalesce(pf.nome, 'Anônimo'),
    coalesce(sum(a.pts), 0)::int,
    count(*) filter (where a.pts = 10)::int,
    count(*) filter (where a.pts > 0)::int,
    p.palpites
  from participantes p
  left join avaliados a on a.user_id = p.user_id
  left join public.perfis pf on pf.user_id = p.user_id
  group by p.user_id, pf.nome, p.palpites
  order by 3 desc, 4 desc, 5 desc, 2
  limit 100;
$$;

-- ---------------------------------------------------------------------
-- Ranking do quiz: um resultado por pessoa, campeonato e dia (sem refazer).
-- ---------------------------------------------------------------------
create table if not exists public.quiz_resultados (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  competicao_id text not null,
  dia date not null,
  tentativas smallint not null check (tentativas between 1 and 6),
  acertou boolean not null,
  criado_em timestamptz not null default now(),
  primary key (user_id, competicao_id, dia)
);
alter table public.quiz_resultados enable row level security;
drop policy if exists "todos veem resultados do quiz" on public.quiz_resultados;
create policy "todos veem resultados do quiz" on public.quiz_resultados for select using (true);
-- O dia do navegador pode estar um dia antes/depois do servidor (fuso).
drop policy if exists "registrar o proprio resultado" on public.quiz_resultados;
create policy "registrar o proprio resultado" on public.quiz_resultados for insert
  with check (user_id = auth.uid() and dia between current_date - 1 and current_date + 1);

create or replace function public.ranking_quiz(p_comp text, p_dia date)
returns table (user_id uuid, nome text, acertos int, jogados int, sequencia int, melhor int, tentativas_hoje int, acertou_hoje boolean)
language sql stable security definer set search_path = public as $$
  with r as (
    select * from public.quiz_resultados where competicao_id = p_comp
  ),
  ilhas as (   -- dias seguidos com acerto viram um mesmo grupo
    select user_id, dia, dia - (row_number() over (partition by user_id order by dia))::int as grupo
    from r where acertou
  ),
  seq as (
    select user_id, count(*)::int as n, max(dia) as fim from ilhas group by user_id, grupo
  ),
  agg as (
    select user_id, count(*)::int as jogados, count(*) filter (where acertou)::int as acertos,
      max(tentativas) filter (where dia = p_dia)::int as tentativas_hoje,
      bool_or(acertou) filter (where dia = p_dia) as acertou_hoje
    from r group by user_id
  )
  select a.user_id, coalesce(pf.nome, 'Anônimo'), a.acertos, a.jogados,
    coalesce((select max(s.n) from seq s where s.user_id = a.user_id and s.fim >= p_dia - 1), 0)::int,
    coalesce((select max(s.n) from seq s where s.user_id = a.user_id), 0)::int,
    a.tentativas_hoje, a.acertou_hoje
  from agg a left join public.perfis pf on pf.user_id = a.user_id
  order by 5 desc, 3 desc, 2
  limit 100;
$$;

-- Funções que o site chama (a chave pública pode executar).
grant execute on function public.eh_admin() to anon, authenticated;
grant execute on function public.ranking_bolao(text) to anon, authenticated;
grant execute on function public.ranking_quiz(text, date) to anon, authenticated;

-- Tempo real: o site recebe na hora os placares que o painel grava.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'registros') then
    alter publication supabase_realtime add table public.registros;
  end if;
end $$;
