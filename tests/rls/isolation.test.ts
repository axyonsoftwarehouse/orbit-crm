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

  let tenantA = ""
  let tenantB = ""
  let userAId = ""
  let userBId = ""
  let companyAId = ""
  let companyBId = ""
  let projectAId = ""
  let projectBId = ""
  let taskAId = ""
  let taskBId = ""
  let milestoneAId = ""
  let milestoneBId = ""
  let estimateAId = ""
  let estimateBId = ""
  let invoiceAId = ""
  let invoiceBId = ""
  const storagePaths: string[] = []
  let clientA: SupabaseClient
  let clientB: SupabaseClient

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
  })

  afterAll(async () => {
    if (storagePaths.length > 0) {
      await admin.storage.from("attachments").remove(storagePaths)
    }
    if (tenantA && tenantB) {
      await admin.from("tenants").delete().in("id", [tenantA, tenantB])
    }
    if (userAId) await admin.auth.admin.deleteUser(userAId)
    if (userBId) await admin.auth.admin.deleteUser(userBId)
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
})
