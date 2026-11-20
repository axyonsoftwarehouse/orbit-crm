import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
} from "pdf-lib"
import { formatDate, formatMoney } from "@/lib/format"
import type { DocumentView } from "./load"

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const LABELS = {
  estimate: { title: "ORÇAMENTO", due: "Validade", file: "Orcamento" },
  invoice: { title: "FATURA", due: "Vencimento", file: "Fatura" },
} as const

export function documentFileName(view: DocumentView): string {
  const number = view.number.replace(/[^A-Za-z0-9._-]/g, "_")
  return `${LABELS[view.kind].file}-${number}.pdf`
}

function hexToRgb(hex: string | null) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex ?? "")
  if (!match) return rgb(0, 0.38, 1)
  const value = parseInt(match[1], 16)
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  )
}

/** Logo do tenant (PNG ou JPEG pela URL pública); qualquer falha é ignorada. */
const LOGO_MAX_BYTES = 2 * 1024 * 1024

/**
 * Só aceita logos do bucket público `branding` do próprio Supabase:
 * `logo_url` pode ser alterado pelo tenant, e buscar qualquer URL no servidor
 * abriria SSRF (rede interna, metadados de nuvem).
 */
function isBrandingUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  if (!base) return false
  return url.startsWith(`${base}/storage/v1/object/public/branding/`)
}

async function readCapped(response: Response, max: number) {
  const declared = Number(response.headers.get("content-length") ?? 0)
  if (declared > max) return null
  const reader = response.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

async function embedLogo(doc: PDFDocument, url: string | null) {
  if (!url || !isBrandingUrl(url)) return null
  try {
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    const bytes = await readCapped(response, LOGO_MAX_BYTES)
    if (!bytes) return null
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes)
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes)
    return null
  } catch {
    return null
  }
}

/**
 * Gera o PDF do orçamento ou da fatura. Usa as fontes padrão (WinAnsi):
 * caracteres que elas não codificam (emoji etc.) viram "?" em vez de quebrar.
 */
export async function renderDocumentPdf(
  view: DocumentView,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const primary = hexToRgb(view.tenant.primaryColor)
  const dark = rgb(0.1, 0.12, 0.16)
  const gray = rgb(0.4, 0.44, 0.52)
  const line = rgb(0.88, 0.9, 0.93)
  const money = (value: number) => formatMoney(value, view.currency)
  const labels = LABELS[view.kind]
  doc.setTitle(`${labels.title} ${view.number}`)

  const encodable = new Map<string, boolean>()
  function safe(text: string) {
    let out = ""
    for (const char of text.replace(/\r/g, "")) {
      if (char === "\n") {
        out += char
        continue
      }
      let ok = encodable.get(char)
      if (ok === undefined) {
        try {
          regular.encodeText(char)
          ok = true
        } catch {
          ok = false
        }
        encodable.set(char, ok)
      }
      out += ok ? char : "?"
    }
    return out
  }

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function newPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }
  function ensure(height: number) {
    if (y - height < MARGIN + 24) newPage()
  }
  function wrap(text: string, font: PDFFont, size: number, width: number) {
    const lines: string[] = []
    for (const paragraph of safe(text).split("\n")) {
      let current = ""
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = current ? `${current} ${word}` : word
        if (font.widthOfTextAtSize(candidate, size) <= width)
          current = candidate
        else {
          if (current) lines.push(current)
          current = word
        }
      }
      lines.push(current)
    }
    return lines
  }
  function text(
    value: string,
    x: number,
    options: {
      size?: number
      font?: PDFFont
      color?: ReturnType<typeof rgb>
    } = {},
  ) {
    page.drawText(safe(value), {
      x,
      y,
      size: options.size ?? 10,
      font: options.font ?? regular,
      color: options.color ?? dark,
    })
  }
  function textRight(
    value: string,
    right: number,
    options: {
      size?: number
      font?: PDFFont
      color?: ReturnType<typeof rgb>
    } = {},
  ) {
    const font = options.font ?? regular
    const size = options.size ?? 10
    text(value, right - font.widthOfTextAtSize(safe(value), size), options)
  }

  // Cabeçalho: logo e nome da agência à esquerda; tipo, número e datas à direita.
  const logo: PDFImage | null = await embedLogo(doc, view.tenant.logoUrl)
  const top = y
  if (logo) {
    const scale = Math.min(40 / logo.height, 140 / logo.width)
    page.drawImage(logo, {
      x: MARGIN,
      y: top - logo.height * scale,
      width: logo.width * scale,
      height: logo.height * scale,
    })
    y = top - logo.height * scale - 14
  } else {
    y = top - 14
  }
  text(view.tenant.name, MARGIN, { size: 12, font: bold })

  y = top - 16
  textRight(labels.title, PAGE_WIDTH - MARGIN, {
    size: 18,
    font: bold,
    color: primary,
  })
  y -= 18
  textRight(view.number, PAGE_WIDTH - MARGIN, { size: 11, font: bold })
  y -= 15
  textRight(`Data: ${formatDate(view.date)}`, PAGE_WIDTH - MARGIN, {
    color: gray,
  })
  if (view.dueOrExpiry) {
    y -= 13
    textRight(
      `${labels.due}: ${formatDate(view.dueOrExpiry)}`,
      PAGE_WIDTH - MARGIN,
      {
        color: gray,
      },
    )
  }
  y = Math.min(y, top - 70) - 20

  // Cliente
  if (view.company) {
    text("PARA", MARGIN, { size: 8, font: bold, color: gray })
    y -= 14
    text(view.company.name, MARGIN, { size: 11, font: bold })
    const details = [
      view.company.vat ? `CNPJ/CPF: ${view.company.vat}` : null,
      view.company.address,
      [view.company.city, view.company.state].filter(Boolean).join(" - ") ||
        null,
      [view.company.zip, view.company.country].filter(Boolean).join(" · ") ||
        null,
    ].filter((value): value is string => Boolean(value))
    for (const detail of details) {
      y -= 13
      text(detail, MARGIN, { color: gray })
    }
    y -= 26
  }

  // Itens
  const hasTax = view.items.some((item) => Number(item.tax_rate ?? 0) > 0)
  const columns = {
    qty: PAGE_WIDTH - MARGIN - (hasTax ? 250 : 190),
    rate: PAGE_WIDTH - MARGIN - (hasTax ? 160 : 100),
    tax: PAGE_WIDTH - MARGIN - 90,
    total: PAGE_WIDTH - MARGIN,
  }
  const descWidth = columns.qty - MARGIN - 40

  ensure(40)
  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: CONTENT_WIDTH,
    height: 20,
    color: rgb(0.96, 0.97, 0.98),
  })
  text("Descrição", MARGIN + 6, { size: 9, font: bold, color: gray })
  textRight("Qtd", columns.qty, { size: 9, font: bold, color: gray })
  textRight("Valor", columns.rate, { size: 9, font: bold, color: gray })
  if (hasTax)
    textRight("Imposto", columns.tax, { size: 9, font: bold, color: gray })
  textRight("Total", columns.total - 6, { size: 9, font: bold, color: gray })
  y -= 22

  if (view.items.length === 0) {
    text("Nenhum item.", MARGIN + 6, { color: gray })
    y -= 18
  }
  for (const item of view.items) {
    const lines = wrap(item.description, regular, 10, descWidth)
    ensure(lines.length * 13 + 10)
    const rowTop = y
    lines.forEach((value, index) => {
      y = rowTop - index * 13
      text(value, MARGIN + 6)
    })
    y = rowTop
    textRight(String(Number(item.qty)), columns.qty)
    textRight(money(Number(item.rate)), columns.rate)
    if (hasTax) {
      textRight(item.tax_rate ? `${Number(item.tax_rate)}%` : "—", columns.tax)
    }
    textRight(money(Number(item.qty) * Number(item.rate)), columns.total - 6)
    y = rowTop - lines.length * 13 - 6
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 4 },
      thickness: 0.5,
      color: line,
    })
    y -= 8
  }

  // Totais
  const rows: [string, string, boolean][] = [
    ["Subtotal", money(view.subtotal), false],
  ]
  if (view.discountTotal > 0)
    rows.push(["Desconto", `- ${money(view.discountTotal)}`, false])
  if (view.totalTax > 0) rows.push(["Impostos", money(view.totalTax), false])
  if (view.adjustment !== 0)
    rows.push(["Ajuste", money(view.adjustment), false])
  rows.push(["Total", money(view.total), true])
  if (view.kind === "invoice") {
    rows.push(["Pago", money(view.paid), false])
    rows.push(["Em aberto", money(Math.max(0, view.total - view.paid)), true])
  }
  ensure(rows.length * 16 + 10)
  y -= 6
  for (const [label, value, strong] of rows) {
    const font = strong ? bold : regular
    textRight(label, PAGE_WIDTH - MARGIN - 110, {
      font,
      color: strong ? dark : gray,
    })
    textRight(value, PAGE_WIDTH - MARGIN - 6, { font, size: strong ? 11 : 10 })
    y -= 16
  }

  // Observações e termos
  for (const [title, body] of [
    ["Observações", view.clientNote],
    ["Termos", view.terms],
  ] as const) {
    if (!body) continue
    y -= 14
    ensure(30)
    text(title.toUpperCase(), MARGIN, { size: 8, font: bold, color: gray })
    y -= 14
    for (const value of wrap(body, regular, 10, CONTENT_WIDTH)) {
      ensure(14)
      text(value, MARGIN)
      y -= 13
    }
  }

  // Rodapé em todas as páginas
  for (const current of doc.getPages()) {
    current.drawText(safe(`${view.tenant.name} · gerado pelo Orbit CRM`), {
      x: MARGIN,
      y: MARGIN - 20,
      size: 8,
      font: regular,
      color: gray,
    })
  }

  return doc.save()
}

/** Resposta HTTP com o PDF para download. */
export async function pdfResponse(view: DocumentView): Promise<Response> {
  const bytes = await renderDocumentPdf(view)
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${documentFileName(view)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
