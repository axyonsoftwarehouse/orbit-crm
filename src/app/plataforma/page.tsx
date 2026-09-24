import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import { CreateTenantForm } from "./create-tenant-form"

type Tenant = {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  created_at: string
}

export default async function PlatformPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tenants")
    .select("id, name, slug, status, plan, created_at")
    .order("created_at", { ascending: false })

  const tenants = (data ?? []) as Tenant[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Empresas</h1>
        <p className="text-muted-foreground text-sm">
          Crie e gerencie as empresas (tenants) da plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresas cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground text-center text-sm"
                  >
                    Nenhuma empresa cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tenant.slug}
                    </TableCell>
                    <TableCell>{tenant.plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tenant.status === "active" ? "default" : "secondary"
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
