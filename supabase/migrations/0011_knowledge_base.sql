-- Orbit CRM — F4.2: Base de conhecimento + FAQ

create table if not exists public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists kb_categories_tenant_idx
  on public.kb_categories (tenant_id, position);

create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  category_id uuid references public.kb_categories (id) on delete set null,
  title text not null,
  slug text not null,
  excerpt text,
  content text,
  is_published boolean not null default false,
  views integer not null default 0,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, slug)
);

create index if not exists kb_articles_tenant_idx
  on public.kb_articles (tenant_id, updated_at desc) where deleted_at is null;
create index if not exists kb_articles_category_idx
  on public.kb_articles (category_id) where deleted_at is null;

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  question text not null,
  answer text,
  position integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_tenant_idx on public.faqs (tenant_id, position);

-- updated_at
drop trigger if exists kb_articles_set_updated_at on public.kb_articles;
create trigger kb_articles_set_updated_at
  before update on public.kb_articles
  for each row execute function public.set_updated_at();

drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.kb_categories to authenticated;
grant select, insert, update, delete on public.kb_articles to authenticated;
grant select, insert, update, delete on public.faqs to authenticated;
grant all on public.kb_categories, public.kb_articles, public.faqs to service_role;
grant all on public.kb_categories, public.kb_articles, public.faqs to postgres;

-- RLS
alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;
alter table public.faqs enable row level security;

create policy "kb_categories_staff" on public.kb_categories
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "kb_articles_staff" on public.kb_articles
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "faqs_staff" on public.faqs
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

-- leitura pública pelo cliente (portal): apenas publicados
create policy "kb_articles_client_select" on public.kb_articles
  for select to authenticated
  using (
    is_published and deleted_at is null
    and exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid() and c.tenant_id = kb_articles.tenant_id
    )
  );

create policy "faqs_client_select" on public.faqs
  for select to authenticated
  using (
    is_published
    and exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid() and c.tenant_id = faqs.tenant_id
    )
  );
