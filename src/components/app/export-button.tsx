import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportButton({ href }: { href: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<a href={href} />}
    >
      <Download className="size-4" />
      Exportar CSV
    </Button>
  )
}
