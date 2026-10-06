function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  let text = String(value)
  // Neutraliza injeção de fórmula em planilhas (= + - @ TAB CR).
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`
  }
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const lines = [
    headers.map(escapeCell).join(";"),
    ...rows.map((row) => row.map(escapeCell).join(";")),
  ]
  return lines.join("\r\n")
}

function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length
  const commas = (headerLine.match(/,/g) ?? []).length
  return semicolons >= commas ? ";" : ","
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "")
  const delimiter = detectDelimiter(clean.split(/\r?\n/)[0] ?? "")
  const rows: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false

  for (let index = 0; index < clean.length; index++) {
    const char = clean[index]

    if (inQuotes) {
      if (char === '"') {
        if (clean[index + 1] === '"') {
          field += '"'
          index++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      field = ""
      rows.push(row)
      row = []
    } else if (char !== "\r") {
      field += char
    }
  }

  row.push(field)
  rows.push(row)

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""))
}
