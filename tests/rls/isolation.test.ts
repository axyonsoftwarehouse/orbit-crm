// @vitest-environment node
import { existsSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Carrega .env.local (Node >= 20.12) para rodar contra o projeto real.
const loadEnvFile = (
  process as unknown as { loadEnvFile?: (p: string) => void }
).loadEnvFile
if (existsSync(".env.local")) loadEnvFile?.(".env.local")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const hasEnv = Boolean(url && anonKey && serviceKey)

describe.runIf(hasEnv)("RLS: isolamento entre tenants", () => {
  const admin = createClient(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const suffix = randomUUID().slice(0, 8)
  const password = "Senha!teste123"
  const emailA = `rls-a-${suffix}@orbit.test`
  const emailB = `rls-b-${suffix}@orbit.test`
  const emailAdmin = `rls-admin-${suffix}@orbit.test`
  const emailMember = `rls-member-${suffix}@orbit.test`

  let tenantA = ""
  let tenantB = ""
  let userAId = ""
  let userBId = ""
  let userAdminId = ""
  let userMemberId = ""
  let companyAId = ""
  let companyBId = ""
  let projectAId = ""
  let projectBId = ""
  let taskAId = ""
  let taskBId = ""
  let milestoneAId = ""
  let milestoneBId = ""
  let tagAId = ""
  let tagBId = ""
  let fieldDefAId = ""
  let fieldDefBId = ""
  let estimateAId = ""
  let estimateBId = ""
  let invoiceAId = ""
  let invoiceBId = ""
  const storagePaths: string[] = []
  const brandingPaths: string[] = []
  const socialMediaPaths: string[] = []
  let clientA: SupabaseClient
  let clientB: SupabaseClient
  let clientAdmin: SupabaseClient
  let clientMember: SupabaseClient
  let clientPortal: SupabaseClient
  let clientUserId = ""
  let portalCompanyId = ""
  const clientEmail = `rls-client-${suffix}@orbit.test`

  beforeAll(async () => {
    const tA = await admin
      .from("tenants")
      .insert({ name: `Empresa A ${suffix}`, slug: `rls-a-${suffix}` })
      .select("id")
      .single()
    const tB = await admin
      .from("tenants")
      .insert({ name: `Empresa B ${suffix}`, slug: `rls-b-${suffix}` })
      .select("id")
      .single()
    if (tA.error || tB.error) throw tA.error ?? tB.error
    tenantA = tA.data!.id
    tenantB = tB.data!.id

    const uA = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    })
    const uB = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    })
    if (uA.error || uB.error) throw uA.error ?? uB.error
    userAId = uA.data.user!.id
    userBId = uB.data.user!.id

    const members = await admin.from("memberships").insert([
      { tenant_id: tenantA, user_id: userAId, role: "owner", status: "active" },
      { tenant_id: tenantB, user_id: userBId, role: "owner", status: "active" },
    ])
    if (members.error) throw members.error

    const cA = await admin
      .from("companies")
      .insert({ tenant_id: tenantA, name: `Empresa A ${suffix}` })
      .select("id")
      .single()
    const cB = await admin
      .from("companies")
      .insert({ tenant_id: tenantB, name: `Empresa B ${suffix}` })
      .select("id")
      .single()
    if (cA.error || cB.error) throw cA.error ?? cB.error
    companyAId = cA.data!.id
    companyBId = cB.data!.id

    const pA = await admin
      .from("projects")
      .insert({
        tenant_id: tenantA,
        company_id: companyAId,
        name: `Projeto A ${suffix}`,
      })
      .select("id")
      .single()
    const pB = await admin
      .from("projects")
      .insert({
        tenant_id: tenantB,
        company_id: companyBId,
        name: `Projeto B ${suffix}`,
      })
      .select("id")
      .single()
    if (pA.error || pB.error) throw pA.error ?? pB.error
    projectAId = pA.data!.id
    projectBId = pB.data!.id

    const tskA = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantA,
        project_id: projectAId,
        name: `Tarefa A ${suffix}`,
      })
      .select("id")
      .single()
    const tskB = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantB,
        project_id: projectBId,
        name: `Tarefa B ${suffix}`,
      })
      .select("id")
      .single()
    if (tskA.error || tskB.error) throw tskA.error ?? tskB.error
    taskAId = tskA.data!.id
    taskBId = tskB.data!.id

    const mA = await admin
      .from("milestones")
      .insert({
        tenant_id: tenantA,
        project_id: projectAId,
        name: `Marco A ${suffix}`,
      })
      .select("id")
      .single()
    const mB = await admin
      .from("milestones")
      .insert({
        tenant_id: tenantB,
        project_id: projectBId,
        name: `Marco B ${suffix}`,
      })
      .select("id")
      .single()
    if (mA.error || mB.error) throw mA.error ?? mB.error
    milestoneAId = mA.data!.id
    milestoneBId = mB.data!.id

    const tgA = await admin
      .from("tags")
      .insert({ tenant_id: tenantA, name: `VIP ${suffix}` })
      .select("id")
      .single()
    const tgB = await admin
      .from("tags")
      .insert({ tenant_id: tenantB, name: `VIP ${suffix}` })
      .select("id")
      .single()
    if (tgA.error || tgB.error) throw tgA.error ?? tgB.error
    tagAId = tgA.data!.id
    tagBId = tgB.data!.id

    const fdA = await admin
      .from("custom_field_definitions")
      .insert({
        tenant_id: tenantA,
        entity_type: "company",
        label: "Segmento",
        key: "segmento",
        field_type: "text",
      })
      .select("id")
      .single()
    const fdB = await admin
      .from("custom_field_definitions")
      .insert({
        tenant_id: tenantB,
        entity_type: "company",
        label: "Segmento",
        field_type: "text",
        key: "segmento",
      })
      .select("id")
      .single()
    if (fdA.error || fdB.error) throw fdA.error ?? fdB.error
    fieldDefAId = fdA.data!.id
    fieldDefBId = fdB.data!.id

    const today = new Date().toISOString().slice(0, 10)
    const eA = await admin
      .from("estimates")
      .insert({
        tenant_id: tenantA,
        company_id: companyAId,
        number: 1,
        prefix: "EST-",
        formatted_number: "EST-000001",
        date: today,
      })
      .select("id")
      .single()
    const eB = await admin
      .from("estimates")
      .insert({
        tenant_id: tenantB,
        company_id: companyBId,
        number: 1,
        prefix: "EST-",
        formatted_number: "EST-000001",
        date: today,
      })
      .select("id")
      .single()
    if (eA.error || eB.error) throw eA.error ?? eB.error
    estimateAId = eA.data!.id
    estimateBId = eB.data!.id

    const iA = await admin
      .from("invoices")
      .insert({
        tenant_id: tenantA,
        company_id: companyAId,
        number: 1,
        prefix: "INV-",
        formatted_number: "INV-000001",
        date: today,
        total: 100,
      })
      .select("id")
      .single()
    const iB = await admin
      .from("invoices")
      .insert({
        tenant_id: tenantB,
        company_id: companyBId,
        number: 1,
        prefix: "INV-",
        formatted_number: "INV-000001",
        date: today,
        total: 100,
      })
      .select("id")
      .single()
    if (iA.error || iB.error) throw iA.error ?? iB.error
    invoiceAId = iA.data!.id
    invoiceBId = iB.data!.id

    clientA = createClient(url!, anonKey!)
    clientB = createClient(url!, anonKey!)
    const sA = await clientA.auth.signInWithPassword({
      email: emailA,
      password,
    })
    const sB = await clientB.auth.signInWithPassword({
      email: emailB,
      password,
    })
    if (sA.error || sB.error) throw sA.error ?? sB.error

    const uClient = await admin.auth.admin.createUser({
      email: clientEmail,
      password,
      email_confirm: true,
    })
    if (uClient.error) throw uClient.error
    clientUserId = uClient.data.user!.id

    const portalCompany = await admin
      .from("companies")
      .insert({ tenant_id: tenantA, name: `Portal A ${suffix}` })
      .select("id")
      .single()
    if (portalCompany.error) throw portalCompany.error
    portalCompanyId = portalCompany.data!.id

    const contact = await admin.from("contacts").insert({
      tenant_id: tenantA,
      company_id: portalCompanyId,
      first_name: "Cliente A",
      user_id: clientUserId,
    })
    if (contact.error) throw contact.error

    clientPortal = createClient(url!, anonKey!)
    const sClient = await clientPortal.auth.signInWithPassword({
      email: clientEmail,
      password,
    })
    if (sClient.error) throw sClient.error

    const uAdmin = await admin.auth.admin.createUser({
      email: emailAdmin,
      password,
      email_confirm: true,
    })
    const uMember = await admin.auth.admin.createUser({
      email: emailMember,
      password,
      email_confirm: true,
    })
    if (uAdmin.error || uMember.error) throw uAdmin.error ?? uMember.error
    userAdminId = uAdmin.data.user!.id
    userMemberId = uMember.data.user!.id

    const roleMembers = await admin.from("memberships").insert([
      {
        tenant_id: tenantA,
        user_id: userAdminId,
        role: "admin",
        status: "active",
      },
      {
        tenant_id: tenantA,
        user_id: userMemberId,
        role: "member",
        status: "active",
      },
    ])
    if (roleMembers.error) throw roleMembers.error

    clientAdmin = createClient(url!, anonKey!)
    clientMember = createClient(url!, anonKey!)
    const sAdmin = await clientAdmin.auth.signInWithPassword({
      email: emailAdmin,
      password,
    })
    const sMember = await clientMember.auth.signInWithPassword({
      email: emailMember,
      password,
    })
    if (sAdmin.error || sMember.error) throw sAdmin.error ?? sMember.error
  })

  afterAll(async () => {
    if (storagePaths.length > 0) {
      await admin.storage.from("attachments").remove(storagePaths)
    }
    if (brandingPaths.length > 0) {
      await admin.storage.from("branding").remove(brandingPaths)
    }
    if (socialMediaPaths.length > 0) {
      await admin.storage.from("social_media").remove(socialMediaPaths)
    }
    if (tenantA && tenantB) {
      await admin.from("tenants").delete().in("id", [tenantA, tenantB])
    }
    if (userAId) await admin.auth.admin.deleteUser(userAId)
    if (userBId) await admin.auth.admin.deleteUser(userBId)
    if (clientUserId) await admin.auth.admin.deleteUser(clientUserId)
    if (userAdminId) await admin.auth.admin.deleteUser(userAdminId)
    if (userMemberId) await admin.auth.admin.deleteUser(userMemberId)
  })

  it("A vê apenas o próprio tenant", async () => {
    const { data, error } = await clientA.from("tenants").select("id")
    expect(error).toBeNull()
    expect(data?.map((t) => t.id)).toEqual([tenantA])
  })

  it("A não vê o tenant de B", async () => {
    const { data } = await clientA
      .from("tenants")
      .select("id")
      .eq("id", tenantB)
    expect(data).toEqual([])
  })

  it("A vê apenas memberships do próprio tenant", async () => {
    const { data } = await clientA.from("memberships").select("tenant_id")
    expect(data?.every((m) => m.tenant_id === tenantA)).toBe(true)
    expect(data?.some((m) => m.tenant_id === tenantB)).toBe(false)
  })

  it("A não enxerga o profile de B (sem tenant em comum)", async () => {
    const { data } = await clientA
      .from("profiles")
      .select("id")
      .eq("id", userBId)
    expect(data).toEqual([])
  })

  it("A enxerga o próprio profile", async () => {
    const { data } = await clientA
      .from("profiles")
      .select("id")
      .eq("id", userAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê invitations de B", async () => {
    await admin
      .from("invitations")
      .insert({ tenant_id: tenantB, email: `convidado-${suffix}@orbit.test` })
    const { data } = await clientA
      .from("invitations")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A enxerga invitations do próprio tenant (owner)", async () => {
    await admin
      .from("invitations")
      .insert({ tenant_id: tenantA, email: `convidado-a-${suffix}@orbit.test` })
    const { data } = await clientA
      .from("invitations")
      .select("id")
      .eq("tenant_id", tenantA)
    expect(data?.length).toBeGreaterThanOrEqual(1)
  })

  it("B não vê dados de A", async () => {
    const { data } = await clientB
      .from("tenants")
      .select("id")
      .eq("id", tenantA)
    expect(data).toEqual([])
  })

  it("A vê a empresa do próprio tenant", async () => {
    const { data } = await clientA
      .from("companies")
      .select("id")
      .eq("id", companyAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê a empresa de B", async () => {
    const { data } = await clientA
      .from("companies")
      .select("id")
      .eq("id", companyBId)
    expect(data).toEqual([])
  })

  it("A não pode criar empresa em outro tenant", async () => {
    const { error } = await clientA
      .from("companies")
      .insert({ tenant_id: tenantB, name: `Inválida ${suffix}` })
    expect(error).not.toBeNull()
  })

  it("A cria contato na própria empresa e o enxerga", async () => {
    const inserted = await clientA.from("contacts").insert({
      tenant_id: tenantA,
      company_id: companyAId,
      first_name: "Contato A",
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("contacts")
      .select("id")
      .eq("company_id", companyAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê contatos de B", async () => {
    await admin.from("contacts").insert({
      tenant_id: tenantB,
      company_id: companyBId,
      first_name: "Contato B",
    })
    const { data } = await clientA
      .from("contacts")
      .select("id")
      .eq("company_id", companyBId)
    expect(data).toEqual([])
  })

  it("A não pode criar contato apontando para empresa de outro tenant", async () => {
    const { error } = await clientA.from("contacts").insert({
      tenant_id: tenantA,
      company_id: companyBId,
      first_name: "Cross tenant",
    })
    expect(error).not.toBeNull()
  })

  it("A vê o projeto do próprio tenant", async () => {
    const { data } = await clientA
      .from("projects")
      .select("id")
      .eq("id", projectAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê o projeto de B", async () => {
    const { data } = await clientA
      .from("projects")
      .select("id")
      .eq("id", projectBId)
    expect(data).toEqual([])
  })

  it("A não pode criar projeto em outro tenant", async () => {
    const { error } = await clientA
      .from("projects")
      .insert({ tenant_id: tenantB, name: `Inválido ${suffix}` })
    expect(error).not.toBeNull()
  })

  it("A entra como membro do próprio projeto", async () => {
    const inserted = await clientA.from("project_members").insert({
      tenant_id: tenantA,
      project_id: projectAId,
      user_id: userAId,
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê membros de projeto de B", async () => {
    await admin.from("project_members").insert({
      tenant_id: tenantB,
      project_id: projectBId,
      user_id: userBId,
    })
    const { data } = await clientA
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectBId)
    expect(data).toEqual([])
  })

  it("A não pode adicionar membro a projeto de outro tenant", async () => {
    const { error } = await clientA.from("project_members").insert({
      tenant_id: tenantA,
      project_id: projectBId,
      user_id: userAId,
    })
    expect(error).not.toBeNull()
  })

  it("A vê a tarefa do próprio projeto", async () => {
    const { data } = await clientA.from("tasks").select("id").eq("id", taskAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê a tarefa de B", async () => {
    const { data } = await clientA.from("tasks").select("id").eq("id", taskBId)
    expect(data).toEqual([])
  })

  it("A não pode criar tarefa em projeto de outro tenant", async () => {
    const { error } = await clientA.from("tasks").insert({
      tenant_id: tenantA,
      project_id: projectBId,
      name: `Inválida ${suffix}`,
    })
    expect(error).not.toBeNull()
  })

  it("A gerencia o checklist da própria tarefa", async () => {
    const inserted = await clientA.from("task_checklist_items").insert({
      tenant_id: tenantA,
      task_id: taskAId,
      title: "Item A",
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("task_checklist_items")
      .select("id")
      .eq("task_id", taskAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê checklist de B", async () => {
    await admin.from("task_checklist_items").insert({
      tenant_id: tenantB,
      task_id: taskBId,
      title: "Item B",
    })
    const { data } = await clientA
      .from("task_checklist_items")
      .select("id")
      .eq("task_id", taskBId)
    expect(data).toEqual([])
  })

  it("A não pode criar item de checklist em tarefa de outro tenant", async () => {
    const { error } = await clientA.from("task_checklist_items").insert({
      tenant_id: tenantA,
      task_id: taskBId,
      title: "Cross tenant",
    })
    expect(error).not.toBeNull()
  })

  it("A comenta na própria tarefa e o enxerga", async () => {
    const inserted = await clientA.from("comments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: taskAId,
      content: "Comentário A",
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("comments")
      .select("id")
      .eq("entity_id", taskAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê comentários de B", async () => {
    await admin.from("comments").insert({
      tenant_id: tenantB,
      entity_type: "task",
      entity_id: taskBId,
      content: "Comentário B",
    })
    const { data } = await clientA
      .from("comments")
      .select("id")
      .eq("entity_id", taskBId)
    expect(data).toEqual([])
  })

  it("A não pode comentar em tarefa de outro tenant", async () => {
    const { error } = await clientA.from("comments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: taskBId,
      content: "Cross tenant",
    })
    expect(error).not.toBeNull()
  })

  it("A registra anexo na própria tarefa", async () => {
    const inserted = await clientA.from("attachments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: taskAId,
      storage_path: `${tenantA}/task/${taskAId}/meta.txt`,
      file_name: "meta.txt",
    })
    expect(inserted.error).toBeNull()
  })

  it("A não pode registrar anexo em tarefa de outro tenant", async () => {
    const { error } = await clientA.from("attachments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: taskBId,
      storage_path: `${tenantA}/task/${taskBId}/meta.txt`,
      file_name: "meta.txt",
    })
    expect(error).not.toBeNull()
  })

  it("Storage: A envia no próprio tenant e é barrado em outro", async () => {
    const blob = new Blob(["orbit"], { type: "text/plain" })

    const ownPath = `${tenantA}/task/${taskAId}/${randomUUID()}-a.txt`
    const own = await clientA.storage
      .from("attachments")
      .upload(ownPath, blob, { contentType: "text/plain" })
    if (!own.error) storagePaths.push(ownPath)
    expect(own.error).toBeNull()

    const otherPath = `${tenantB}/task/${taskBId}/${randomUUID()}-b.txt`
    const other = await clientA.storage
      .from("attachments")
      .upload(otherPath, blob, { contentType: "text/plain" })
    expect(other.error).not.toBeNull()
  })

  it("Storage: A não gera URL de arquivo de outro tenant", async () => {
    const path = `${tenantB}/task/${taskBId}/${randomUUID()}-secret.txt`
    const uploaded = await admin.storage
      .from("attachments")
      .upload(path, new Blob(["secret"], { type: "text/plain" }), {
        contentType: "text/plain",
      })
    if (!uploaded.error) storagePaths.push(path)

    const signed = await clientA.storage
      .from("attachments")
      .createSignedUrl(path, 60)
    expect(signed.error).not.toBeNull()
  })

  it("A inicia um timer no próprio projeto e o enxerga", async () => {
    const inserted = await clientA.from("time_entries").insert({
      tenant_id: tenantA,
      project_id: projectAId,
      user_id: userAId,
      started_at: new Date().toISOString(),
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("time_entries")
      .select("id")
      .eq("project_id", projectAId)
      .is("ended_at", null)
    expect(data?.length).toBe(1)
  })

  it("Um usuário não pode ter dois timers em execução", async () => {
    const { error } = await clientA.from("time_entries").insert({
      tenant_id: tenantA,
      project_id: projectAId,
      user_id: userAId,
      started_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })

  it("A não pode registrar horas em projeto de outro tenant", async () => {
    const { error } = await clientA.from("time_entries").insert({
      tenant_id: tenantA,
      project_id: projectBId,
      user_id: userAId,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 60,
    })
    expect(error).not.toBeNull()
  })

  it("A não vê apontamentos de B", async () => {
    await admin.from("time_entries").insert({
      tenant_id: tenantB,
      project_id: projectBId,
      user_id: userBId,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 60,
    })
    const { data } = await clientA
      .from("time_entries")
      .select("id")
      .eq("project_id", projectBId)
    expect(data).toEqual([])
  })

  it("RPC de numeração só funciona para membros", async () => {
    const own = await clientA.rpc("next_document_number", {
      p_tenant: tenantA,
      p_kind: "invoice",
    })
    expect(own.error).toBeNull()

    const other = await clientA.rpc("next_document_number", {
      p_tenant: tenantB,
      p_kind: "invoice",
    })
    expect(other.error).not.toBeNull()
  })

  it("A vê o orçamento do próprio tenant", async () => {
    const { data } = await clientA
      .from("estimates")
      .select("id")
      .eq("id", estimateAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê orçamento de B", async () => {
    const { data } = await clientA
      .from("estimates")
      .select("id")
      .eq("id", estimateBId)
    expect(data).toEqual([])
  })

  it("A não pode criar orçamento para cliente de outro tenant", async () => {
    const { error } = await clientA.from("estimates").insert({
      tenant_id: tenantA,
      company_id: companyBId,
      number: 99,
      prefix: "EST-",
      formatted_number: "EST-000099",
      date: new Date().toISOString().slice(0, 10),
    })
    expect(error).not.toBeNull()
  })

  it("A adiciona item no próprio orçamento", async () => {
    const inserted = await clientA.from("document_items").insert({
      tenant_id: tenantA,
      rel_type: "estimate",
      rel_id: estimateAId,
      description: "Item A",
      qty: 1,
      rate: 100,
    })
    expect(inserted.error).toBeNull()
  })

  it("A não pode adicionar item em orçamento de outro tenant", async () => {
    const { error } = await clientA.from("document_items").insert({
      tenant_id: tenantA,
      rel_type: "estimate",
      rel_id: estimateBId,
      description: "Cross tenant",
      qty: 1,
      rate: 100,
    })
    expect(error).not.toBeNull()
  })

  it("A registra pagamento na própria fatura", async () => {
    const inserted = await clientA.from("payments").insert({
      tenant_id: tenantA,
      invoice_id: invoiceAId,
      amount: 100,
      payment_date: new Date().toISOString().slice(0, 10),
    })
    expect(inserted.error).toBeNull()
  })

  it("A não pode pagar fatura de outro tenant", async () => {
    const { error } = await clientA.from("payments").insert({
      tenant_id: tenantA,
      invoice_id: invoiceBId,
      amount: 10,
      payment_date: new Date().toISOString().slice(0, 10),
    })
    expect(error).not.toBeNull()
  })

  it("A não vê fatura de B", async () => {
    const { data } = await clientA
      .from("invoices")
      .select("id")
      .eq("id", invoiceBId)
    expect(data).toEqual([])
  })

  it("A não altera nem apaga horas de outro tenant", async () => {
    const entry = await admin
      .from("time_entries")
      .insert({
        tenant_id: tenantB,
        project_id: projectBId,
        user_id: userBId,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 60,
        is_billable: true,
      })
      .select("id")
      .single()

    const id = entry.data!.id
    const updated = await clientA
      .from("time_entries")
      .update({ billed: true })
      .eq("id", id)
      .select("id")
    expect(updated.data ?? []).toEqual([])

    const deleted = await clientA
      .from("time_entries")
      .delete()
      .eq("id", id)
      .select("id")
    expect(deleted.data ?? []).toEqual([])
  })

  it("A vê o marco do próprio projeto", async () => {
    const { data } = await clientA
      .from("milestones")
      .select("id")
      .eq("id", milestoneAId)
    expect(data?.length).toBe(1)
  })

  it("A não vê o marco de B", async () => {
    const { data } = await clientA
      .from("milestones")
      .select("id")
      .eq("id", milestoneBId)
    expect(data).toEqual([])
  })

  it("A não pode criar marco em projeto de outro tenant", async () => {
    const { error } = await clientA.from("milestones").insert({
      tenant_id: tenantA,
      project_id: projectBId,
      name: "Cross tenant",
    })
    expect(error).not.toBeNull()
  })

  it("A vincula uma tarefa a um marco do próprio projeto", async () => {
    const { error } = await clientA
      .from("tasks")
      .update({ milestone_id: milestoneAId })
      .eq("id", taskAId)
    expect(error).toBeNull()
  })

  it("A não pode vincular tarefa a marco de outro projeto", async () => {
    const { error } = await clientA
      .from("tasks")
      .update({ milestone_id: milestoneBId })
      .eq("id", taskAId)
    expect(error).not.toBeNull()
  })

  it("A vê a própria tag e não a de B", async () => {
    const own = await clientA.from("tags").select("id").eq("id", tagAId)
    expect(own.data?.length).toBe(1)
    const other = await clientA.from("tags").select("id").eq("id", tagBId)
    expect(other.data).toEqual([])
  })

  it("A não pode criar tag em outro tenant", async () => {
    const { error } = await clientA
      .from("tags")
      .insert({ tenant_id: tenantB, name: "Cross tenant" })
    expect(error).not.toBeNull()
  })

  it("A associa uma tag à própria empresa e a enxerga", async () => {
    const inserted = await clientA.from("taggables").insert({
      tenant_id: tenantA,
      tag_id: tagAId,
      entity_type: "company",
      entity_id: companyAId,
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("taggables")
      .select("id")
      .eq("entity_id", companyAId)
    expect(data?.length).toBe(1)
  })

  it("A não pode associar tag a entidade de outro tenant", async () => {
    const { error } = await clientA.from("taggables").insert({
      tenant_id: tenantA,
      tag_id: tagAId,
      entity_type: "company",
      entity_id: companyBId,
    })
    expect(error).not.toBeNull()
  })

  it("A não vê associações de tags de B", async () => {
    await admin.from("taggables").insert({
      tenant_id: tenantB,
      tag_id: tagBId,
      entity_type: "company",
      entity_id: companyBId,
    })
    const { data } = await clientA
      .from("taggables")
      .select("id")
      .eq("entity_id", companyBId)
    expect(data).toEqual([])
  })

  it("A vê a definição de campo do próprio tenant e não a de B", async () => {
    const own = await clientA
      .from("custom_field_definitions")
      .select("id")
      .eq("id", fieldDefAId)
    expect(own.data?.length).toBe(1)

    const other = await clientA
      .from("custom_field_definitions")
      .select("id")
      .eq("id", fieldDefBId)
    expect(other.data).toEqual([])
  })

  it("A não pode criar definição de campo em outro tenant", async () => {
    const { error } = await clientA.from("custom_field_definitions").insert({
      tenant_id: tenantB,
      entity_type: "company",
      label: "Cross",
      key: "cross",
      field_type: "text",
    })
    expect(error).not.toBeNull()
  })

  it("A salva valor de campo na própria empresa e o enxerga", async () => {
    const inserted = await clientA.from("custom_field_values").insert({
      tenant_id: tenantA,
      field_id: fieldDefAId,
      entity_type: "company",
      entity_id: companyAId,
      value: "Enterprise",
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("custom_field_values")
      .select("value")
      .eq("entity_id", companyAId)
    expect(data?.length).toBe(1)
  })

  it("A não pode salvar valor para entidade de outro tenant", async () => {
    const { error } = await clientA.from("custom_field_values").insert({
      tenant_id: tenantA,
      field_id: fieldDefAId,
      entity_type: "company",
      entity_id: companyBId,
      value: "Cross tenant",
    })
    expect(error).not.toBeNull()
  })

  it("A não vê valores de campos de B", async () => {
    await admin.from("custom_field_values").insert({
      tenant_id: tenantB,
      field_id: fieldDefBId,
      entity_type: "company",
      entity_id: companyBId,
      value: "Empresa B",
    })
    const { data } = await clientA
      .from("custom_field_values")
      .select("id")
      .eq("entity_id", companyBId)
    expect(data).toEqual([])
  })

  it("A cria convite no próprio tenant e não vê de B", async () => {
    const created = await clientA
      .from("invitations")
      .insert({ tenant_id: tenantA, email: `novo-${suffix}@orbit.test` })
    expect(created.error).toBeNull()

    const { data } = await clientA
      .from("invitations")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A não pode criar convite em outro tenant", async () => {
    const { error } = await clientA
      .from("invitations")
      .insert({ tenant_id: tenantB, email: `cross-${suffix}@orbit.test` })
    expect(error).not.toBeNull()
  })

  it("A não vê os membros de B", async () => {
    const { data } = await clientA
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("Storage branding: A envia no próprio tenant e é barrado em outro", async () => {
    const blob = new Blob(["logo"], { type: "image/png" })

    const ownPath = `${tenantA}/logo-${randomUUID()}.png`
    const own = await clientA.storage
      .from("branding")
      .upload(ownPath, blob, { contentType: "image/png" })
    if (!own.error) brandingPaths.push(ownPath)
    expect(own.error).toBeNull()

    const otherPath = `${tenantB}/logo-${randomUUID()}.png`
    const other = await clientA.storage
      .from("branding")
      .upload(otherPath, blob, { contentType: "image/png" })
    expect(other.error).not.toBeNull()
  })

  it("RPC de resumo de horas respeita o tenant", async () => {
    const own = await clientA.rpc("time_entries_summary", { p_tenant: tenantA })
    expect(own.error).toBeNull()

    const other = await clientA.rpc("time_entries_summary", {
      p_tenant: tenantB,
    })
    expect(other.error).toBeNull()
    const otherSeconds = Number(
      (other.data as { seconds: number }[] | null)?.[0]?.seconds ?? 0,
    )
    expect(otherSeconds).toBe(0)
  })

  it("A cria despesa no próprio tenant e a vê", async () => {
    const inserted = await clientA
      .from("expenses")
      .insert({ tenant_id: tenantA, title: "Hosting", amount: 100 })
      .select("id")
      .single()
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("expenses")
      .select("id")
      .eq("id", inserted.data!.id)
    expect(data?.length).toBe(1)
  })

  it("A não vê despesas de B", async () => {
    await admin
      .from("expenses")
      .insert({ tenant_id: tenantB, title: "Despesa B", amount: 10 })
    const { data } = await clientA
      .from("expenses")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A não pode criar despesa em outro tenant", async () => {
    const { error } = await clientA
      .from("expenses")
      .insert({ tenant_id: tenantB, title: "Cross", amount: 1 })
    expect(error).not.toBeNull()
  })

  it("A não pode criar despesa em projeto de outro tenant", async () => {
    const { error } = await clientA.from("expenses").insert({
      tenant_id: tenantA,
      title: "Cross project",
      amount: 1,
      project_id: projectBId,
    })
    expect(error).not.toBeNull()
  })

  it("A cria contrato no próprio tenant e o vê", async () => {
    const inserted = await clientA
      .from("contracts")
      .insert({
        tenant_id: tenantA,
        title: "Contrato A",
        company_id: companyAId,
      })
      .select("id")
      .single()
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("contracts")
      .select("id")
      .eq("id", inserted.data!.id)
    expect(data?.length).toBe(1)
  })

  it("A não vê contratos de B", async () => {
    await admin
      .from("contracts")
      .insert({ tenant_id: tenantB, title: "Contrato B" })
    const { data } = await clientA
      .from("contracts")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A não pode criar contrato em outro tenant", async () => {
    const { error } = await clientA
      .from("contracts")
      .insert({ tenant_id: tenantB, title: "Cross" })
    expect(error).not.toBeNull()
  })

  it("A não pode usar cliente de outro tenant no contrato", async () => {
    const { error } = await clientA.from("contracts").insert({
      tenant_id: tenantA,
      title: "Cross company",
      company_id: companyBId,
    })
    expect(error).not.toBeNull()
  })

  it("A cria evento no próprio tenant e o vê", async () => {
    const inserted = await clientA
      .from("calendar_events")
      .insert({
        tenant_id: tenantA,
        title: "Evento A",
        start_at: new Date().toISOString(),
      })
      .select("id")
      .single()
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("calendar_events")
      .select("id")
      .eq("id", inserted.data!.id)
    expect(data?.length).toBe(1)
  })

  it("A não vê eventos de B", async () => {
    await admin.from("calendar_events").insert({
      tenant_id: tenantB,
      title: "Evento B",
      start_at: new Date().toISOString(),
    })
    const { data } = await clientA
      .from("calendar_events")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A não pode criar evento em outro tenant", async () => {
    const { error } = await clientA.from("calendar_events").insert({
      tenant_id: tenantB,
      title: "Cross",
      start_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })

  it("A não pode usar projeto de outro tenant no evento", async () => {
    const { error } = await clientA.from("calendar_events").insert({
      tenant_id: tenantA,
      title: "Cross project",
      start_at: new Date().toISOString(),
      project_id: projectBId,
    })
    expect(error).not.toBeNull()
  })

  it("A vê atividades do próprio tenant e não de B", async () => {
    const own = await clientA
      .from("activity_log")
      .select("id")
      .eq("tenant_id", tenantA)
      .limit(1)
    expect((own.data ?? []).length).toBeGreaterThan(0)

    const other = await clientA
      .from("activity_log")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(other.data).toEqual([])
  })

  it("A não pode inserir atividade diretamente", async () => {
    const { error } = await clientA.from("activity_log").insert({
      tenant_id: tenantA,
      entity: "companies",
      action: "insert",
    })
    expect(error).not.toBeNull()
  })

  it("Criar registro gera atividade com o autor", async () => {
    const inserted = await clientA
      .from("companies")
      .insert({ tenant_id: tenantA, name: `Audit ${randomUUID()}` })
      .select("id")
      .single()
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("activity_log")
      .select("actor_id, action, entity")
      .eq("entity_id", inserted.data!.id)
    expect((data ?? []).length).toBeGreaterThan(0)
    const row = (data ?? [])[0] as {
      actor_id: string
      action: string
      entity: string
    }
    expect(row.actor_id).toBe(userAId)
    expect(row.action).toBe("insert")
    expect(row.entity).toBe("companies")
  })

  it("A cria meta no próprio tenant e a vê", async () => {
    const inserted = await clientA
      .from("goals")
      .insert({
        tenant_id: tenantA,
        metric: "revenue",
        period_start: "2026-01-01",
        period_end: "2026-01-31",
        target: 1000,
      })
      .select("id")
      .single()
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("goals")
      .select("id")
      .eq("id", inserted.data!.id)
    expect(data?.length).toBe(1)
  })

  it("A não vê metas de B", async () => {
    await admin.from("goals").insert({
      tenant_id: tenantB,
      metric: "revenue",
      period_start: "2026-01-01",
      period_end: "2026-01-31",
      target: 500,
    })
    const { data } = await clientA
      .from("goals")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A não pode criar meta em outro tenant", async () => {
    const { error } = await clientA.from("goals").insert({
      tenant_id: tenantB,
      metric: "revenue",
      period_start: "2026-01-01",
      period_end: "2026-01-31",
      target: 1,
    })
    expect(error).not.toBeNull()
  })

  it("A cria modelo de e-mail no próprio tenant e o vê", async () => {
    const inserted = await clientA.from("email_templates").insert({
      tenant_id: tenantA,
      key: "task_due",
      subject: "Assunto A",
      body: "<p>corpo</p>",
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("email_templates")
      .select("id")
      .eq("tenant_id", tenantA)
    expect((data ?? []).length).toBeGreaterThan(0)
  })

  it("A não vê modelos de e-mail de B", async () => {
    await admin.from("email_templates").insert({
      tenant_id: tenantB,
      key: "task_due",
      subject: "Assunto B",
      body: "<p>corpo</p>",
    })
    const { data } = await clientA
      .from("email_templates")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A não pode criar modelo de e-mail em outro tenant", async () => {
    const { error } = await clientA.from("email_templates").insert({
      tenant_id: tenantB,
      key: "task_due",
      subject: "Cross",
      body: "<p>x</p>",
    })
    expect(error).not.toBeNull()
  })

  it("Cliente do portal vê contratos da própria empresa", async () => {
    const created = await admin
      .from("contracts")
      .insert({
        tenant_id: tenantA,
        company_id: portalCompanyId,
        title: `Contrato portal ${suffix}`,
      })
      .select("id")
      .single()
    expect(created.error).toBeNull()

    const { data } = await clientPortal.rpc("portal_list_contracts", {
      p_company: portalCompanyId,
    })
    expect((data ?? []).map((row: { id: string }) => row.id)).toContain(
      created.data!.id,
    )
  })

  it("Cliente do portal não vê contratos de outra empresa", async () => {
    const created = await admin
      .from("contracts")
      .insert({
        tenant_id: tenantB,
        company_id: companyBId,
        title: `Contrato B ${suffix}`,
      })
      .select("id")
      .single()
    expect(created.error).toBeNull()

    const { data } = await clientPortal
      .from("contracts")
      .select("id")
      .eq("id", created.data!.id)
    expect(data).toEqual([])
  })

  it("Cliente do portal vê apenas despesas faturáveis da própria empresa", async () => {
    const billable = await admin
      .from("expenses")
      .insert({
        tenant_id: tenantA,
        company_id: portalCompanyId,
        title: `Reembolso ${suffix}`,
        amount: 50,
        billable: true,
      })
      .select("id")
      .single()
    const internal = await admin
      .from("expenses")
      .insert({
        tenant_id: tenantA,
        company_id: portalCompanyId,
        title: `Interna ${suffix}`,
        amount: 20,
        billable: false,
      })
      .select("id")
      .single()
    expect(billable.error).toBeNull()
    expect(internal.error).toBeNull()

    const direct = await clientPortal.from("expenses").select("id")
    expect(direct.data ?? []).toEqual([])

    const { data } = await clientPortal.rpc("portal_list_expenses", {
      p_company: portalCompanyId,
    })
    const ids = (data ?? []).map((row: { id: string }) => row.id)
    expect(ids).toContain(billable.data!.id)
    expect(ids).not.toContain(internal.data!.id)
  })

  it("Cliente do portal não vê despesas de outra empresa", async () => {
    const created = await admin
      .from("expenses")
      .insert({
        tenant_id: tenantB,
        company_id: companyBId,
        title: `Despesa B ${suffix}`,
        amount: 10,
        billable: true,
      })
      .select("id")
      .single()
    expect(created.error).toBeNull()

    const direct = await clientPortal
      .from("expenses")
      .select("id")
      .eq("id", created.data!.id)
    expect(direct.data ?? []).toEqual([])

    const { data } = await clientPortal.rpc("portal_list_expenses", {
      p_company: portalCompanyId,
    })
    expect((data ?? []).map((row: { id: string }) => row.id)).not.toContain(
      created.data!.id,
    )
  })

  it("Cliente do portal não cria contrato nem despesa", async () => {
    const contract = await clientPortal.from("contracts").insert({
      tenant_id: tenantA,
      company_id: portalCompanyId,
      title: "Não permitido",
    })
    expect(contract.error).not.toBeNull()

    const expense = await clientPortal.from("expenses").insert({
      tenant_id: tenantA,
      company_id: portalCompanyId,
      title: "Não permitido",
      amount: 1,
      billable: true,
    })
    expect(expense.error).not.toBeNull()
  })

  it("A cria dependência entre tarefas do próprio projeto", async () => {
    const second = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantA,
        project_id: projectAId,
        name: `Tarefa A2 ${suffix}`,
      })
      .select("id")
      .single()
    expect(second.error).toBeNull()

    const inserted = await clientA.from("task_dependencies").insert({
      tenant_id: tenantA,
      task_id: taskAId,
      depends_on_task_id: second.data!.id,
    })
    expect(inserted.error).toBeNull()

    const { data } = await clientA
      .from("task_dependencies")
      .select("id")
      .eq("task_id", taskAId)
    expect((data ?? []).length).toBeGreaterThan(0)
  })

  it("A não pode criar dependência de uma tarefa consigo mesma", async () => {
    const { error } = await clientA.from("task_dependencies").insert({
      tenant_id: tenantA,
      task_id: taskAId,
      depends_on_task_id: taskAId,
    })
    expect(error).not.toBeNull()
  })

  it("A não vê dependências de B", async () => {
    const t2 = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantB,
        project_id: projectBId,
        name: `Tarefa B2 ${suffix}`,
      })
      .select("id")
      .single()
    await admin.from("task_dependencies").insert({
      tenant_id: tenantB,
      task_id: taskBId,
      depends_on_task_id: t2.data!.id,
    })

    const { data } = await clientA
      .from("task_dependencies")
      .select("id")
      .eq("tenant_id", tenantB)
    expect(data).toEqual([])
  })

  it("A não pode criar dependência em outro tenant", async () => {
    const b1 = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantB,
        project_id: projectBId,
        name: `Tarefa B3 ${suffix}`,
      })
      .select("id")
      .single()
    const b2 = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantB,
        project_id: projectBId,
        name: `Tarefa B4 ${suffix}`,
      })
      .select("id")
      .single()

    const { error } = await clientA.from("task_dependencies").insert({
      tenant_id: tenantB,
      task_id: b1.data!.id,
      depends_on_task_id: b2.data!.id,
    })
    expect(error).not.toBeNull()
  })

  // ============================================================
  // Regressões de segurança (hardening)
  // ============================================================

  it("Usuário não consegue se promover a super-admin", async () => {
    const { error } = await clientA
      .from("profiles")
      .update({ is_super_admin: true })
      .eq("id", userAId)
    expect(error).not.toBeNull()

    const { data } = await admin
      .from("profiles")
      .select("is_super_admin")
      .eq("id", userAId)
      .single()
    expect(data?.is_super_admin).toBe(false)
  })

  it("Usuário ainda atualiza o próprio notify_email", async () => {
    const { error } = await clientA
      .from("profiles")
      .update({ notify_email: false })
      .eq("id", userAId)
    expect(error).toBeNull()
  })

  it("Admin não consegue se promover a owner", async () => {
    await clientAdmin
      .from("memberships")
      .update({ role: "owner" })
      .eq("tenant_id", tenantA)
      .eq("user_id", userAdminId)

    const { data } = await admin
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenantA)
      .eq("user_id", userAdminId)
      .maybeSingle()
    expect(data?.role).toBe("admin")
  })

  it("Admin não consegue remover o owner", async () => {
    await clientAdmin
      .from("memberships")
      .delete()
      .eq("tenant_id", tenantA)
      .eq("user_id", userAId)

    const { data } = await admin
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenantA)
      .eq("user_id", userAId)
      .maybeSingle()
    expect(data?.role).toBe("owner")
  })

  it("Owner do tenant não altera status/plano da plataforma", async () => {
    const { error } = await clientA
      .from("tenants")
      .update({ status: "suspended", plan_status: "suspended" })
      .eq("id", tenantA)
    expect(error).not.toBeNull()

    const { data } = await admin
      .from("tenants")
      .select("status, plan_status")
      .eq("id", tenantA)
      .single()
    expect(data?.status).toBe("active")
    expect(data?.plan_status).toBe("active")
  })

  it("Owner do tenant altera o próprio branding", async () => {
    const { error } = await clientA
      .from("tenants")
      .update({ name: `Empresa A ${suffix}` })
      .eq("id", tenantA)
    expect(error).toBeNull()
  })

  it("Membro não apaga lançamento de horas de outro", async () => {
    const entry = await admin
      .from("time_entries")
      .insert({
        tenant_id: tenantA,
        project_id: projectAId,
        user_id: userAId,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 60,
      })
      .select("id")
      .single()
    if (entry.error) throw entry.error
    const id = entry.data!.id

    const deleted = await clientMember
      .from("time_entries")
      .delete()
      .eq("id", id)
      .select("id")
    expect(deleted.data ?? []).toEqual([])

    const stillThere = await admin
      .from("time_entries")
      .select("id")
      .eq("id", id)
      .maybeSingle()
    expect(stillThere.data?.id).toBe(id)
  })

  it("Membro cria notificação apenas para si", async () => {
    const own = await clientMember.from("notifications").insert({
      tenant_id: tenantA,
      user_id: userMemberId,
      title: "Olá",
    })
    expect(own.error).toBeNull()

    const forOther = await clientMember.from("notifications").insert({
      tenant_id: tenantA,
      user_id: userAId,
      title: "Phishing",
    })
    expect(forOther.error).not.toBeNull()
  })

  it("Cliente do portal não lê anexo de entidade que não vê", async () => {
    const path = `${tenantA}/task/${taskAId}/${randomUUID()}-secret.txt`
    const uploaded = await admin.storage
      .from("attachments")
      .upload(path, new Blob(["secret"], { type: "text/plain" }), {
        contentType: "text/plain",
      })
    if (!uploaded.error) storagePaths.push(path)

    await admin.from("attachments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: taskAId,
      storage_path: path,
      file_name: "secret.txt",
    })

    const signed = await clientPortal.storage
      .from("attachments")
      .createSignedUrl(path, 60)
    expect(signed.error).not.toBeNull()
  })

  it("Cliente do portal lê anexo de projeto da própria empresa", async () => {
    const proj = await admin
      .from("projects")
      .insert({
        tenant_id: tenantA,
        company_id: portalCompanyId,
        name: `Portal Projeto ${suffix}`,
      })
      .select("id")
      .single()
    if (proj.error) throw proj.error

    const task = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantA,
        project_id: proj.data!.id,
        name: `Portal Tarefa ${suffix}`,
      })
      .select("id")
      .single()
    if (task.error) throw task.error

    const path = `${tenantA}/task/${task.data!.id}/${randomUUID()}-ok.txt`
    const uploaded = await admin.storage
      .from("attachments")
      .upload(path, new Blob(["ok"], { type: "text/plain" }), {
        contentType: "text/plain",
      })
    if (!uploaded.error) storagePaths.push(path)

    await admin.from("attachments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: task.data!.id,
      storage_path: path,
      file_name: "ok.txt",
    })

    const signed = await clientPortal.storage
      .from("attachments")
      .createSignedUrl(path, 60)
    expect(signed.error).toBeNull()
  })

  it("A não insere anexo com storage_path de outro tenant", async () => {
    const { error } = await clientA.from("attachments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: taskAId,
      storage_path: `${tenantB}/task/${taskAId}/forged.txt`,
      file_name: "forged.txt",
    })
    expect(error).not.toBeNull()
  })

  it("Cliente do portal não assina anexo com caminho forjado de outro tenant", async () => {
    const portalProject = await admin
      .from("projects")
      .insert({
        tenant_id: tenantA,
        company_id: portalCompanyId,
        name: `Portal Forged ${suffix}`,
      })
      .select("id")
      .single()
    if (portalProject.error) throw portalProject.error

    const portalTask = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantA,
        project_id: portalProject.data!.id,
        name: `Portal Forged Tarefa ${suffix}`,
      })
      .select("id")
      .single()
    if (portalTask.error) throw portalTask.error

    const forgedPath = `${tenantB}/task/${portalTask.data!.id}/${randomUUID()}-forged.txt`
    const uploaded = await admin.storage
      .from("attachments")
      .upload(forgedPath, new Blob(["secret"], { type: "text/plain" }), {
        contentType: "text/plain",
      })
    if (!uploaded.error) storagePaths.push(forgedPath)

    await admin.from("attachments").insert({
      tenant_id: tenantA,
      entity_type: "task",
      entity_id: portalTask.data!.id,
      storage_path: forgedPath,
      file_name: "forged.txt",
    })

    const signed = await clientPortal.storage
      .from("attachments")
      .createSignedUrl(forgedPath, 60)
    expect(signed.error).not.toBeNull()
  })

  it("Admin não insere membership com papel owner", async () => {
    const { error } = await clientAdmin.from("memberships").insert({
      tenant_id: tenantA,
      user_id: userBId,
      role: "owner",
      status: "active",
    })
    expect(error).not.toBeNull()
  })

  it("Admin não cria convite com papel owner", async () => {
    const { error } = await clientAdmin.from("invitations").insert({
      tenant_id: tenantA,
      email: `owner-invite-${suffix}@orbit.test`,
      role: "owner",
    })
    expect(error).not.toBeNull()
  })

  it("Membro não vincula user_id em contato do portal", async () => {
    const { error } = await clientMember
      .from("contacts")
      .update({ user_id: userBId })
      .eq("company_id", portalCompanyId)
      .select("id")
    expect(error).not.toBeNull()
  })

  it("Cliente do portal não lê orçamento em rascunho", async () => {
    const draft = await admin
      .from("estimates")
      .insert({
        tenant_id: tenantA,
        company_id: portalCompanyId,
        number: 999,
        prefix: "EST-",
        formatted_number: `EST-${suffix}`,
        status: 1,
        date: new Date().toISOString().slice(0, 10),
        total: 100,
      })
      .select("id")
      .single()
    if (draft.error) throw draft.error

    const { data } = await clientPortal
      .from("estimates")
      .select("id")
      .eq("id", draft.data!.id)
    expect(data ?? []).toEqual([])
  })

  describe("Portal: resposta a orçamento (client_respond_estimate)", () => {
    let nextNumber = 900

    async function estimate(status: number) {
      nextNumber -= 1
      const created = await admin
        .from("estimates")
        .insert({
          tenant_id: tenantA,
          company_id: portalCompanyId,
          number: nextNumber,
          prefix: "EST-",
          formatted_number: `EST-R${nextNumber}-${suffix}`,
          status,
          date: new Date().toISOString().slice(0, 10),
          total: 100,
        })
        .select("id")
        .single()
      if (created.error) throw created.error
      return created.data.id as string
    }

    async function statusOf(id: string) {
      const { data } = await admin
        .from("estimates")
        .select("status")
        .eq("id", id)
        .single()
      return data?.status
    }

    it("cliente aceita orçamento enviado", async () => {
      const id = await estimate(2)
      const { error } = await clientPortal.rpc("client_respond_estimate", {
        p_estimate: id,
        p_accept: true,
      })
      expect(error).toBeNull()
      expect(await statusOf(id)).toBe(4)
    })

    it("cliente não muda a resposta de orçamento já aceito", async () => {
      const id = await estimate(4)
      const { error } = await clientPortal.rpc("client_respond_estimate", {
        p_estimate: id,
        p_accept: false,
      })
      expect(error).not.toBeNull()
      expect(await statusOf(id)).toBe(4)
    })

    it("cliente não aceita orçamento expirado nem rascunho", async () => {
      for (const status of [5, 1, 3]) {
        const id = await estimate(status)
        const { error } = await clientPortal.rpc("client_respond_estimate", {
          p_estimate: id,
          p_accept: true,
        })
        expect(error, `status ${status}`).not.toBeNull()
        expect(await statusOf(id)).toBe(status)
      }
    })

    it("outro tenant e anon não respondem orçamento do cliente", async () => {
      const id = await estimate(2)
      const anon = createClient(url!, anonKey!)
      for (const [label, client] of [
        ["tenantB", clientB],
        ["anon", anon],
      ] as const) {
        const { error } = await client.rpc("client_respond_estimate", {
          p_estimate: id,
          p_accept: true,
        })
        expect(error, label).not.toBeNull()
      }
      expect(await statusOf(id)).toBe(2)
    })
  })

  describe("Base de conhecimento: contador de visualizações", () => {
    let articleId = ""
    const frozen = "2026-01-01T00:00:00+00:00"

    beforeAll(async () => {
      const created = await admin
        .from("kb_articles")
        .insert({
          tenant_id: tenantA,
          title: `Artigo ${suffix}`,
          slug: `artigo-${suffix}`,
          content: "Conteúdo",
          is_published: true,
        })
        .select("id")
        .single()
      if (created.error) throw created.error
      articleId = created.data.id
      const frozenRes = await admin
        .from("kb_articles")
        .update({ updated_at: frozen })
        .eq("id", articleId)
      if (frozenRes.error) throw frozenRes.error
    })

    async function article() {
      const { data } = await admin
        .from("kb_articles")
        .select("views, updated_at")
        .eq("id", articleId)
        .single()
      return data!
    }

    it("conta visualizações simultâneas sem perder nenhuma", async () => {
      const before = await article()
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          clientA.rpc("increment_kb_article_views", { p_article: articleId }),
        ),
      )
      for (const result of results) expect(result.error).toBeNull()
      expect((await article()).views).toBe(before.views + 5)
    })

    it("visualização não altera updated_at", async () => {
      await clientA.rpc("increment_kb_article_views", { p_article: articleId })
      expect(new Date((await article()).updated_at).toISOString()).toBe(
        new Date(frozen).toISOString(),
      )
    })

    it("editar o artigo continua atualizando updated_at", async () => {
      const { error } = await clientA
        .from("kb_articles")
        .update({ title: `Artigo editado ${suffix}` })
        .eq("id", articleId)
      expect(error).toBeNull()
      expect(new Date((await article()).updated_at).toISOString()).not.toBe(
        new Date(frozen).toISOString(),
      )
    })

    it("outro tenant não incrementa o artigo", async () => {
      const before = await article()
      await clientB.rpc("increment_kb_article_views", { p_article: articleId })
      expect((await article()).views).toBe(before.views)
    })
  })

  it("URL assinada de upload: só o próprio tenant assina e o token não sobrescreve", async () => {
    const path = `${tenantA}/project/${projectAId}/assinado-${suffix}.txt`

    const other = await clientB.storage
      .from("attachments")
      .createSignedUploadUrl(path)
    expect(other.error).not.toBeNull()

    const anon = createClient(url!, anonKey!)
    const anonRes = await anon.storage
      .from("attachments")
      .createSignedUploadUrl(path)
    expect(anonRes.error).not.toBeNull()

    const signed = await clientA.storage
      .from("attachments")
      .createSignedUploadUrl(path)
    expect(signed.error).toBeNull()

    const body = new Blob(["primeira versão"], { type: "text/plain" })
    const first = await anon.storage
      .from("attachments")
      .uploadToSignedUrl(path, signed.data!.token, body)
    expect(first.error).toBeNull()

    const again = await anon.storage
      .from("attachments")
      .uploadToSignedUrl(
        path,
        signed.data!.token,
        new Blob(["sobrescrita"], { type: "text/plain" }),
      )
    expect(again.error).not.toBeNull()

    const stored = await admin.storage.from("attachments").download(path)
    expect(await stored.data?.text()).toBe("primeira versão")
    await admin.storage.from("attachments").remove([path])
  })

  it("tenant_storage_bytes soma só os arquivos do próprio tenant", async () => {
    const before = await clientA.rpc("tenant_storage_bytes", {
      p_tenant: tenantA,
    })
    expect(before.error).toBeNull()

    const inserted = await admin.from("attachments").insert({
      tenant_id: tenantA,
      entity_type: "project",
      entity_id: projectAId,
      storage_path: `${tenantA}/quota-${suffix}.txt`,
      file_name: "quota.txt",
      size_bytes: 1500,
    })
    if (inserted.error) throw inserted.error

    const after = await clientA.rpc("tenant_storage_bytes", {
      p_tenant: tenantA,
    })
    expect(Number(after.data)).toBe(Number(before.data ?? 0) + 1500)

    const other = await clientB.rpc("tenant_storage_bytes", {
      p_tenant: tenantA,
    })
    expect(other.error).toBeNull()
    expect(Number(other.data ?? 0)).toBe(0)

    const anon = createClient(url!, anonKey!)
    const anonRes = await anon.rpc("tenant_storage_bytes", {
      p_tenant: tenantA,
    })
    expect(anonRes.error).not.toBeNull()
  })

  it("social_settings.updated_at muda quando owner altera a configuração", async () => {
    const seeded = await admin
      .from("social_settings")
      .upsert({ tenant_id: tenantA, approval_required: true })
      .select("updated_at")
      .single()
    if (seeded.error) throw seeded.error
    const before = new Date(seeded.data.updated_at).getTime()

    const { error } = await clientA
      .from("social_settings")
      .update({ approval_required: false })
      .eq("tenant_id", tenantA)
    expect(error).toBeNull()

    const { data } = await admin
      .from("social_settings")
      .select("approval_required, updated_at")
      .eq("tenant_id", tenantA)
      .single()
    expect(data?.approval_required).toBe(false)
    expect(new Date(data!.updated_at).getTime()).toBeGreaterThan(before)

    await admin
      .from("social_settings")
      .update({ approval_required: true })
      .eq("tenant_id", tenantA)
  })

  it("Portal lê projetos da empresa via RPC e não direto na tabela", async () => {
    const direct = await clientPortal.from("projects").select("id")
    expect(direct.data ?? []).toEqual([])

    const rpcRes = await clientPortal.rpc("portal_list_projects", {
      p_company: portalCompanyId,
    })
    expect(rpcRes.error).toBeNull()
    expect((rpcRes.data ?? []).length).toBeGreaterThan(0)
  })

  it("Portal não lê tasks/companies/profiles diretamente", async () => {
    const tasks = await clientPortal.from("tasks").select("id")
    expect(tasks.data ?? []).toEqual([])

    const companies = await clientPortal.from("companies").select("id")
    expect(companies.data ?? []).toEqual([])

    // O próprio perfil é legível (profiles_select_self_or_admin); nenhum outro.
    const profiles = await clientPortal
      .from("profiles")
      .select("id")
      .neq("id", clientUserId)
    expect(profiles.data ?? []).toEqual([])
  })

  it("Portal lê tarefas e marcos do projeto via RPC", async () => {
    const project = await admin
      .from("projects")
      .insert({
        tenant_id: tenantA,
        company_id: portalCompanyId,
        name: `Portal RPC ${suffix}`,
      })
      .select("id")
      .single()
    if (project.error) throw project.error

    const milestone = await admin
      .from("milestones")
      .insert({
        tenant_id: tenantA,
        project_id: project.data!.id,
        name: `Marco RPC ${suffix}`,
      })
      .select("id")
      .single()
    if (milestone.error) throw milestone.error

    const task = await admin
      .from("tasks")
      .insert({
        tenant_id: tenantA,
        project_id: project.data!.id,
        milestone_id: milestone.data!.id,
        name: `Tarefa RPC ${suffix}`,
      })
      .select("id")
      .single()
    if (task.error) throw task.error

    const taskRes = await clientPortal.rpc("portal_list_tasks", {
      p_project: project.data!.id,
    })
    expect(taskRes.error).toBeNull()
    expect((taskRes.data ?? []).map((row: { id: string }) => row.id)).toContain(
      task.data!.id,
    )

    const msRes = await clientPortal.rpc("portal_list_milestones", {
      p_project: project.data!.id,
    })
    expect(msRes.error).toBeNull()
    const milestoneRow = (msRes.data ?? []).find(
      (row: { id: string; task_count: number }) =>
        row.id === milestone.data!.id,
    )
    expect(milestoneRow?.task_count).toBe(1)
  })

  it("Rate limit distribuído bloqueia após o limite", async () => {
    const bucket = `test-rate-${suffix}`
    const first = await admin.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_limit: 2,
      p_window_seconds: 60,
    })
    const second = await admin.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_limit: 2,
      p_window_seconds: 60,
    })
    const third = await admin.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_limit: 2,
      p_window_seconds: 60,
    })
    expect(first.data).toBe(true)
    expect(second.data).toBe(true)
    expect(third.data).toBe(false)
  })

  describe("Exclusão de clientes, projetos e tarefas só para owner/admin", () => {
    async function createRows() {
      const company = await admin
        .from("companies")
        .insert({ tenant_id: tenantA, name: `Excluir ${randomUUID()}` })
        .select("id")
        .single()
      if (company.error) throw company.error
      const project = await admin
        .from("projects")
        .insert({
          tenant_id: tenantA,
          company_id: company.data!.id,
          name: `Excluir ${randomUUID()}`,
        })
        .select("id")
        .single()
      if (project.error) throw project.error
      const task = await admin
        .from("tasks")
        .insert({
          tenant_id: tenantA,
          project_id: project.data!.id,
          name: `Excluir ${randomUUID()}`,
        })
        .select("id")
        .single()
      if (task.error) throw task.error
      return {
        companies: company.data!.id,
        projects: project.data!.id,
        tasks: task.data!.id,
      }
    }

    const tables = ["companies", "projects", "tasks"] as const

    it("membro não consegue marcar deleted_at", async () => {
      const ids = await createRows()
      for (const table of tables) {
        const { error } = await clientMember
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", ids[table])
        expect(error, table).not.toBeNull()

        const row = await admin
          .from(table)
          .select("deleted_at")
          .eq("id", ids[table])
          .single()
        expect(row.data?.deleted_at, table).toBeNull()
      }
    })

    it("membro continua editando os registros", async () => {
      const ids = await createRows()
      for (const table of tables) {
        const name = `Editado ${randomUUID()}`
        const { error } = await clientMember
          .from(table)
          .update({ name })
          .eq("id", ids[table])
        expect(error, table).toBeNull()

        const row = await admin
          .from(table)
          .select("name")
          .eq("id", ids[table])
          .single()
        expect(row.data?.name, table).toBe(name)
      }
    })

    it("membro não consegue apagar as linhas", async () => {
      const ids = await createRows()
      for (const table of [...tables].reverse()) {
        const deleted = await clientMember
          .from(table)
          .delete()
          .eq("id", ids[table])
          .select("id")
        expect(deleted.data ?? [], table).toEqual([])

        const row = await admin
          .from(table)
          .select("id")
          .eq("id", ids[table])
          .maybeSingle()
        expect(row.data?.id, table).toBe(ids[table])
      }
    })

    it("admin consegue marcar deleted_at", async () => {
      const ids = await createRows()
      for (const table of tables) {
        const { error } = await clientAdmin
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", ids[table])
        expect(error, table).toBeNull()

        const row = await admin
          .from(table)
          .select("deleted_at")
          .eq("id", ids[table])
          .single()
        expect(row.data?.deleted_at, table).not.toBeNull()
      }
    })
  })

  describe("Social: destino do post restrito ao cliente", () => {
    let companyXId = ""
    let companyYId = ""
    let accountXId = ""
    let accountYId = ""
    let accountAgencyId = ""
    let postXId = ""

    beforeAll(async () => {
      const companies = await admin
        .from("companies")
        .insert([
          { tenant_id: tenantA, name: `Social X ${suffix}` },
          { tenant_id: tenantA, name: `Social Y ${suffix}` },
        ])
        .select("id, name")
      if (companies.error) throw companies.error
      companyXId = companies.data.find((c) => c.name.startsWith("Social X"))!.id
      companyYId = companies.data.find((c) => c.name.startsWith("Social Y"))!.id

      const accounts = await admin
        .from("social_accounts")
        .insert([
          {
            tenant_id: tenantA,
            company_id: companyXId,
            provider: "linkedin",
            provider_account_id: `x-${suffix}`,
            display_name: "Conta X",
          },
          {
            tenant_id: tenantA,
            company_id: companyYId,
            provider: "linkedin",
            provider_account_id: `y-${suffix}`,
            display_name: "Conta Y",
          },
          {
            tenant_id: tenantA,
            company_id: null,
            provider: "linkedin",
            provider_account_id: `agencia-${suffix}`,
            display_name: "Conta da agência",
          },
        ])
        .select("id, display_name")
      if (accounts.error) throw accounts.error
      const byName = (name: string) =>
        accounts.data.find((a) => a.display_name === name)!.id
      accountXId = byName("Conta X")
      accountYId = byName("Conta Y")
      accountAgencyId = byName("Conta da agência")

      const post = await admin
        .from("social_posts")
        .insert({
          tenant_id: tenantA,
          company_id: companyXId,
          content: `Post X ${suffix}`,
        })
        .select("id")
        .single()
      if (post.error) throw post.error
      postXId = post.data.id
    })

    it("membro adiciona conta do próprio cliente e conta da agência", async () => {
      const { error } = await clientMember.from("social_post_targets").insert([
        { tenant_id: tenantA, post_id: postXId, account_id: accountXId },
        { tenant_id: tenantA, post_id: postXId, account_id: accountAgencyId },
      ])
      expect(error).toBeNull()
    })

    it("membro não adiciona conta de outro cliente", async () => {
      const { error } = await clientMember.from("social_post_targets").insert({
        tenant_id: tenantA,
        post_id: postXId,
        account_id: accountYId,
      })
      expect(error?.code).toBe("23514")

      const rows = await admin
        .from("social_post_targets")
        .select("id")
        .eq("post_id", postXId)
        .eq("account_id", accountYId)
      expect(rows.data ?? []).toEqual([])
    })

    it("membro não move o post para outro cliente com destinos do cliente atual", async () => {
      const { error } = await clientMember
        .from("social_posts")
        .update({ company_id: companyYId })
        .eq("id", postXId)
      expect(error?.code).toBe("23514")

      const row = await admin
        .from("social_posts")
        .select("company_id")
        .eq("id", postXId)
        .single()
      expect(row.data?.company_id).toBe(companyXId)
    })

    it("admin não passa uma conta em uso para outro cliente", async () => {
      const { error } = await clientAdmin
        .from("social_accounts")
        .update({ company_id: companyYId })
        .eq("id", accountXId)
      expect(error?.code).toBe("23514")
    })

    it("admin pode tornar a conta da agência", async () => {
      const { error } = await clientAdmin
        .from("social_accounts")
        .update({ company_id: null })
        .eq("id", accountXId)
      expect(error).toBeNull()
    })
  })

  describe("SEO: isolamento entre tenants e portal", () => {
    let siteAId = ""
    let siteBId = ""
    let auditAId = ""
    let auditBId = ""

    beforeAll(async () => {
      const sites = await admin
        .from("seo_sites")
        .insert([
          {
            tenant_id: tenantA,
            company_id: portalCompanyId,
            label: `Site A ${suffix}`,
            url: "https://a.example.com",
          },
          {
            tenant_id: tenantB,
            company_id: companyBId,
            label: `Site B ${suffix}`,
            url: "https://b.example.com",
          },
        ])
        .select("id, tenant_id")
      if (sites.error) throw sites.error
      siteAId = sites.data.find((s) => s.tenant_id === tenantA)!.id
      siteBId = sites.data.find((s) => s.tenant_id === tenantB)!.id

      const finishedAt = new Date().toISOString()
      const audits = await admin
        .from("seo_audits")
        .insert([
          {
            tenant_id: tenantA,
            site_id: siteAId,
            url: "https://a.example.com",
            status: 2,
            score: 91,
            checks_total: 10,
            issues_total: 1,
            finished_at: finishedAt,
          },
          {
            tenant_id: tenantB,
            site_id: siteBId,
            url: "https://b.example.com",
            status: 2,
            score: 42,
            checks_total: 10,
            issues_total: 6,
            finished_at: finishedAt,
          },
        ])
        .select("id, tenant_id")
      if (audits.error) throw audits.error
      auditAId = audits.data.find((a) => a.tenant_id === tenantA)!.id
      auditBId = audits.data.find((a) => a.tenant_id === tenantB)!.id
    })

    it("A vê o próprio site e auditoria, e não os de B", async () => {
      const sites = await clientA
        .from("seo_sites")
        .select("id")
        .in("id", [siteAId, siteBId])
      expect(sites.error).toBeNull()
      expect(sites.data?.map((s) => s.id)).toEqual([siteAId])

      const audits = await clientA
        .from("seo_audits")
        .select("id")
        .in("id", [auditAId, auditBId])
      expect(audits.error).toBeNull()
      expect(audits.data?.map((a) => a.id)).toEqual([auditAId])
    })

    it("A não cria site em outro tenant", async () => {
      const { error } = await clientA.from("seo_sites").insert({
        tenant_id: tenantB,
        label: "Intruso",
        url: "https://intruso.example.com",
      })
      expect(error).not.toBeNull()
    })

    it("A não cria site no próprio tenant apontando para cliente de B", async () => {
      const { error } = await clientA.from("seo_sites").insert({
        tenant_id: tenantA,
        company_id: companyBId,
        label: "Cliente alheio",
        url: "https://alheio.example.com",
      })
      expect(error).not.toBeNull()
    })

    it("A não cria auditoria para site de B", async () => {
      const ownTenant = await clientA.from("seo_audits").insert({
        tenant_id: tenantA,
        site_id: siteBId,
        url: "https://b.example.com",
      })
      expect(ownTenant.error).not.toBeNull()

      const otherTenant = await clientA.from("seo_audits").insert({
        tenant_id: tenantB,
        site_id: siteBId,
        url: "https://b.example.com",
      })
      expect(otherTenant.error).not.toBeNull()
    })

    it("A não altera nem apaga site e auditoria de B", async () => {
      const updSite = await clientA
        .from("seo_sites")
        .update({ label: "Hackeado" })
        .eq("id", siteBId)
        .select("id")
      expect(updSite.data ?? []).toEqual([])

      const updAudit = await clientA
        .from("seo_audits")
        .update({ score: 100 })
        .eq("id", auditBId)
        .select("id")
      expect(updAudit.data ?? []).toEqual([])

      const delAudit = await clientA
        .from("seo_audits")
        .delete()
        .eq("id", auditBId)
        .select("id")
      expect(delAudit.data ?? []).toEqual([])

      const delSite = await clientA
        .from("seo_sites")
        .delete()
        .eq("id", siteBId)
        .select("id")
      expect(delSite.data ?? []).toEqual([])

      const site = await admin
        .from("seo_sites")
        .select("label")
        .eq("id", siteBId)
        .single()
      expect(site.data?.label).toBe(`Site B ${suffix}`)

      const audit = await admin
        .from("seo_audits")
        .select("score")
        .eq("id", auditBId)
        .single()
      expect(audit.data?.score).toBe(42)
    })

    it("membro não apaga site do próprio tenant", async () => {
      const deleted = await clientMember
        .from("seo_sites")
        .delete()
        .eq("id", siteAId)
        .select("id")
      expect(deleted.data ?? []).toEqual([])

      const row = await admin
        .from("seo_sites")
        .select("id")
        .eq("id", siteAId)
        .maybeSingle()
      expect(row.data?.id).toBe(siteAId)
    })

    it("cliente do portal não lê seo_sites nem seo_audits diretamente", async () => {
      const sites = await clientPortal.from("seo_sites").select("id")
      expect(sites.data ?? []).toEqual([])

      const audits = await clientPortal.from("seo_audits").select("id")
      expect(audits.data ?? []).toEqual([])
    })

    it("portal lista só os sites da própria empresa", async () => {
      const own = await clientPortal.rpc("portal_list_seo_sites", {
        p_company: portalCompanyId,
      })
      expect(own.error).toBeNull()
      expect(own.data?.map((s: { id: string }) => s.id)).toEqual([siteAId])
      expect(own.data?.[0]?.score).toBe(91)

      const otherTenant = await clientPortal.rpc("portal_list_seo_sites", {
        p_company: companyBId,
      })
      expect(otherTenant.data ?? []).toEqual([])

      const otherCompany = await clientPortal.rpc("portal_list_seo_sites", {
        p_company: companyAId,
      })
      expect(otherCompany.data ?? []).toEqual([])
    })

    it("portal lê a auditoria do próprio site e não a de B", async () => {
      const own = await clientPortal.rpc("portal_get_seo_audit", {
        p_company: portalCompanyId,
        p_site: siteAId,
      })
      expect(own.error).toBeNull()
      expect(own.data?.[0]?.score).toBe(91)

      const otherSite = await clientPortal.rpc("portal_get_seo_audit", {
        p_company: portalCompanyId,
        p_site: siteBId,
      })
      expect(otherSite.data ?? []).toEqual([])

      const otherCompany = await clientPortal.rpc("portal_get_seo_audit", {
        p_company: companyBId,
        p_site: siteBId,
      })
      expect(otherCompany.data ?? []).toEqual([])
    })

    it("membro da equipe não usa as RPCs do portal como cliente", async () => {
      const list = await clientB.rpc("portal_list_seo_sites", {
        p_company: portalCompanyId,
      })
      expect(list.data ?? []).toEqual([])

      const audit = await clientB.rpc("portal_get_seo_audit", {
        p_company: portalCompanyId,
        p_site: siteAId,
      })
      expect(audit.data ?? []).toEqual([])
    })

    it("anon não executa as RPCs de SEO do portal", async () => {
      const anon = createClient(url!, anonKey!)
      const list = await anon.rpc("portal_list_seo_sites", {
        p_company: portalCompanyId,
      })
      expect(list.error?.code).toBe("42501")

      const audit = await anon.rpc("portal_get_seo_audit", {
        p_company: portalCompanyId,
        p_site: siteAId,
      })
      expect(audit.error?.code).toBe("42501")
    })
  })

  describe("Social: isolamento entre tenants e portal", () => {
    let accountAId = ""
    let accountBId = ""
    let postAId = ""
    let postBId = ""
    let draftAId = ""
    let targetAId = ""
    let targetBId = ""
    let eventBId = ""
    let mediaBId = ""

    beforeAll(async () => {
      const settings = await admin.from("social_settings").upsert([
        { tenant_id: tenantA, max_retries: 3 },
        { tenant_id: tenantB, max_retries: 5 },
      ])
      if (settings.error) throw settings.error

      const accounts = await admin
        .from("social_accounts")
        .insert([
          {
            tenant_id: tenantA,
            company_id: portalCompanyId,
            provider: "linkedin",
            provider_account_id: `iso-a-${suffix}`,
            display_name: "Conta isolada A",
          },
          {
            tenant_id: tenantB,
            company_id: companyBId,
            provider: "linkedin",
            provider_account_id: `iso-b-${suffix}`,
            display_name: "Conta isolada B",
          },
        ])
        .select("id, tenant_id")
      if (accounts.error) throw accounts.error
      accountAId = accounts.data.find((a) => a.tenant_id === tenantA)!.id
      accountBId = accounts.data.find((a) => a.tenant_id === tenantB)!.id

      const posts = await admin
        .from("social_posts")
        .insert([
          {
            tenant_id: tenantA,
            company_id: portalCompanyId,
            content: `Post A ${suffix}`,
            status: "pending_approval",
          },
          {
            tenant_id: tenantA,
            company_id: portalCompanyId,
            content: `Rascunho A ${suffix}`,
            status: "draft",
          },
          {
            tenant_id: tenantB,
            company_id: companyBId,
            content: `Post B ${suffix}`,
            status: "pending_approval",
          },
        ])
        .select("id, content")
      if (posts.error) throw posts.error
      const byContent = (prefix: string) =>
        posts.data.find((p) => p.content.startsWith(prefix))!.id
      postAId = byContent("Post A")
      draftAId = byContent("Rascunho A")
      postBId = byContent("Post B")

      const targets = await admin
        .from("social_post_targets")
        .insert([
          { tenant_id: tenantA, post_id: postAId, account_id: accountAId },
          { tenant_id: tenantB, post_id: postBId, account_id: accountBId },
        ])
        .select("id, tenant_id")
      if (targets.error) throw targets.error
      targetAId = targets.data.find((t) => t.tenant_id === tenantA)!.id
      targetBId = targets.data.find((t) => t.tenant_id === tenantB)!.id

      const event = await admin
        .from("social_post_events")
        .insert({ tenant_id: tenantB, post_id: postBId, event: "created" })
        .select("id")
        .single()
      if (event.error) throw event.error
      eventBId = event.data.id

      const media = await admin
        .from("social_media")
        .insert({
          tenant_id: tenantB,
          post_id: postBId,
          storage_path: `${tenantB}/${postBId}/b.png`,
          file_name: "b.png",
        })
        .select("id")
        .single()
      if (media.error) throw media.error
      mediaBId = media.data.id
    })

    it("A não enxerga nenhuma tabela do Social de B", async () => {
      const checks: Array<[string, string, string]> = [
        ["social_accounts", "id", accountBId],
        ["social_posts", "id", postBId],
        ["social_post_targets", "id", targetBId],
        ["social_post_events", "id", eventBId],
        ["social_media", "id", mediaBId],
        ["social_settings", "tenant_id", tenantB],
      ]
      for (const [table, column, value] of checks) {
        const { data, error } = await clientA
          .from(table)
          .select(column)
          .eq(column, value)
        expect(error, table).toBeNull()
        expect(data, table).toEqual([])
      }
    })

    it("A enxerga os próprios registros do Social", async () => {
      const posts = await clientA
        .from("social_posts")
        .select("id")
        .in("id", [postAId, postBId])
      expect(posts.data?.map((p) => p.id)).toEqual([postAId])

      const targets = await clientA
        .from("social_post_targets")
        .select("id")
        .in("id", [targetAId, targetBId])
      expect(targets.data?.map((t) => t.id)).toEqual([targetAId])

      const settings = await clientA.from("social_settings").select("tenant_id")
      expect(settings.data?.map((s) => s.tenant_id)).toEqual([tenantA])
    })

    it("A não cria conta, post nem evento em outro tenant", async () => {
      const account = await clientA.from("social_accounts").insert({
        tenant_id: tenantB,
        provider: "linkedin",
        provider_account_id: `intruso-${suffix}`,
        display_name: "Intrusa",
      })
      expect(account.error, "social_accounts").not.toBeNull()

      const post = await clientA.from("social_posts").insert({
        tenant_id: tenantB,
        content: "Intruso",
      })
      expect(post.error, "social_posts").not.toBeNull()

      const event = await clientA.from("social_post_events").insert({
        tenant_id: tenantB,
        post_id: postBId,
        event: "approved",
      })
      expect(event.error, "social_post_events").not.toBeNull()
    })

    it("A não cria post no próprio tenant para cliente de B", async () => {
      const { error } = await clientA.from("social_posts").insert({
        tenant_id: tenantA,
        company_id: companyBId,
        content: "Cliente alheio",
      })
      expect(error).not.toBeNull()
    })

    it("A não usa conta nem post de B como destino", async () => {
      const foreignAccount = await clientA.from("social_post_targets").insert({
        tenant_id: tenantA,
        post_id: postAId,
        account_id: accountBId,
      })
      expect(foreignAccount.error).not.toBeNull()

      const foreignPost = await clientA.from("social_post_targets").insert({
        tenant_id: tenantA,
        post_id: postBId,
        account_id: accountAId,
      })
      expect(foreignPost.error).not.toBeNull()

      const otherTenant = await clientA.from("social_post_targets").insert({
        tenant_id: tenantB,
        post_id: postBId,
        account_id: accountBId,
      })
      expect(otherTenant.error).not.toBeNull()
    })

    it("A não registra mídia em post ou caminho de outro tenant", async () => {
      const foreignPost = await clientA.from("social_media").insert({
        tenant_id: tenantA,
        post_id: postBId,
        storage_path: `${tenantA}/${postBId}/x.png`,
        file_name: "x.png",
      })
      expect(foreignPost.error).not.toBeNull()

      const foreignPath = await clientA.from("social_media").insert({
        tenant_id: tenantA,
        post_id: postAId,
        storage_path: `${tenantB}/${postAId}/x.png`,
        file_name: "x.png",
      })
      expect(foreignPath.error).not.toBeNull()
    })

    it("A não altera nem apaga registros do Social de B", async () => {
      const updates: Array<[string, string, string, Record<string, unknown>]> =
        [
          ["social_posts", "id", postBId, { status: "approved" }],
          ["social_post_targets", "id", targetBId, { status: "published" }],
          ["social_accounts", "id", accountBId, { display_name: "Hackeada" }],
          ["social_settings", "tenant_id", tenantB, { max_retries: 0 }],
        ]
      for (const [table, column, value, patch] of updates) {
        const { data } = await clientA
          .from(table)
          .update(patch)
          .eq(column, value)
          .select(column)
        expect(data ?? [], table).toEqual([])
      }

      const deletes: Array<[string, string]> = [
        ["social_media", mediaBId],
        ["social_post_targets", targetBId],
        ["social_posts", postBId],
        ["social_accounts", accountBId],
      ]
      for (const [table, id] of deletes) {
        const { data } = await clientA
          .from(table)
          .delete()
          .eq("id", id)
          .select("id")
        expect(data ?? [], table).toEqual([])
      }

      const post = await admin
        .from("social_posts")
        .select("status")
        .eq("id", postBId)
        .single()
      expect(post.data?.status).toBe("pending_approval")

      const target = await admin
        .from("social_post_targets")
        .select("status")
        .eq("id", targetBId)
        .single()
      expect(target.data?.status).toBe("pending")

      const settings = await admin
        .from("social_settings")
        .select("max_retries")
        .eq("tenant_id", tenantB)
        .single()
      expect(settings.data?.max_retries).toBe(5)

      const media = await admin
        .from("social_media")
        .select("id")
        .eq("id", mediaBId)
        .maybeSingle()
      expect(media.data?.id).toBe(mediaBId)
    })

    it("membro não cria conta nem altera configurações do Social", async () => {
      const account = await clientMember.from("social_accounts").insert({
        tenant_id: tenantA,
        provider: "linkedin",
        provider_account_id: `membro-${suffix}`,
        display_name: "Conta do membro",
      })
      expect(account.error).not.toBeNull()

      const settings = await clientMember
        .from("social_settings")
        .update({ approval_required: false })
        .eq("tenant_id", tenantA)
        .select("tenant_id")
      expect(settings.data ?? []).toEqual([])
    })

    it("Storage social_media: A envia no próprio tenant e é barrado em outro", async () => {
      const blob = new Blob(["orbit"], { type: "image/png" })

      const ownPath = `${tenantA}/${postAId}/${randomUUID()}.png`
      const own = await clientA.storage
        .from("social_media")
        .upload(ownPath, blob, { contentType: "image/png" })
      if (!own.error) socialMediaPaths.push(ownPath)
      expect(own.error).toBeNull()

      const otherPath = `${tenantB}/${postBId}/${randomUUID()}.png`
      const other = await clientA.storage
        .from("social_media")
        .upload(otherPath, blob, { contentType: "image/png" })
      if (!other.error) socialMediaPaths.push(otherPath)
      expect(other.error).not.toBeNull()
    })

    it("Storage social_media: A não gera URL de arquivo de outro tenant", async () => {
      const path = `${tenantB}/${postBId}/${randomUUID()}-secret.png`
      const uploaded = await admin.storage
        .from("social_media")
        .upload(path, new Blob(["secret"], { type: "image/png" }), {
          contentType: "image/png",
        })
      if (!uploaded.error) socialMediaPaths.push(path)
      expect(uploaded.error).toBeNull()

      const signed = await clientA.storage
        .from("social_media")
        .createSignedUrl(path, 60)
      expect(signed.error).not.toBeNull()
    })

    it("cliente do portal não lê as tabelas do Social diretamente", async () => {
      for (const table of [
        "social_accounts",
        "social_posts",
        "social_post_targets",
        "social_post_events",
        "social_media",
        "social_settings",
      ]) {
        const { data } = await clientPortal.from(table).select("tenant_id")
        expect(data ?? [], table).toEqual([])
      }
    })

    it("portal lista só os posts da própria empresa, sem rascunhos", async () => {
      const own = await clientPortal.rpc("portal_list_social_posts", {
        p_company: portalCompanyId,
      })
      expect(own.error).toBeNull()
      const ids = (own.data ?? []).map((p: { id: string }) => p.id)
      expect(ids).toContain(postAId)
      expect(ids).not.toContain(draftAId)
      expect(ids).not.toContain(postBId)

      const otherTenant = await clientPortal.rpc("portal_list_social_posts", {
        p_company: companyBId,
      })
      expect(otherTenant.data ?? []).toEqual([])
    })

    it("portal lê o próprio post e não o de B nem rascunhos", async () => {
      const own = await clientPortal.rpc("portal_get_social_post", {
        p_company: portalCompanyId,
        p_post: postAId,
      })
      expect(own.error).toBeNull()
      expect(own.data?.[0]?.id).toBe(postAId)
      expect(own.data?.[0]?.targets).toEqual([
        {
          provider: "linkedin",
          display_name: "Conta isolada A",
          status: "pending",
        },
      ])

      const draft = await clientPortal.rpc("portal_get_social_post", {
        p_company: portalCompanyId,
        p_post: draftAId,
      })
      expect(draft.data ?? []).toEqual([])

      const crossCompany = await clientPortal.rpc("portal_get_social_post", {
        p_company: portalCompanyId,
        p_post: postBId,
      })
      expect(crossCompany.data ?? []).toEqual([])

      const otherTenant = await clientPortal.rpc("portal_get_social_post", {
        p_company: companyBId,
        p_post: postBId,
      })
      expect(otherTenant.data ?? []).toEqual([])
    })

    it("portal não responde post de outra empresa", async () => {
      const crossCompany = await clientPortal.rpc(
        "portal_respond_social_post",
        { p_company: portalCompanyId, p_post: postBId, p_approve: true },
      )
      expect(crossCompany.data).toBe(false)

      const otherTenant = await clientPortal.rpc("portal_respond_social_post", {
        p_company: companyBId,
        p_post: postBId,
        p_approve: true,
      })
      expect(otherTenant.data).toBe(false)

      const post = await admin
        .from("social_posts")
        .select("status")
        .eq("id", postBId)
        .single()
      expect(post.data?.status).toBe("pending_approval")
    })

    it("membro da equipe não responde como cliente do portal", async () => {
      const { data } = await clientA.rpc("portal_respond_social_post", {
        p_company: portalCompanyId,
        p_post: postAId,
        p_approve: true,
      })
      expect(data).toBe(false)

      const post = await admin
        .from("social_posts")
        .select("status")
        .eq("id", postAId)
        .single()
      expect(post.data?.status).toBe("pending_approval")
    })

    it("anon não executa as RPCs do Social do portal", async () => {
      const anon = createClient(url!, anonKey!)
      const calls: Array<[string, Record<string, unknown>]> = [
        ["portal_list_social_posts", { p_company: portalCompanyId }],
        [
          "portal_get_social_post",
          { p_company: portalCompanyId, p_post: postAId },
        ],
        [
          "portal_respond_social_post",
          { p_company: portalCompanyId, p_post: postAId, p_approve: true },
        ],
      ]
      for (const [fn, args] of calls) {
        const { error } = await anon.rpc(fn, args)
        expect(error?.code, fn).toBe("42501")
      }
    })

    // configure_social_publish_cron fica de fora de propósito: se o grant
    // regredir, chamá-la reagendaria o cron real do banco apontado.
    it("RPCs de token e worker são exclusivas do service_role", async () => {
      const anon = createClient(url!, anonKey!)
      const calls: Array<[string, Record<string, unknown>]> = [
        ["social_get_tokens", { p_account: accountAId }],
        [
          "social_store_tokens",
          {
            p_account: accountAId,
            p_access_token: "token-falso",
            p_refresh_token: null,
            p_expires_at: null,
          },
        ],
        ["social_clear_tokens", { p_account: accountAId }],
        ["claim_social_publish_targets", { p_limit: 1 }],
        ["reset_stale_social_targets", { p_minutes: 10 }],
      ]
      for (const [label, client] of [
        ["owner", clientA],
        ["portal", clientPortal],
        ["anon", anon],
      ] as const) {
        for (const [fn, args] of calls) {
          const { error } = await client.rpc(fn, args)
          expect(error?.code, `${label}:${fn}`).toBe("42501")
        }
      }

      const account = await admin
        .from("social_accounts")
        .select("access_token_id")
        .eq("id", accountAId)
        .single()
      expect(account.data?.access_token_id).toBeNull()
    })

    it("portal aprova o post pendente da própria empresa", async () => {
      const { data, error } = await clientPortal.rpc(
        "portal_respond_social_post",
        { p_company: portalCompanyId, p_post: postAId, p_approve: true },
      )
      expect(error).toBeNull()
      expect(data).toBe(true)

      const post = await admin
        .from("social_posts")
        .select("status, approved_by")
        .eq("id", postAId)
        .single()
      expect(post.data?.status).toBe("approved")
      expect(post.data?.approved_by).toBe(clientUserId)

      const events = await admin
        .from("social_post_events")
        .select("event, actor_id")
        .eq("post_id", postAId)
      expect(events.data).toContainEqual({
        event: "approved",
        actor_id: clientUserId,
      })

      const again = await clientPortal.rpc("portal_respond_social_post", {
        p_company: portalCompanyId,
        p_post: postAId,
        p_approve: false,
      })
      expect(again.data).toBe(false)
    })

    it("respostas simultâneas do portal: só uma vence e gera um evento", async () => {
      const created = await admin
        .from("social_posts")
        .insert({
          tenant_id: tenantA,
          company_id: portalCompanyId,
          content: `Corrida ${suffix}`,
          status: "pending_approval",
        })
        .select("id")
        .single()
      if (created.error) throw created.error
      const raceId = created.data.id

      const results = await Promise.all(
        [true, false, true, false, true, false].map((approve) =>
          clientPortal.rpc("portal_respond_social_post", {
            p_company: portalCompanyId,
            p_post: raceId,
            p_approve: approve,
          }),
        ),
      )
      for (const result of results) expect(result.error).toBeNull()
      expect(results.filter((result) => result.data === true)).toHaveLength(1)

      const events = await admin
        .from("social_post_events")
        .select("event")
        .eq("post_id", raceId)
        .in("event", ["approved", "rejected"])
      expect(events.data).toHaveLength(1)

      const post = await admin
        .from("social_posts")
        .select("status")
        .eq("id", raceId)
        .single()
      expect(post.data?.status).toBe(events.data?.[0]?.event)
    })
  })

  it("profiles.email é preenchido ao criar usuário", async () => {
    const { data } = await admin
      .from("profiles")
      .select("email")
      .eq("id", userAId)
      .maybeSingle()
    expect(data?.email).toBe(emailA)
  })
})
