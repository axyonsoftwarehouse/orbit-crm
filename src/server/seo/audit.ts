import { parse, type HTMLElement } from "node-html-parser"
import { fetchHtml, type FetchedPage } from "./fetch-page"

export type SeoCheckStatus = "pass" | "warn" | "fail"
export type SeoCheckSeverity = "major" | "moderate" | "minor"
export type SeoCheckCategory =
  "Conteúdo" | "Técnico" | "Performance" | "Segurança" | "Social"

export type SeoCheck = {
  id: string
  category: SeoCheckCategory
  label: string
  severity: SeoCheckSeverity
  status: SeoCheckStatus
  message: string
  details?: string
}

export type SeoAuditSummary = {
  score: number
  checksTotal: number
  passed: number
  warnings: number
  failed: number
  majorIssues: number
  moderateIssues: number
  minorIssues: number
  issuesTotal: number
}

export type SeoAuditResult = {
  version: 1
  url: string
  finalUrl: string
  statusCode: number
  fetchedAt: string
  responseTimeMs: number
  pageSizeBytes: number
  checks: SeoCheck[]
  summary: SeoAuditSummary
}

const WEIGHTS: Record<SeoCheckSeverity, number> = {
  major: 4,
  moderate: 2,
  minor: 1,
}

function check(
  id: string,
  category: SeoCheckCategory,
  label: string,
  severity: SeoCheckSeverity,
  status: SeoCheckStatus,
  message: string,
  details?: string,
): SeoCheck {
  return { id, category, label, severity, status, message, details }
}

function textOf(root: HTMLElement, selector: string): string {
  return root.querySelector(selector)?.text.trim() ?? ""
}

function metaContent(root: HTMLElement, key: string): string {
  const node = root.querySelector(
    `meta[name="${key}"], meta[property="${key}"]`,
  )
  return node?.getAttribute("content")?.trim() ?? ""
}

function lengthStatus(
  length: number,
  min: number,
  max: number,
  warnMin: number,
  warnMax: number,
): SeoCheckStatus {
  if (length >= min && length <= max) return "pass"
  if (length >= warnMin && length <= warnMax) return "warn"
  return "fail"
}

function getWordCount(root: HTMLElement): number {
  const textRoot = parse(root.toString())
  textRoot
    .querySelectorAll("script,style,noscript,svg")
    .forEach((element) => element.remove())
  const body = textRoot.querySelector("body") ?? textRoot
  const text = body.text.replace(/\s+/g, " ").trim()
  return text ? text.split(" ").filter(Boolean).length : 0
}

function getTextLength(root: HTMLElement): number {
  const textRoot = parse(root.toString())
  textRoot
    .querySelectorAll("script,style,noscript,svg")
    .forEach((element) => element.remove())
  const body = textRoot.querySelector("body") ?? textRoot
  return body.text.replace(/\s+/g, " ").trim().length
}

export function buildChecks(page: FetchedPage): SeoCheck[] {
  const root = parse(page.html)
  const checks: SeoCheck[] = []
  const finalUrl = new URL(page.finalUrl)
  const headers = page.headers

  checks.push(
    check(
      "status_code",
      "Técnico",
      "Status HTTP",
      "major",
      page.status >= 200 && page.status < 300 ? "pass" : "fail",
      page.status >= 200 && page.status < 300
        ? `A página respondeu com status ${page.status}.`
        : `A página respondeu com status ${page.status}.`,
    ),
  )

  checks.push(
    check(
      "https",
      "Segurança",
      "HTTPS",
      "major",
      finalUrl.protocol === "https:" ? "pass" : "fail",
      finalUrl.protocol === "https:"
        ? "A página é servida por HTTPS."
        : "A página não usa HTTPS.",
    ),
  )

  const title = textOf(root, "title")
  const titleLength = title.length
  const titleStatus = title ? lengthStatus(titleLength, 30, 60, 20, 70) : "fail"
  checks.push(
    check(
      "title",
      "Conteúdo",
      "Título",
      "major",
      titleStatus,
      title
        ? `Título com ${titleLength} caracteres.`
        : "A página não possui título.",
    ),
  )

  const description = metaContent(root, "description")
  const descriptionLength = description.length
  const descriptionStatus = description
    ? lengthStatus(descriptionLength, 50, 160, 30, 180)
    : "fail"
  checks.push(
    check(
      "meta_description",
      "Conteúdo",
      "Meta description",
      "major",
      descriptionStatus,
      description
        ? `Meta description com ${descriptionLength} caracteres.`
        : "A página não possui meta description.",
    ),
  )

  const h1s = root.querySelectorAll("h1")
  const h1Count = h1s.length
  checks.push(
    check(
      "h1",
      "Conteúdo",
      "H1",
      "major",
      h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn",
      h1Count === 1
        ? "A página possui exatamente um H1."
        : h1Count === 0
          ? "A página não possui H1."
          : `A página possui ${h1Count} H1s.`,
    ),
  )

  const canonical = root
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href")
    ?.trim()
  checks.push(
    check(
      "canonical",
      "Técnico",
      "Canonical",
      "moderate",
      canonical ? "pass" : "warn",
      canonical
        ? "A página declara uma URL canônica."
        : "A página não declara uma URL canônica.",
    ),
  )

  const robots = metaContent(root, "robots").toLowerCase()
  const noindex = robots.includes("noindex")
  checks.push(
    check(
      "meta_robots",
      "Técnico",
      "Meta robots",
      "major",
      noindex ? "fail" : "pass",
      noindex
        ? "A página está marcada como noindex."
        : "A página não bloqueia indexação.",
    ),
  )

  const html = root.querySelector("html")
  const language = html?.getAttribute("lang")?.trim()
  checks.push(
    check(
      "lang",
      "Técnico",
      "Idioma",
      "minor",
      language ? "pass" : "warn",
      language
        ? `Idioma declarado: ${language}.`
        : "A página não declara o atributo lang.",
    ),
  )

  const viewport = metaContent(root, "viewport")
  checks.push(
    check(
      "viewport",
      "Técnico",
      "Viewport",
      "moderate",
      viewport ? "pass" : "warn",
      viewport
        ? "A página declara viewport para dispositivos móveis."
        : "A página não declara viewport.",
    ),
  )

  const charset =
    root.querySelector("meta[charset]")?.getAttribute("charset") ??
    root
      .querySelector('meta[http-equiv="content-type"]')
      ?.getAttribute("content")
  checks.push(
    check(
      "charset",
      "Técnico",
      "Charset",
      "minor",
      charset ? "pass" : "warn",
      charset ? "A página declara charset." : "A página não declara charset.",
    ),
  )

  const hasDoctype = /<!doctype\s+html/i.test(page.html)
  checks.push(
    check(
      "doctype",
      "Técnico",
      "Doctype",
      "minor",
      hasDoctype ? "pass" : "warn",
      hasDoctype
        ? "A página declara doctype HTML."
        : "A página não declara doctype HTML.",
    ),
  )

  const favicon = root.querySelector(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
  )
  checks.push(
    check(
      "favicon",
      "Técnico",
      "Favicon",
      "minor",
      favicon ? "pass" : "warn",
      favicon
        ? "A página declara um favicon."
        : "A página não declara favicon.",
    ),
  )

  const images = root.querySelectorAll("img")
  const imagesWithAlt = images.filter((image) => {
    const alt = image.getAttribute("alt")
    return typeof alt === "string" && alt.trim().length > 0
  })
  const altCoverage =
    images.length > 0 ? imagesWithAlt.length / images.length : 1
  checks.push(
    check(
      "image_alt",
      "Conteúdo",
      "Alt das imagens",
      "moderate",
      images.length === 0 || altCoverage >= 0.8
        ? "pass"
        : altCoverage >= 0.5
          ? "warn"
          : "fail",
      images.length === 0
        ? "A página não possui imagens."
        : `${imagesWithAlt.length} de ${images.length} imagens possuem alt (${Math.round(altCoverage * 100)}%).`,
    ),
  )

  let internalLinks = 0
  let externalLinks = 0
  let unsafeTargetBlank = 0
  for (const anchor of root.querySelectorAll("a[href]")) {
    const href = anchor.getAttribute("href")?.trim() ?? ""
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue

    let link: URL
    try {
      link = new URL(href, page.finalUrl)
    } catch {
      continue
    }

    if (link.protocol !== "http:" && link.protocol !== "https:") continue

    const external = link.hostname !== finalUrl.hostname
    if (external) {
      externalLinks += 1
      const target = anchor.getAttribute("target")
      const rel = (anchor.getAttribute("rel") ?? "").toLowerCase()
      if (
        target === "_blank" &&
        !rel.includes("noopener") &&
        !rel.includes("noreferrer")
      ) {
        unsafeTargetBlank += 1
      }
    } else {
      internalLinks += 1
    }
  }

  checks.push(
    check(
      "internal_links",
      "Conteúdo",
      "Links internos",
      "moderate",
      internalLinks > 0 ? "pass" : "warn",
      internalLinks > 0
        ? `${internalLinks} link(s) interno(s) encontrados.`
        : "A página não possui links internos.",
    ),
  )

  checks.push(
    check(
      "external_links",
      "Conteúdo",
      "Links externos",
      "minor",
      externalLinks > 0 ? "pass" : "warn",
      externalLinks > 0
        ? `${externalLinks} link(s) externo(s) encontrados.`
        : "A página não possui links externos.",
    ),
  )

  checks.push(
    check(
      "unsafe_target_blank",
      "Segurança",
      "Links com target=_blank",
      "moderate",
      unsafeTargetBlank === 0 ? "pass" : "warn",
      unsafeTargetBlank === 0
        ? "Nenhum link externo inseguro encontrado."
        : `${unsafeTargetBlank} link(s) externo(s) com target=_blank sem noopener/noreferrer.`,
    ),
  )

  const deprecated = root.querySelectorAll("font, center, marquee, big").length
  checks.push(
    check(
      "deprecated_tags",
      "Técnico",
      "Tags obsoletas",
      "minor",
      deprecated === 0 ? "pass" : "warn",
      deprecated === 0
        ? "Nenhuma tag HTML obsoleta encontrada."
        : `${deprecated} tag(s) HTML obsoleta(s) encontrada(s).`,
    ),
  )

  const words = getWordCount(root)
  checks.push(
    check(
      "word_count",
      "Conteúdo",
      "Quantidade de palavras",
      "moderate",
      words >= 300 ? "pass" : words >= 100 ? "warn" : "fail",
      `A página possui aproximadamente ${words} palavra(s).`,
    ),
  )

  const textLength = getTextLength(root)
  const textRatio = page.html.length > 0 ? textLength / page.html.length : 0
  checks.push(
    check(
      "text_html_ratio",
      "Conteúdo",
      "Proporção texto/HTML",
      "minor",
      textRatio >= 0.1 ? "pass" : textRatio >= 0.05 ? "warn" : "fail",
      `Proporção de texto em relacao ao HTML: ${Math.round(textRatio * 100)}%.`,
    ),
  )

  checks.push(
    check(
      "response_time",
      "Performance",
      "Tempo de resposta",
      "moderate",
      page.responseTimeMs <= 1500
        ? "pass"
        : page.responseTimeMs <= 3000
          ? "warn"
          : "fail",
      `A página respondeu em ${page.responseTimeMs} ms.`,
    ),
  )

  checks.push(
    check(
      "page_size",
      "Performance",
      "Tamanho da página",
      "moderate",
      page.pageSizeBytes <= 1_000_000
        ? "pass"
        : page.pageSizeBytes <= 2_000_000
          ? "warn"
          : "fail",
      `A página possui ${(page.pageSizeBytes / 1024).toFixed(1)} KB de HTML.`,
    ),
  )

  const domSize = root.querySelectorAll("*").length
  checks.push(
    check(
      "dom_size",
      "Performance",
      "Tamanho do DOM",
      "minor",
      domSize <= 1500 ? "pass" : domSize <= 2500 ? "warn" : "fail",
      `O DOM possui aproximadamente ${domSize} elemento(s).`,
    ),
  )

  const compression = headers["content-encoding"]
  checks.push(
    check(
      "compression",
      "Performance",
      "Compressão",
      "moderate",
      compression ? "pass" : "warn",
      compression
        ? `A resposta usa ${compression}.`
        : "A resposta não usa compressão.",
    ),
  )

  const securityHeaders = [
    ["strict-transport-security", "HSTS"],
    ["content-security-policy", "CSP"],
    ["x-content-type-options", "X-Content-Type-Options"],
    ["referrer-policy", "Referrer-Policy"],
  ].filter(([header]) => !headers[header])
  checks.push(
    check(
      "security_headers",
      "Segurança",
      "Headers de segurança",
      "moderate",
      securityHeaders.length === 0
        ? "pass"
        : securityHeaders.length <= 2
          ? "warn"
          : "fail",
      securityHeaders.length === 0
        ? "Headers de segurança essenciais presentes."
        : `Headers ausentes: ${securityHeaders.map(([, label]) => label).join(", ")}.`,
    ),
  )

  const ogTitle = metaContent(root, "og:title")
  const ogDescription = metaContent(root, "og:description")
  const ogImage = metaContent(root, "og:image")
  const ogCount = [ogTitle, ogDescription, ogImage].filter(Boolean).length
  checks.push(
    check(
      "opengraph",
      "Social",
      "Open Graph",
      "minor",
      ogCount === 3 ? "pass" : "warn",
      ogCount === 3
        ? "Open Graph completo."
        : `Open Graph incompleto (${ogCount} de 3 campos).`,
    ),
  )

  const schemaScripts = root.querySelectorAll(
    'script[type="application/ld+json"]',
  )
  let schemaStatus: SeoCheckStatus = "warn"
  let schemaMessage = "A página não possui JSON-LD."
  if (schemaScripts.length > 0) {
    let valid = 0
    for (const script of schemaScripts) {
      try {
        JSON.parse(script.text)
        valid += 1
      } catch {
        // ignored: contabilizado abaixo
      }
    }
    if (valid === schemaScripts.length) {
      schemaStatus = "pass"
      schemaMessage = `${valid} bloco(s) JSON-LD válido(s).`
    } else {
      schemaStatus = "fail"
      schemaMessage = `${schemaScripts.length - valid} bloco(s) JSON-LD inválido(s).`
    }
  }
  checks.push(
    check(
      "schema",
      "Técnico",
      "Dados estruturados",
      "moderate",
      schemaStatus,
      schemaMessage,
    ),
  )

  return checks
}

export function summarize(checks: SeoCheck[]): SeoAuditSummary {
  let earned = 0
  let possible = 0
  let passed = 0
  let warnings = 0
  let failed = 0
  let majorIssues = 0
  let moderateIssues = 0
  let minorIssues = 0

  for (const item of checks) {
    const weight = WEIGHTS[item.severity]
    possible += weight

    if (item.status === "pass") {
      passed += 1
      earned += weight
    } else if (item.status === "warn") {
      warnings += 1
      earned += weight / 2
    } else {
      failed += 1
    }

    if (item.status !== "pass") {
      if (item.severity === "major") majorIssues += 1
      else if (item.severity === "moderate") moderateIssues += 1
      else minorIssues += 1
    }
  }

  return {
    score: possible > 0 ? Math.round((earned / possible) * 100) : 0,
    checksTotal: checks.length,
    passed,
    warnings,
    failed,
    majorIssues,
    moderateIssues,
    minorIssues,
    issuesTotal: warnings + failed,
  }
}

export async function runSeoAudit(url: string): Promise<SeoAuditResult> {
  const page = await fetchHtml(url)
  const checks = buildChecks(page)
  const summary = summarize(checks)

  return {
    version: 1,
    url,
    finalUrl: page.finalUrl,
    statusCode: page.status,
    fetchedAt: new Date().toISOString(),
    responseTimeMs: page.responseTimeMs,
    pageSizeBytes: page.pageSizeBytes,
    checks,
    summary,
  }
}
