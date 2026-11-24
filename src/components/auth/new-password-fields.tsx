import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Nova senha + confirmação (convite do portal e redefinição de senha). */
export function NewPasswordFields() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />
        <p className="text-muted-foreground text-xs">Mínimo de 8 caracteres.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirme a senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />
      </div>
    </>
  )
}
