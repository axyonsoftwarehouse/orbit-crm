import { APP_NAME } from "@/lib/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full bg-white/5"
        />

        <div className="relative flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <span className="font-heading text-lg font-bold">O</span>
          </div>
          <span className="font-heading text-lg font-semibold">{APP_NAME}</span>
        </div>

        <div className="relative space-y-3">
          <h2 className="font-heading text-3xl leading-tight font-semibold">
            Clientes, projetos e finanças em um só lugar.
          </h2>
          <p className="text-sm text-white/80">
            Organize entregas, acompanhe horas e fature com poucos cliques.
          </p>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>

      <div className="flex items-center justify-center p-6">{children}</div>
    </div>
  )
}
