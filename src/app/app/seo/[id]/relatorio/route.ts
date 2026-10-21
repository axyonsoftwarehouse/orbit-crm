import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { getLatestSeoAudit, getSeoSite } from "@/server/queries/seo"
import type { SeoCheckCategory } from "@/server/seo/audit"

export const dynamic = "force-dynamic"

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const CATEGORIES: SeoCheckCategory[] = [
  "Conteúdo",
  "Técnico",
  "Performance",
  "Segurança",
  "Social",
]

function hexToRgb(hex: string | null) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex ?? "")
  if (!match) return rgb(0, 0.384, 1)
  const value = Number.parseInt(match[1], 16)
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  )
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "site"
  )
}

type TextOptions = {
  size?: number
  bold?: boolean
  color?: ReturnType<typeof rgb>
  lineHeight?: number
  indent?: number
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) {
    return new Response("Não autorizado", { status: 401 })
  }

  const { id } = await params
  const site = await getSeoSite(active.tenantId, id)
  if (!site) {
    return new Response("Site não encontrado", { status: 404 })
  }

  const audit = await getLatestSeoAudit(active.tenantId, site.id)
  if (!audit?.result || audit.status !== 2) {
    return new Response("Relatório indisponível", { status: 404 })
  }

  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const primary = hexToRgb(active.tenant.primaryColor)
  const gray = rgb(0.38, 0.42, 0.5)
  const dark = rgb(0.1, 0.12, 0.16)
  const red = rgb(0.74, 0.12, 0.2)
  const amber = rgb(0.72, 0.45, 0.02)
  const green = rgb(0.05, 0.55, 0.32)

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function newPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }

  function wrap(text: string, font: typeof regular, size: number) {
    const lines: string[] = []
    for (const paragraph of text.split("\n")) {
      const words = paragraph.split(/\s+/).filter(Boolean)
      let line = ""
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(candidate, size) <= CONTENT_WIDTH) {
          line = candidate
        } else {
          if (line) lines.push(line)
          line = word
        }
      }
      if (line) lines.push(line)
    }
    return lines
  }

  function drawText(text: string, options: TextOptions = {}) {
    const size = options.size ?? 10
    const font = options.bold ? bold : regular
    const color = options.color ?? dark
    const lineHeight = options.lineHeight ?? 1.35
    const indent = options.indent ?? 0
    const lines = wrap(text, font, size)
    for (const line of lines) {
      if (y - size * lineHeight < MARGIN + 20) newPage()
      page.drawText(line, {
        x: MARGIN + indent,
        y,
        size,
        font,
        color,
      })
      y -= size * lineHeight
    }
  }

  function ensureSpace(height: number) {
    if (y - height < MARGIN + 20) newPage()
  }

  doc.setTitle(`Relatório SEO — ${site.label}`)
  doc.setAuthor(active.tenant.name)
  doc.setSubject("Auditoria SEO")

  // Cabeçalho white-label
  page.drawText(active.tenant.name, {
    x: MARGIN,
    y,
    size: 16,
    font: bold,
    color: primary,
  })
  y -= 22
  page.drawText("Relatório de Auditoria SEO", {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: gray,
  })
  y -= 18
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.93),
  })
  y -= 26

  drawText(site.label, { size: 20, bold: true })
  drawText(site.url, { size: 9, color: gray })
  drawText(
    `Auditoria concluída em ${new Date(audit.created_at).toLocaleString("pt-BR")}`,
    { size: 9, color: gray },
  )
  y -= 8

  // Score
  ensureSpace(90)
  page.drawRectangle({
    x: MARGIN,
    y: y - 70,
    width: CONTENT_WIDTH,
    height: 78,
    color: rgb(0.97, 0.98, 1),
    borderColor: rgb(0.88, 0.9, 0.93),
    borderWidth: 1,
  })
  page.drawText(String(audit.score ?? 0), {
    x: MARGIN + 18,
    y: y - 48,
    size: 38,
    font: bold,
    color: primary,
  })
  page.drawText("de 100", {
    x: MARGIN + 86,
    y: y - 38,
    size: 9,
    font: regular,
    color: gray,
  })
  page.drawText(
    `${audit.checks_total} verificações · ${audit.issues_total} problema(s)`,
    {
      x: MARGIN + 160,
      y: y - 24,
      size: 11,
      font: bold,
      color: dark,
    },
  )
  page.drawText(
    `${audit.major_issues} crítico(s) · ${audit.moderate_issues} moderado(s) · ${audit.minor_issues} leve(s)`,
    {
      x: MARGIN + 160,
      y: y - 42,
      size: 9,
      font: regular,
      color: gray,
    },
  )
  y -= 96

  // Resumo com IA
  if (audit.ai_summary) {
    ensureSpace(40)
    drawText("Resumo com IA", { size: 14, bold: true, color: primary })
    y -= 2
    drawText(audit.ai_summary, { size: 10, color: dark })
    y -= 10
  }

  // Problemas
  const issues = audit.result.checks.filter((check) => check.status !== "pass")
  drawText("Problemas encontrados", {
    size: 14,
    bold: true,
    color: primary,
  })
  y -= 4

  if (issues.length === 0) {
    drawText("Nenhum problema encontrado nesta auditoria.", {
      size: 10,
      color: green,
    })
  } else {
    for (const category of CATEGORIES) {
      const categoryIssues = issues.filter(
        (check) => check.category === category,
      )
      if (categoryIssues.length === 0) continue

      ensureSpace(45)
      drawText(category, { size: 11, bold: true, color: dark })
      for (const check of categoryIssues) {
        ensureSpace(40)
        drawText(
          `${check.label} — ${check.status === "fail" ? "falha" : "atenção"}`,
          {
            size: 10,
            bold: true,
            color: check.status === "fail" ? red : amber,
          },
        )
        drawText(check.message, { size: 9, color: gray, indent: 12 })
        y -= 4
      }
      y -= 4
    }
  }

  // Rodapé
  const pages = doc.getPages()
  pages.forEach((current, index) => {
    current.drawText(
      `Gerado por ${active.tenant.name} · ${new Date().toLocaleDateString("pt-BR")}`,
      {
        x: MARGIN,
        y: 24,
        size: 8,
        font: regular,
        color: gray,
      },
    )
    current.drawText(`Página ${index + 1} de ${pages.length}`, {
      x: PAGE_WIDTH - MARGIN - 72,
      y: 24,
      size: 8,
      font: regular,
      color: gray,
    })
  })

  const bytes = await doc.save()
  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="seo-${slugify(site.label)}-${stamp}.pdf"`,
    },
  })
}
