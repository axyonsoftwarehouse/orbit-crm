import Link from "next/link"
import type { ReactNode } from "react"
import { formatDate } from "@/lib/format"
import {
  LEGAL,
  LEGAL_FIELD_LABELS,
  LEGAL_PATHS,
  legalValue,
  missingLegalFields,
  type LegalField,
} from "@/lib/legal"

/** Valor de `LEGAL` ou um marcador destacado enquanto não for preenchido. */
export function LegalValue({ field }: { field: LegalField }) {
  const value = legalValue(field)
  if (value) return <>{value}</>
  return (
    <mark className="rounded bg-amber-200 px-1 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200">
      [preencher: {LEGAL_FIELD_LABELS[field]}]
    </mark>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground [&_strong]:text-foreground space-y-3 text-sm leading-relaxed [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  )
}

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: ReactNode
  children: ReactNode
}) {
  const missing = missingLegalFields()
  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold"
          >
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <span className="font-heading font-bold">O</span>
            </span>
            {LEGAL.productName}
          </Link>
          {LEGAL.draft ? (
            <div
              role="note"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
            >
              <strong>Versão preliminar, sujeita a revisão jurídica.</strong>{" "}
              Este texto ainda não vale como versão final.
              {missing.length > 0
                ? ` Faltam: ${missing.map((field) => LEGAL_FIELD_LABELS[field]).join(", ")}.`
                : null}
            </div>
          ) : null}
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground text-xs">
              Versão {LEGAL.version} · atualizada em{" "}
              {formatDate(LEGAL.updatedAt)}
            </p>
          </div>
          <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
            {intro}
          </div>
        </header>

        <div className="space-y-8">{children}</div>

        <footer className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 border-t pt-6 text-xs">
          <Link href={LEGAL_PATHS.terms} className="hover:text-foreground">
            Termos de uso
          </Link>
          <Link href={LEGAL_PATHS.privacy} className="hover:text-foreground">
            Política de privacidade
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Entrar
          </Link>
        </footer>
      </div>
    </div>
  )
}

/** "Ao continuar, você concorda com..." para telas de login e convite. */
export function LegalConsentNote({
  action = "continuar",
}: {
  action?: string
}) {
  return (
    <p className="text-muted-foreground mt-4 text-center text-xs leading-relaxed">
      Ao {action}, você concorda com os{" "}
      <Link
        href={LEGAL_PATHS.terms}
        target="_blank"
        className="text-primary hover:underline"
      >
        Termos de uso
      </Link>{" "}
      e a{" "}
      <Link
        href={LEGAL_PATHS.privacy}
        target="_blank"
        className="text-primary hover:underline"
      >
        Política de privacidade
      </Link>
      .
    </p>
  )
}
