import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
} from "pdf-lib"
import { formatDate, formatDateTime } from "@/lib/format"
import { embedLogo, hexToRgb } from "./pdf"
import type { ContractView } from "./contract-view"

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024

export function contractFileName(view: ContractView): string {
  const slug = view.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return `Contrato-${slug || view.id.slice(0, 8)}.pdf`
}

function isStorageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  if (!base) return false
  return url.startsWith(`${base}/storage/v1/object/`)
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

async function embedSignature(
  doc: PDFDocument,
  url: string | null,
): Promise<PDFImage | null> {
  if (!url || !isStorageUrl(url)) return null
  try {
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    const bytes = await readCapped(response, SIGNATURE_MAX_BYTES)
    if (!bytes) return null
    return await doc.embedPng(bytes)
  } catch {
    return null
  }
}

/**
 * PDF do contrato: cabeçalho da empresa, corpo (congelado quando assinado) e
 * bloco de assinatura com imagem, dados do aceite e hash de integridade.
 */
export async function renderContractPdf(
  view: ContractView,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const primary = hexToRgb(view.tenant.primaryColor)
  const dark = rgb(0.1, 0.12, 0.16)
  const gray = rgb(0.4, 0.44, 0.52)
  doc.setTitle(`Contrato ${view.title}`)

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
  textRight("CONTRATO", PAGE_WIDTH - MARGIN, {
    size: 18,
    font: bold,
    color: primary,
  })
  y -= 18
  for (const value of wrap(view.title, bold, 11, 260)) {
    textRight(value, PAGE_WIDTH - MARGIN, { size: 11, font: bold })
    y -= 14
  }
  y -= 2
  if (view.startDate) {
    y -= 13
    textRight(`Início: ${formatDate(view.startDate)}`, PAGE_WIDTH - MARGIN, {
      color: gray,
    })
  }
  if (view.endDate) {
    y -= 13
    textRight(`Término: ${formatDate(view.endDate)}`, PAGE_WIDTH - MARGIN, {
      color: gray,
    })
  }
  y = Math.min(y, top - 70) - 20

  if (view.company) {
    text("CONTRATANTE", MARGIN, { size: 8, font: bold, color: gray })
    y -= 14
    text(view.company.name, MARGIN, { size: 11, font: bold })
    const details = [
      view.company.vat ? `CNPJ/CPF: ${view.company.vat}` : null,
      view.company.address,
      [view.company.city, view.company.state].filter(Boolean).join(" - ") ||
        null,
    ].filter((value): value is string => Boolean(value))
    for (const detail of details) {
      y -= 13
      text(detail, MARGIN, { color: gray })
    }
    y -= 26
  }

  y -= 4
  for (const line of wrap(view.body, regular, 10, CONTENT_WIDTH)) {
    ensure(14)
    text(line, MARGIN)
    y -= 14
  }
  y -= 16

  // Bloco de assinatura
  ensure(150)
  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: CONTENT_WIDTH,
    height: 20,
    color: rgb(0.96, 0.97, 0.98),
  })
  text(
    view.signedAt ? "ASSINADO ELETRONICAMENTE" : "ASSINATURA DO CONTRATANTE",
    MARGIN + 6,
    { size: 9, font: bold, color: gray },
  )
  y -= 30

  if (view.signedAt) {
    const signature = await embedSignature(doc, view.signatureUrl)
    if (signature) {
      const scale = Math.min(70 / signature.height, 240 / signature.width)
      ensure(signature.height * scale + 10)
      page.drawImage(signature, {
        x: MARGIN,
        y: y - signature.height * scale,
        width: signature.width * scale,
        height: signature.height * scale,
      })
      y -= signature.height * scale + 8
    }
    const signer = [view.acceptance?.firstname, view.acceptance?.lastname]
      .filter(Boolean)
      .join(" ")
    const details = [
      signer || null,
      view.acceptance?.email,
      view.signedAt ? formatDateTime(view.signedAt) : null,
      view.acceptance?.ip ? `IP ${view.acceptance.ip}` : null,
    ].filter((value): value is string => Boolean(value))
    for (const detail of details) {
      ensure(14)
      text(detail, MARGIN, { color: gray })
      y -= 13
    }
    if (view.acceptance?.hash) {
      ensure(14)
      text(`Integridade SHA-256: ${view.acceptance.hash}`, MARGIN, {
        size: 8,
        color: gray,
      })
      y -= 12
    }
  } else {
    page.drawLine({
      start: { x: MARGIN, y: y - 28 },
      end: { x: MARGIN + 220, y: y - 28 },
      thickness: 0.7,
      color: gray,
    })
    y -= 40
    text("Nome e assinatura", MARGIN, { size: 8, color: gray })
    y -= 14
    text("Data: ____ / ____ / ______", MARGIN, { size: 8, color: gray })
  }

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

export async function contractPdfResponse(
  view: ContractView,
): Promise<Response> {
  const bytes = await renderContractPdf(view)
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${contractFileName(view)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
