export function Placeholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      <div className="text-muted-foreground mt-6 rounded-lg border border-dashed p-10 text-center text-sm">
        Em construção — previsto para a Fase 1.
      </div>
    </div>
  )
}
