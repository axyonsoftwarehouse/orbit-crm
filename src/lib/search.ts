/**
 * Remove os caracteres com significado na sintaxe de filtros do PostgREST
 * (`,` `(` `)` em `or=`) e os curingas do LIKE, para o termo ser literal.
 */
export function sanitizeSearchTerm(query: string): string {
  return query
    .replace(/[%_,()\\*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
}

/** Minúsculas e sem acentos, para comparar "orcamento" com "Orçamento". */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

/** Filtra comandos cujo rótulo (ou palavra-chave) contém todas as palavras. */
export function filterCommands<T extends { label: string; keywords?: string }>(
  commands: T[],
  query: string,
): T[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return commands
  return commands.filter((command) => {
    const haystack = normalizeText(`${command.label} ${command.keywords ?? ""}`)
    return words.every((word) => haystack.includes(word))
  })
}
