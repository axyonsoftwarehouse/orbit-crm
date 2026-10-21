import { createClient } from "@/lib/supabase/server"

export type SocialAccount = {
  id: string
  tenant_id: string
  company_id: string | null
  provider: string
  provider_account_id: string
  display_name: string
  avatar_url: string | null
  status: number
}

export type SocialPostRow = {
  id: string
  company_id: string | null
  content: string
  status: string
  scheduled_at: string | null
  published_at: string | null
  requires_approval: boolean
  created_at: string
  rejection_note: string | null
}

export type SocialPostTarget = {
  id: string
  account_id: string
  provider: string
  display_name: string
  status: string
  external_post_id: string | null
  error: string | null
}

export type SocialPostEvent = {
  id: string
  event: string
  actor_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type SocialPostListRow = SocialPostRow & {
  company: { id: string; name: string } | null
  targets: SocialPostTarget[]
}

export type SocialPostDetail = SocialPostListRow & {
  events: SocialPostEvent[]
}

const POST_COLUMNS =
  "id, company_id, content, status, scheduled_at, published_at, requires_approval, created_at, rejection_note"

export async function listSocialAccounts(
  tenantId: string,
  companyId?: string,
): Promise<SocialAccount[]> {
  const supabase = await createClient()
  let query = supabase
    .from("social_accounts")
    .select(
      "id, tenant_id, company_id, provider, provider_account_id, display_name, avatar_url, status",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("display_name", { ascending: true })

  if (companyId) query = query.eq("company_id", companyId)

  const { data } = await query
  return (data ?? []) as SocialAccount[]
}

export async function listSocialPostsPage(
  tenantId: string,
  options: {
    page: number
    pageSize: number
    status?: string
    companyId?: string
  },
): Promise<{ rows: SocialPostListRow[]; total: number }> {
  const supabase = await createClient()
  const from = (options.page - 1) * options.pageSize
  let query = supabase
    .from("social_posts")
    .select(POST_COLUMNS, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  if (options.status) query = query.eq("status", options.status)
  if (options.companyId) query = query.eq("company_id", options.companyId)

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + options.pageSize - 1)

  const rows = (data ?? []) as SocialPostRow[]
  if (rows.length === 0) return { rows: [], total: count ?? 0 }

  const postIds = rows.map((row) => row.id)
  const companyIds = [
    ...new Set(
      rows
        .map((row) => row.company_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  const [{ data: targets }, { data: companies }] = await Promise.all([
    supabase
      .from("social_post_targets")
      .select("id, post_id, account_id, status, external_post_id, error")
      .eq("tenant_id", tenantId)
      .in("post_id", postIds),
    companyIds.length > 0
      ? supabase
          .from("companies")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", companyIds)
      : Promise.resolve({ data: [] }),
  ])

  const accountIds = [
    ...new Set(
      ((targets ?? []) as { account_id: string }[]).map(
        (target) => target.account_id,
      ),
    ),
  ]
  const { data: accounts } =
    accountIds.length > 0
      ? await supabase
          .from("social_accounts")
          .select("id, provider, display_name")
          .eq("tenant_id", tenantId)
          .in("id", accountIds)
      : { data: [] }

  const accountMap = new Map(
    (
      (accounts ?? []) as {
        id: string
        provider: string
        display_name: string
      }[]
    ).map((account) => [account.id, account]),
  )
  const companyMap = new Map(
    ((companies ?? []) as { id: string; name: string }[]).map((company) => [
      company.id,
      company,
    ]),
  )

  const targetsByPost = new Map<string, SocialPostTarget[]>()
  for (const target of (targets ?? []) as {
    id: string
    post_id: string
    account_id: string
    status: string
    external_post_id: string | null
    error: string | null
  }[]) {
    const account = accountMap.get(target.account_id)
    const list = targetsByPost.get(target.post_id) ?? []
    list.push({
      id: target.id,
      account_id: target.account_id,
      provider: account?.provider ?? "",
      display_name: account?.display_name ?? "",
      status: target.status,
      external_post_id: target.external_post_id,
      error: target.error,
    })
    targetsByPost.set(target.post_id, list)
  }

  return {
    rows: rows.map((row) => ({
      ...row,
      company: row.company_id ? (companyMap.get(row.company_id) ?? null) : null,
      targets: targetsByPost.get(row.id) ?? [],
    })),
    total: count ?? 0,
  }
}

async function hydrateSocialPosts(
  tenantId: string,
  rows: SocialPostRow[],
): Promise<SocialPostListRow[]> {
  if (rows.length === 0) return []

  const supabase = await createClient()
  const postIds = rows.map((row) => row.id)
  const companyIds = [
    ...new Set(
      rows
        .map((row) => row.company_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  const [{ data: targets }, { data: companies }] = await Promise.all([
    supabase
      .from("social_post_targets")
      .select("id, post_id, account_id, status, external_post_id, error")
      .eq("tenant_id", tenantId)
      .in("post_id", postIds),
    companyIds.length > 0
      ? supabase
          .from("companies")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", companyIds)
      : Promise.resolve({ data: [] }),
  ])

  const accountIds = [
    ...new Set(
      ((targets ?? []) as { account_id: string }[]).map(
        (target) => target.account_id,
      ),
    ),
  ]
  const { data: accounts } =
    accountIds.length > 0
      ? await supabase
          .from("social_accounts")
          .select("id, provider, display_name")
          .eq("tenant_id", tenantId)
          .in("id", accountIds)
      : { data: [] }

  const accountMap = new Map(
    (
      (accounts ?? []) as {
        id: string
        provider: string
        display_name: string
      }[]
    ).map((account) => [account.id, account]),
  )
  const companyMap = new Map(
    ((companies ?? []) as { id: string; name: string }[]).map((company) => [
      company.id,
      company,
    ]),
  )

  const targetsByPost = new Map<string, SocialPostTarget[]>()
  for (const target of (targets ?? []) as {
    id: string
    post_id: string
    account_id: string
    status: string
    external_post_id: string | null
    error: string | null
  }[]) {
    const account = accountMap.get(target.account_id)
    const list = targetsByPost.get(target.post_id) ?? []
    list.push({
      id: target.id,
      account_id: target.account_id,
      provider: account?.provider ?? "",
      display_name: account?.display_name ?? "",
      status: target.status,
      external_post_id: target.external_post_id,
      error: target.error,
    })
    targetsByPost.set(target.post_id, list)
  }

  return rows.map((row) => ({
    ...row,
    company: row.company_id ? (companyMap.get(row.company_id) ?? null) : null,
    targets: targetsByPost.get(row.id) ?? [],
  }))
}

export async function listSocialCalendar(
  tenantId: string,
  start: string,
  end: string,
): Promise<SocialPostListRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("social_posts")
    .select(POST_COLUMNS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", start)
    .lt("scheduled_at", end)
    .order("scheduled_at", { ascending: true })

  return hydrateSocialPosts(tenantId, (data ?? []) as SocialPostRow[])
}

export async function listSocialPostsForExport(
  tenantId: string,
): Promise<SocialPostListRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("social_posts")
    .select(POST_COLUMNS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return hydrateSocialPosts(tenantId, (data ?? []) as SocialPostRow[])
}

export async function getSocialPost(
  tenantId: string,
  id: string,
): Promise<SocialPostDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("social_posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  const post = data as SocialPostRow | null
  if (!post) return null

  const [{ data: targets }, { data: events }, company] = await Promise.all([
    supabase
      .from("social_post_targets")
      .select("id, account_id, status, external_post_id, error")
      .eq("tenant_id", tenantId)
      .eq("post_id", post.id),
    supabase
      .from("social_post_events")
      .select("id, event, actor_id, metadata, created_at")
      .eq("tenant_id", tenantId)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true }),
    post.company_id
      ? supabase
          .from("companies")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .eq("id", post.company_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const accountIds = [
    ...new Set(
      ((targets ?? []) as { account_id: string }[]).map(
        (target) => target.account_id,
      ),
    ),
  ]
  const { data: accounts } =
    accountIds.length > 0
      ? await supabase
          .from("social_accounts")
          .select("id, provider, display_name")
          .eq("tenant_id", tenantId)
          .in("id", accountIds)
      : { data: [] }

  const accountMap = new Map(
    (
      (accounts ?? []) as {
        id: string
        provider: string
        display_name: string
      }[]
    ).map((account) => [account.id, account]),
  )

  return {
    ...post,
    company: (company.data as { id: string; name: string } | null) ?? null,
    targets: (
      (targets ?? []) as {
        id: string
        account_id: string
        status: string
        external_post_id: string | null
        error: string | null
      }[]
    ).map((target) => ({
      id: target.id,
      account_id: target.account_id,
      provider: accountMap.get(target.account_id)?.provider ?? "",
      display_name: accountMap.get(target.account_id)?.display_name ?? "",
      status: target.status,
      external_post_id: target.external_post_id,
      error: target.error,
    })),
    events: (events ?? []) as SocialPostEvent[],
  }
}

export type PortalSocialPost = {
  id: string
  content: string
  status: string
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  requires_approval: boolean
  rejection_note: string | null
  target_count: number
}

export async function listPortalSocialPosts(
  companyId: string,
): Promise<PortalSocialPost[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("portal_list_social_posts", {
    p_company: companyId,
  })
  return (data ?? []) as PortalSocialPost[]
}

export type PortalSocialTarget = {
  provider: string
  display_name: string
  status: string
}

export type PortalSocialPostDetail = Omit<PortalSocialPost, "target_count"> & {
  targets: PortalSocialTarget[]
}

export async function getPortalSocialPost(
  companyId: string,
  id: string,
): Promise<PortalSocialPostDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("portal_get_social_post", {
    p_company: companyId,
    p_post: id,
  })
  const row = (data ?? [])[0]
  if (!row) return null

  return {
    id: row.id,
    content: row.content,
    status: row.status,
    scheduled_at: row.scheduled_at,
    published_at: row.published_at,
    created_at: row.created_at,
    requires_approval: row.requires_approval,
    rejection_note: row.rejection_note,
    targets: (row.targets ?? []) as PortalSocialTarget[],
  }
}
