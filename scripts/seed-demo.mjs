import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const loadEnvFile = process.loadEnvFile
if (existsSync(".env.local")) loadEnvFile(".env.local")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_PASSWORD = "OrbitDemo#2026"
const demoUsers = [
  { email: "ana@orbit.demo", name: "Ana Souza", role: "admin" },
  { email: "bruno@orbit.demo", name: "Bruno Lima", role: "member" },
  { email: "carla@orbit.demo", name: "Carla Mendes", role: "member" },
  { email: "diego@orbit.demo", name: "Diego Rocha", role: "member" },
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const iso = (date) => date.toISOString().slice(0, 10)
const daysFromNow = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return iso(d)
}
const tsDaysAgo = (days, hour = 9) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)

async function getTenantId() {
  const { data } = await admin
    .from("tenants")
    .select("id, name")
    .eq("slug", "easy-prospect")
    .maybeSingle()
  if (!data) throw new Error("Tenant easy-prospect não encontrado.")
  return data.id
}

async function ensureDemoUsers(tenantId) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existing = new Map((list?.users ?? []).map((u) => [u.email, u.id]))
  const ids = {}

  for (const user of demoUsers) {
    let id = existing.get(user.email)
    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.name },
      })
      if (error) throw error
      id = data.user.id
    }
    ids[user.email] = id
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", Object.values(ids))
  for (const profile of profiles ?? []) {
    const match = demoUsers.find(
      (u) => ids[u.email] === profile.id && !profile.full_name,
    )
    if (match) {
      await admin
        .from("profiles")
        .update({ full_name: match.name })
        .eq("id", profile.id)
    }
  }

  await admin.from("memberships").upsert(
    demoUsers.map((u) => ({
      tenant_id: tenantId,
      user_id: ids[u.email],
      role: u.role,
      status: "active",
    })),
    { onConflict: "tenant_id,user_id" },
  )

  return ids
}

async function listAllFiles(prefix) {
  const files = []
  async function walk(path) {
    const { data } = await admin.storage
      .from("attachments")
      .list(path, { limit: 100 })
    for (const entry of data ?? []) {
      const full = path ? `${path}/${entry.name}` : entry.name
      if (entry.id) files.push(full)
      else await walk(full)
    }
  }
  await walk(prefix)
  return files
}

async function wipeStorage(tenantId) {
  const files = await listAllFiles(tenantId)
  if (files.length > 0) {
    await admin.storage.from("attachments").remove(files)
  }
}

async function wipe(tenantId) {
  await wipeStorage(tenantId)
  const tables = [
    "payments",
    "document_items",
    "invoices",
    "estimates",
    "comments",
    "attachments",
    "ticket_replies",
    "tickets",
    "departments",
    "time_entries",
    "task_checklist_items",
    "tasks",
    "project_members",
    "projects",
    "contacts",
    "companies",
    "kb_articles",
    "kb_categories",
    "faqs",
  ]
  for (const table of tables) {
    await admin.from(table).delete().eq("tenant_id", tenantId)
  }
}

async function seed(tenantId) {
  const { data: owner } = await admin
    .from("profiles")
    .select("id")
    .eq("full_name", "Werner Saboia")
    .maybeSingle()
  const ownerId = owner?.id ?? null

  const userIds = await ensureDemoUsers(tenantId)
  const team = [
    ownerId,
    userIds["ana@orbit.demo"],
    userIds["bruno@orbit.demo"],
    userIds["carla@orbit.demo"],
    userIds["diego@orbit.demo"],
  ].filter(Boolean)

  await wipe(tenantId)

  const companySeed = [
    [
      "Acme Ltda",
      "São Paulo",
      "Brasil",
      "+55 11 4002-8922",
      "12.345.678/0001-01",
    ],
    [
      "Bluewave Digital",
      "Rio de Janeiro",
      "Brasil",
      "+55 21 3030-1010",
      "23.456.789/0001-02",
    ],
    [
      "Nortech Sistemas",
      "Curitiba",
      "Brasil",
      "+55 41 3200-5555",
      "34.567.890/0001-03",
    ],
    [
      "Café Aurora",
      "Belo Horizonte",
      "Brasil",
      "+55 31 3555-1212",
      "45.678.901/0001-04",
    ],
    [
      "Studio Prisma",
      "Porto Alegre",
      "Brasil",
      "+55 51 3300-7788",
      "56.789.012/0001-05",
    ],
    [
      "TransLog Cargas",
      "Recife",
      "Brasil",
      "+55 81 3122-9090",
      "67.890.123/0001-06",
    ],
    [
      "Clínica Vida",
      "Fortaleza",
      "Brasil",
      "+55 85 3232-4545",
      "78.901.234/0001-07",
    ],
    [
      "EduTech Brasil",
      "Florianópolis",
      "Brasil",
      "+55 48 3344-6600",
      "89.012.345/0001-08",
    ],
  ]

  const { data: companies } = await admin
    .from("companies")
    .insert(
      companySeed.map(([name, city, country, phone, vat]) => ({
        tenant_id: tenantId,
        name,
        city,
        country,
        phone,
        vat,
        created_by: ownerId,
      })),
    )
    .select("id, name")

  const firstNames = [
    "Ana",
    "Bruno",
    "Carla",
    "Diego",
    "Elisa",
    "Felipe",
    "Gabi",
    "Heitor",
  ]
  const lastNames = [
    "Silva",
    "Costa",
    "Almeida",
    "Rocha",
    "Nunes",
    "Ferraz",
    "Moraes",
  ]
  const titles = [
    "Diretor(a)",
    "Gerente",
    "Analista",
    "Coordenador(a)",
    "Financeiro",
  ]

  const contactRows = []
  for (const company of companies) {
    const count = rand(1, 3)
    for (let i = 0; i < count; i++) {
      const first = pick(firstNames)
      const last = pick(lastNames)
      contactRows.push({
        tenant_id: tenantId,
        company_id: company.id,
        first_name: first,
        last_name: last,
        email:
          `${first}.${last}@${company.name.split(" ")[0].toLowerCase()}.com`.toLowerCase(),
        phone: `+55 11 9${rand(1000, 9999)}-${rand(1000, 9999)}`,
        title: pick(titles),
        is_primary: i === 0,
        created_by: ownerId,
      })
    }
  }
  await admin.from("contacts").insert(contactRows)

  const projectSeed = [
    {
      name: "Redesign do site institucional",
      status: 2,
      billing: 2,
      rate: 180,
      cost: null,
      progress: 65,
    },
    {
      name: "App de agendamento",
      status: 2,
      billing: 3,
      rate: 200,
      cost: null,
      progress: 40,
    },
    {
      name: "Integração de pagamentos",
      status: 1,
      billing: 1,
      rate: null,
      cost: 18500,
      progress: 0,
    },
    {
      name: "Migração para a nuvem",
      status: 3,
      billing: 2,
      rate: 220,
      cost: null,
      progress: 55,
    },
    {
      name: "Campanha de lançamento",
      status: 4,
      billing: 1,
      rate: null,
      cost: 12000,
      progress: 100,
    },
    {
      name: "Portal do cliente",
      status: 2,
      billing: 2,
      rate: 190,
      cost: null,
      progress: 30,
    },
  ]

  const projectRows = projectSeed.map((p, i) => ({
    tenant_id: tenantId,
    company_id: companies[i % companies.length].id,
    name: p.name,
    description: "Projeto de demonstração criado para popular o Orbit CRM.",
    status: p.status,
    billing_type: p.billing,
    start_date: daysFromNow(-rand(20, 70)),
    deadline: daysFromNow(rand(-5, 45)),
    progress: p.progress,
    progress_from_tasks: true,
    project_cost: p.cost,
    rate_per_hour: p.rate,
    estimated_hours: rand(40, 160),
    created_by: ownerId,
    date_finished: p.status === 4 ? new Date().toISOString() : null,
  }))

  const { data: projects } = await admin
    .from("projects")
    .insert(projectRows)
    .select("id, name")

  const memberRows = []
  for (const project of projects) {
    const chosen = [...team]
      .sort(() => Math.random() - 0.5)
      .slice(0, rand(2, 3))
    for (const userId of chosen) {
      memberRows.push({
        tenant_id: tenantId,
        project_id: project.id,
        user_id: userId,
      })
    }
  }
  await admin.from("project_members").insert(memberRows)

  const taskTitles = [
    "Wireframes da home",
    "Ajustes de UI no painel",
    "Integração com API de pagamento",
    "Configurar ambiente de staging",
    "Revisão de copy e SEO",
    "Modelagem do banco",
    "Testes automatizados",
    "Deploy em produção",
    "Configurar monitoramento",
    "Documentação técnica",
    "Onboarding de usuários",
    "Relatório de métricas",
  ]
  const taskStatuses = [1, 2, 3, 4, 5]
  const taskPriorities = [1, 2, 3, 4]

  const taskRows = []
  for (const project of projects) {
    const count = rand(3, 6)
    for (let i = 0; i < count; i++) {
      taskRows.push({
        tenant_id: tenantId,
        project_id: project.id,
        name: `${pick(taskTitles)} — ${project.name.split(" ")[0]}`,
        description: "Detalhes da tarefa preenchidos automaticamente.",
        status: pick(taskStatuses),
        priority: pick(taskPriorities),
        start_date: daysFromNow(-rand(5, 30)),
        due_date: daysFromNow(rand(-4, 25)),
        assignee_id: pick(team),
        billable: Math.random() > 0.4,
        hourly_rate: rand(120, 240),
        created_by: ownerId,
      })
    }
  }

  const { data: tasks } = await admin
    .from("tasks")
    .insert(taskRows)
    .select("id, status")

  const checklistRows = []
  for (const task of tasks.slice(0, 10)) {
    const items = ["Levantar requisitos", "Implementar", "Revisar", "Publicar"]
    for (const title of items) {
      checklistRows.push({
        tenant_id: tenantId,
        task_id: task.id,
        title,
        is_done: Math.random() > 0.5,
      })
    }
  }
  await admin.from("task_checklist_items").insert(checklistRows)

  const commentTexts = [
    "Podemos alinhar isso na reunião de amanhã?",
    "Ajustei conforme o feedback do cliente.",
    "Bloqueado aguardando acesso ao ambiente.",
    "Ficou ótimo! Só falta revisar os textos.",
    "Atualizei o escopo no documento compartilhado.",
  ]
  const commentRows = []
  for (const task of tasks.slice(0, 12)) {
    commentRows.push({
      tenant_id: tenantId,
      entity_type: "task",
      entity_id: task.id,
      author_id: pick(team),
      content: pick(commentTexts),
    })
  }
  for (const project of projects) {
    commentRows.push({
      tenant_id: tenantId,
      entity_type: "project",
      entity_id: project.id,
      author_id: pick(team),
      content: pick(commentTexts),
    })
  }
  await admin.from("comments").insert(commentRows)

  const timeRows = []
  for (const project of projects) {
    const projectTasks = tasks.filter(() => Math.random() > 0.5).slice(0, 6)
    for (let i = 0; i < rand(5, 9); i++) {
      const user = pick(team)
      const days = rand(0, 20)
      const seconds = rand(1, 6) * 1800
      timeRows.push({
        tenant_id: tenantId,
        project_id: project.id,
        task_id: projectTasks.length ? pick(projectTasks).id : null,
        user_id: user,
        started_at: tsDaysAgo(days),
        ended_at: new Date(
          new Date(tsDaysAgo(days)).getTime() + seconds * 1000,
        ).toISOString(),
        duration_seconds: seconds,
        is_billable: Math.random() > 0.35,
        rate: rand(120, 240),
        billed: false,
        note: "Apontamento de demonstração.",
      })
    }
  }
  await admin.from("time_entries").insert(timeRows)

  const attachmentRows = []
  const projectFiles = [
    {
      name: "briefing.txt",
      content: "Briefing de demonstração do projeto Orbit CRM.",
    },
    { name: "proposta.txt", content: "Proposta comercial de exemplo." },
  ]
  for (const project of projects.slice(0, 4)) {
    for (const file of projectFiles) {
      const path = `${tenantId}/project/${project.id}/${crypto.randomUUID()}-${file.name}`
      const body = Buffer.from(file.content, "utf8")
      const { error } = await admin.storage
        .from("attachments")
        .upload(path, body, { contentType: "text/plain", upsert: true })
      if (error) continue
      attachmentRows.push({
        tenant_id: tenantId,
        entity_type: "project",
        entity_id: project.id,
        storage_path: path,
        file_name: file.name,
        mime_type: "text/plain",
        size_bytes: body.length,
        uploaded_by: pick(team),
      })
    }
  }
  for (const task of tasks.slice(0, 6)) {
    const name = "checklist-tecnico.txt"
    const path = `${tenantId}/task/${task.id}/${crypto.randomUUID()}-${name}`
    const body = Buffer.from("Checklist técnico de demonstração.", "utf8")
    const { error } = await admin.storage
      .from("attachments")
      .upload(path, body, { contentType: "text/plain", upsert: true })
    if (error) continue
    attachmentRows.push({
      tenant_id: tenantId,
      entity_type: "task",
      entity_id: task.id,
      storage_path: path,
      file_name: name,
      mime_type: "text/plain",
      size_bytes: body.length,
      uploaded_by: pick(team),
    })
  }
  if (attachmentRows.length > 0) {
    await admin.from("attachments").insert(attachmentRows)
  }

  const estimateSeed = [
    { status: 2, amount: 1.0 },
    { status: 4, amount: 1.2 },
    { status: 1, amount: 0.8 },
  ]
  let estimateNumber = 1
  const { data: maxEstimate } = await admin
    .from("estimates")
    .select("number")
    .order("number", { ascending: false })
    .limit(1)
  if (maxEstimate?.[0]) estimateNumber = maxEstimate[0].number + 1

  for (let i = 0; i < estimateSeed.length; i++) {
    const project = projects[i % projects.length]
    const items = [
      {
        description: "Horas de desenvolvimento",
        qty: rand(20, 60),
        rate: rand(150, 220),
      },
      { description: "Design e UX", qty: rand(10, 30), rate: rand(130, 200) },
    ]
    const subtotal = items.reduce((sum, it) => sum + it.qty * it.rate, 0)
    const number = estimateNumber + i
    const { data: estimate } = await admin
      .from("estimates")
      .insert({
        tenant_id: tenantId,
        company_id: project.id
          ? projectRows[i % projectRows.length].company_id
          : null,
        project_id: project.id,
        number,
        prefix: "EST-",
        formatted_number: `EST-${String(number).padStart(6, "0")}`,
        status: estimateSeed[i].status,
        date: daysFromNow(-rand(5, 30)),
        expiry_date: daysFromNow(rand(5, 30)),
        currency: "BRL",
        subtotal,
        total: subtotal,
        created_by: ownerId,
      })
      .select("id")
      .single()

    await admin.from("document_items").insert(
      items.map((it, index) => ({
        tenant_id: tenantId,
        rel_type: "estimate",
        rel_id: estimate.id,
        description: it.description,
        qty: it.qty,
        rate: it.rate,
        position: index,
      })),
    )
  }

  let invoiceNumber = 1
  const { data: maxInvoice } = await admin
    .from("invoices")
    .select("number")
    .order("number", { ascending: false })
    .limit(1)
  if (maxInvoice?.[0]) invoiceNumber = maxInvoice[0].number + 1

  const invoiceSeed = [
    { status: 2, paidRatio: 1, due: 10 },
    { status: 3, paidRatio: 0.5, due: 15 },
    { status: 1, paidRatio: 0, due: -5 },
    { status: 1, paidRatio: 0, due: 20 },
  ]

  for (let i = 0; i < invoiceSeed.length; i++) {
    const project = projects[i % projects.length]
    const items = [
      {
        description: "Serviços do projeto",
        qty: rand(10, 40),
        rate: rand(150, 220),
      },
      {
        description: "Licenças e infraestrutura",
        qty: rand(1, 5),
        rate: rand(300, 900),
      },
    ]
    const subtotal = items.reduce((sum, it) => sum + it.qty * it.rate, 0)
    const number = invoiceNumber + i
    const { data: invoice } = await admin
      .from("invoices")
      .insert({
        tenant_id: tenantId,
        company_id: projectRows[i % projectRows.length].company_id,
        project_id: project.id,
        number,
        prefix: "INV-",
        formatted_number: `INV-${String(number).padStart(6, "0")}`,
        status: invoiceSeed[i].status,
        date: daysFromNow(-rand(10, 40)),
        due_date: daysFromNow(invoiceSeed[i].due),
        currency: "BRL",
        subtotal,
        total: subtotal,
        created_by: ownerId,
      })
      .select("id")
      .single()

    await admin.from("document_items").insert(
      items.map((it, index) => ({
        tenant_id: tenantId,
        rel_type: "invoice",
        rel_id: invoice.id,
        description: it.description,
        qty: it.qty,
        rate: it.rate,
        position: index,
      })),
    )

    if (invoiceSeed[i].paidRatio > 0) {
      await admin.from("payments").insert({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        amount: Math.round(subtotal * invoiceSeed[i].paidRatio * 100) / 100,
        payment_mode: pick(["Pix", "Transferência", "Boleto", "Cartão"]),
        payment_date: daysFromNow(-rand(1, 8)),
        created_by: ownerId,
      })
    }
  }

  const departmentNames = [
    "Suporte Técnico",
    "Comercial",
    "Financeiro",
    "Desenvolvimento",
    "Customer Success",
  ]
  const { data: departments } = await admin
    .from("departments")
    .insert(departmentNames.map((name) => ({ tenant_id: tenantId, name })))
    .select("id, name")

  const ticketSubjects = [
    "Erro ao gerar boleto",
    "Dúvida sobre a fatura de maio",
    "Solicitação de novo usuário",
    "Sistema lento pela manhã",
    "Bug no relatório de horas",
    "Integração com API falhando",
    "Pedido de orçamento adicional",
    "Dados incorretos no cadastro",
    "Ajuste de plano",
    "Erro 500 ao salvar projeto",
    "Solicitação de treinamento",
    "Problema no login do portal",
  ]
  const ticketRows = ticketSubjects.map((subject, index) => {
    const number = index + 1
    return {
      tenant_id: tenantId,
      number,
      formatted_number: `TCK-${String(number).padStart(6, "0")}`,
      subject,
      details:
        "Ticket de demonstração gerado automaticamente para o Orbit CRM.",
      status: pick([1, 1, 2, 3, 3, 4, 5]),
      priority: pick([1, 2, 2, 3, 4]),
      type: pick([1, 2, 3, 4]),
      department_id:
        departments && departments.length ? pick(departments).id : null,
      company_id: companies[index % companies.length].id,
      assignee_id: pick(team),
      project_id:
        Math.random() > 0.5 ? projects[index % projects.length].id : null,
      source: "staff",
      created_by: ownerId,
    }
  })
  const { data: tickets } = await admin
    .from("tickets")
    .insert(ticketRows)
    .select("id")
  await admin
    .from("tenants")
    .update({ next_ticket_number: ticketRows.length + 1 })
    .eq("id", tenantId)

  const replyTexts = [
    "Estamos analisando o caso, retornamos em breve.",
    "Poderia nos enviar um print da tela?",
    "Ajuste aplicado. Pode validar, por favor?",
    "Encaminhei para o time responsável.",
  ]
  const replyRows = []
  for (const ticket of (tickets ?? []).slice(0, 10)) {
    const count = rand(1, 3)
    for (let i = 0; i < count; i++) {
      replyRows.push({
        tenant_id: tenantId,
        ticket_id: ticket.id,
        author_id: pick(team),
        body: pick(replyTexts),
        is_internal: Math.random() > 0.7,
      })
    }
  }
  if (replyRows.length > 0) {
    await admin.from("ticket_replies").insert(replyRows)
  }

  const ticketAttachmentRows = []
  for (const ticket of (tickets ?? []).slice(0, 4)) {
    const name = "print-erro.txt"
    const path = `${tenantId}/ticket/${ticket.id}/${crypto.randomUUID()}-${name}`
    const body = Buffer.from("Anexo de demonstração do ticket.", "utf8")
    const { error } = await admin.storage
      .from("attachments")
      .upload(path, body, { contentType: "text/plain", upsert: true })
    if (error) continue
    ticketAttachmentRows.push({
      tenant_id: tenantId,
      entity_type: "ticket",
      entity_id: ticket.id,
      storage_path: path,
      file_name: name,
      mime_type: "text/plain",
      size_bytes: body.length,
      uploaded_by: pick(team),
    })
  }
  if (ticketAttachmentRows.length > 0) {
    await admin.from("attachments").insert(ticketAttachmentRows)
  }

  const kbCategories = [
    {
      name: "Primeiros passos",
      description: "Como começar a usar o Orbit CRM.",
    },
    { name: "Financeiro", description: "Orçamentos, faturas e pagamentos." },
    { name: "Suporte", description: "Abertura e acompanhamento de tickets." },
  ]
  const { data: kbCats } = await admin
    .from("kb_categories")
    .insert(
      kbCategories.map((category, index) => ({
        tenant_id: tenantId,
        name: category.name,
        description: category.description,
        position: index,
      })),
    )
    .select("id, name")
  const catIdByName = new Map((kbCats ?? []).map((c) => [c.name, c.id]))

  const articles = [
    {
      title: "Como criar seu primeiro projeto",
      cat: "Primeiros passos",
      excerpt:
        "Passo a passo para criar projetos, tarefas e convidar a equipe.",
      content:
        "1. Vá em Projetos e clique em Novo projeto.\n2. Escolha o cliente e defina prazos e orçamento.\n3. Adicione a equipe e crie as tarefas.\n4. Acompanhe o progresso pela visão geral.",
    },
    {
      title: "Entendendo orçamentos e faturas",
      cat: "Financeiro",
      excerpt: "Do orçamento à fatura, e como registrar pagamentos.",
      content:
        "Crie um orçamento com itens e converta em fatura com um clique. Registre pagamentos e acompanhe o valor em aberto de cada cliente.",
    },
    {
      title: "Registrando horas de trabalho",
      cat: "Primeiros passos",
      excerpt: "Use o timer ou lance horas manualmente no Timesheet.",
      content:
        "No Timesheet, inicie o timer escolhendo projeto e tarefa. Para lançamentos retroativos, use o Lançamento manual. Marque como faturável para gerar faturas das horas.",
    },
    {
      title: "Abrindo um ticket de suporte",
      cat: "Suporte",
      excerpt: "Como registrar e acompanhar chamados de suporte.",
      content:
        "Em Tickets, clique em Novo ticket, descreva o problema e defina prioridade e responsável. Acompanhe a conversa e anexe arquivos.",
    },
    {
      title: "Como o cliente acessa o portal",
      cat: "Suporte",
      excerpt: "Convide um contato para o portal do cliente.",
      content:
        "No cadastro do cliente, abra o contato e clique em Dar acesso. Defina uma senha e compartilhe o acesso ao Portal do cliente.",
    },
  ]
  const articleRows = articles.map((article) => ({
    tenant_id: tenantId,
    title: article.title,
    slug: slugify(article.title),
    category_id: catIdByName.get(article.cat) ?? null,
    excerpt: article.excerpt,
    content: article.content,
    is_published: true,
    views: rand(5, 140),
    author_id: ownerId,
  }))
  await admin.from("kb_articles").insert(articleRows)

  const faqRows = [
    {
      question: "Como redefinir minha senha do portal?",
      answer:
        "Na tela de login do portal, use a opção de recuperação ou fale com o suporte.",
    },
    {
      question: "Quais formas de pagamento são aceitas?",
      answer: "Pix, transferência, boleto e cartão de crédito.",
    },
    {
      question: "Como acompanho o andamento do meu projeto?",
      answer:
        "Acesse o Portal do cliente e abra a aba Projetos para ver progresso e tarefas.",
    },
  ]
  await admin.from("faqs").insert(
    faqRows.map((faq, index) => ({
      tenant_id: tenantId,
      question: faq.question,
      answer: faq.answer,
      position: index,
      is_published: true,
    })),
  )

  return {
    companies: companies.length,
    contacts: contactRows.length,
    projects: projects.length,
    tasks: tasks.length,
    timeEntries: timeRows.length,
    tickets: (tickets ?? []).length,
    kbArticles: articleRows.length,
    faqs: faqRows.length,
    users: demoUsers.length,
  }
}

const tenantId = await getTenantId()
const summary = await seed(tenantId)
console.log("Seed concluído:", summary)
console.log(`Usuários de demo (senha: ${DEMO_PASSWORD}):`)
for (const u of demoUsers) console.log(`  - ${u.email}`)
