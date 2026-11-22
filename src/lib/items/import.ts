import { parseCsv, toCsv } from "@/lib/csv"

export type ItemImportExisting = { descriptions: string[]; groups: string[] }

export type ItemImportData = {
  description: string
  long_description: string | null
  group: string | null
  rate: number
  unit: string | null
  tax_name: string | null
  tax_rate: number | null
}

export type ItemImportRow = {
  line: number
  status: "ok" | "duplicate" | "invalid"
  message: string | null
  data: ItemImportData | null
}

export const ITEM_IMPORT_MAX_ROWS = 1000

export const ITEM_IMPORT_HEADERS = [
  "Descrição",
  "Grupo",
  "Descrição longa",
  "Valor",
  "Unidade",
  "Imposto",
  "Alíquota",
]

type Column = { key: keyof ItemImportData; aliases: string[] }

const COLUMNS: Column[] = [
  { key: "description", aliases: ["descricao", "nome", "item"] },
  { key: "group", aliases: ["grupo", "categoria"] },
  {
    key: "long_description",
    aliases: ["descricao longa", "descricao_longa", "detalhes"],
  },
  { key: "rate", aliases: ["valor", "preco", "rate"] },
  { key: "unit", aliases: ["unidade", "unit"] },
  { key: "tax_name", aliases: ["imposto", "imposto_nome", "tax"] },
  {
    key: "tax_rate",
    aliases: ["aliquota", "imposto_percentual", "imposto %"],
  },
]

export function normalizeItemKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function normalizeHeader(value: string) {
  return normalizeItemKey(value)
}

function text(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim()
  return trimmed ? trimmed : null
}

function amount(value: string | undefined): number | null {
  const raw = (value ?? "").trim()
  if (!raw) return null
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseItemsCsv(
  csv: string,
  existing: ItemImportExisting,
): { rows: ItemImportRow[]; newGroups: string[]; error: string | null } {
  const table = parseCsv(csv)
  const dataRows = table.filter((row) => row.some((cell) => cell.trim() !== ""))

  if (dataRows.length === 0) {
    return { rows: [], newGroups: [], error: "O arquivo está vazio." }
  }
  if (dataRows.length - 1 > ITEM_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      newGroups: [],
      error: `O arquivo passa de ${ITEM_IMPORT_MAX_ROWS} linhas. Divida a importação.`,
    }
  }

  const header = dataRows[0]!.map(normalizeHeader)
  const indexByKey = new Map<Column["key"], number>()
  for (const column of COLUMNS) {
    const index = header.findIndex((cell) =>
      [column.key, ...column.aliases].map(normalizeHeader).includes(cell),
    )
    if (index >= 0) indexByKey.set(column.key, index)
  }

  if (!indexByKey.has("description")) {
    return {
      rows: [],
      newGroups: [],
      error: "A primeira linha precisa ser o cabeçalho (Descrição, ...).",
    }
  }

  const cell = (row: string[], key: Column["key"]) => {
    const index = indexByKey.get(key)
    return index === undefined ? "" : (row[index] ?? "")
  }

  const existingDescriptions = new Set(
    existing.descriptions.map(normalizeItemKey),
  )
  const existingGroups = new Set(existing.groups.map(normalizeItemKey))
  const seen = new Set<string>()
  const newGroups = new Set<string>()

  const rows: ItemImportRow[] = dataRows.slice(1).map((row, index) => {
    const line = index + 2
    const description = text(cell(row, "description"))
    const rate = amount(cell(row, "rate"))
    const taxName = text(cell(row, "tax_name"))
    const taxRate = amount(cell(row, "tax_rate"))
    const longDescription = text(cell(row, "long_description"))
    const unit = text(cell(row, "unit"))
    const group = text(cell(row, "group"))

    const invalid = (message: string): ItemImportRow => ({
      line,
      status: "invalid",
      message,
      data: null,
    })

    if (!description || description.length > 200) {
      return invalid("Informe uma descrição de até 200 caracteres.")
    }
    if (rate === null || rate < 0) {
      return invalid("Informe um valor válido (maior ou igual a zero).")
    }
    if (longDescription && longDescription.length > 5000) {
      return invalid("A descrição longa passa de 5000 caracteres.")
    }
    if (unit && unit.length > 50) {
      return invalid("A unidade passa de 50 caracteres.")
    }
    if (group && group.length > 100) {
      return invalid("O grupo passa de 100 caracteres.")
    }
    if ((taxName && taxRate === null) || (!taxName && taxRate !== null)) {
      return invalid("Informe o nome e a alíquota do imposto juntos.")
    }
    if (taxRate !== null && (taxRate < 0 || taxRate > 100)) {
      return invalid("A alíquota deve estar entre 0 e 100.")
    }

    const key = normalizeItemKey(description)
    const data: ItemImportData = {
      description,
      long_description: longDescription,
      group,
      rate,
      unit,
      tax_name: taxName,
      tax_rate: taxRate,
    }

    if (existingDescriptions.has(key) || seen.has(key)) {
      return {
        line,
        status: "duplicate",
        message: "Já existe um item com esta descrição.",
        data,
      }
    }
    seen.add(key)

    if (group) {
      const groupKey = normalizeItemKey(group)
      if (!existingGroups.has(groupKey)) newGroups.add(group)
    }

    return { line, status: "ok", message: null, data }
  })

  return { rows, newGroups: [...newGroups], error: null }
}

export function itemImportTemplate(): string {
  return toCsv(ITEM_IMPORT_HEADERS, [
    [
      "Instalação elétrica",
      "Serviços",
      "Ponto novo com cabeamento",
      "150,00",
      "h",
      "ISS",
      "5",
    ],
    ["Consultoria", "Serviços", "", "200,00", "h", "", ""],
  ])
}
