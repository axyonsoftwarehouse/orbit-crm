// Equivalente a `npm audit --omit=dev --audit-level=high`, mas aceita uma lista
// curta de alertas revisados e sem correção disponível. Qualquer outro alerta
// high/critical faz o script falhar.
import { execSync } from "node:child_process"

const ALLOWLIST = {
  // picomatch <=4.0.7 (ReDoS com extglobs). Não há versão corrigida; entra via
  // @sentry/nextjs -> @rollup/plugin-commonjs e só roda no build, com padrões
  // definidos pelo próprio projeto. Rever quando sair uma versão corrigida.
  "GHSA-fc5q-39xc-vjpf": "picomatch (build-time, sem correção)",
}

const BLOCKING = new Set(["high", "critical"])

let raw
try {
  raw = execSync("npm audit --omit=dev --json", {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
} catch (error) {
  // npm audit sai com código != 0 quando encontra vulnerabilidades.
  raw = error.stdout
  if (!raw) throw error
}

const report = JSON.parse(raw)
const advisories = new Map()
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via !== "object") continue
    const id = via.url?.split("/").pop() ?? String(via.source)
    advisories.set(id, { ...via, id })
  }
}

const blocking = []
const ignored = []
for (const advisory of advisories.values()) {
  if (!BLOCKING.has(advisory.severity)) continue
  if (ALLOWLIST[advisory.id]) ignored.push(advisory)
  else blocking.push(advisory)
}

for (const advisory of ignored) {
  console.log(
    `ignorado ${advisory.id} (${advisory.name}): ${ALLOWLIST[advisory.id]}`,
  )
}

if (blocking.length > 0) {
  console.error("Vulnerabilidades high/critical em dependências de produção:")
  for (const advisory of blocking) {
    console.error(
      `- ${advisory.severity} ${advisory.name} ${advisory.range}: ${advisory.title} (${advisory.url})`,
    )
  }
  process.exit(1)
}

console.log("Nenhuma vulnerabilidade high/critical fora da lista de exceções.")
