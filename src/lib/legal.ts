/**
 * Dados usados nos Termos de uso e na Política de privacidade.
 *
 * Campos `null` aparecem nas páginas como "[preencher: ...]". Preencha aqui
 * (um lugar só) e, depois da revisão jurídica, mude `draft` para `false` para
 * tirar o aviso de versão preliminar.
 */
export const LEGAL = {
  /** Enquanto `true`, as páginas mostram o aviso de versão preliminar. */
  draft: true,
  version: "0.1",
  /** Data da versão (AAAA-MM-DD). */
  updatedAt: "2026-11-27",
  productName: "Orbit CRM",
  companyName: null as string | null,
  cnpj: null as string | null,
  address: null as string | null,
  /** E-mail do encarregado pelo tratamento de dados (DPO). */
  dpoEmail: null as string | null,
  /** Comarca do foro (ex.: "São Paulo/SP"). */
  forumCity: null as string | null,
  /** Região do banco de dados de produção (ex.: "São Paulo, Brasil"). */
  dataRegion: null as string | null,
}

export type LegalField =
  "companyName" | "cnpj" | "address" | "dpoEmail" | "forumCity" | "dataRegion"

export const LEGAL_FIELD_LABELS: Record<LegalField, string> = {
  companyName: "razão social",
  cnpj: "CNPJ",
  address: "endereço",
  dpoEmail: "e-mail do encarregado (DPO)",
  forumCity: "comarca do foro",
  dataRegion: "região do banco de dados (Supabase)",
}

/** Valor do campo ou `null` quando ainda não foi preenchido. */
export function legalValue(field: LegalField): string | null {
  const value = LEGAL[field]
  return value && value.trim() ? value.trim() : null
}

/** Campos que ainda faltam preencher (usado no aviso e nos testes). */
export function missingLegalFields(): LegalField[] {
  return (Object.keys(LEGAL_FIELD_LABELS) as LegalField[]).filter(
    (field) => !legalValue(field),
  )
}

export const LEGAL_PATHS = {
  terms: "/termos",
  privacy: "/privacidade",
} as const
