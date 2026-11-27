import { Mail, MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mailtoHref, telHref, whatsappHref } from "@/lib/contact-links"

/**
 * Botões de contato em um clique (e-mail, ligação, WhatsApp). Só aparecem os
 * que têm dado válido; sem nenhum, não renderiza nada.
 */
export function ContactShortcuts({
  email,
  phone,
  name,
  variant = "labeled",
}: {
  email?: string | null
  phone?: string | null
  name?: string
  variant?: "labeled" | "icon"
}) {
  const links = [
    { href: mailtoHref(email), label: "E-mail", icon: Mail, external: false },
    { href: telHref(phone), label: "Ligar", icon: Phone, external: false },
    {
      href: whatsappHref(phone),
      label: "WhatsApp",
      icon: MessageCircle,
      external: true,
    },
  ].filter((link) => link.href !== null)

  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1">
      {links.map(({ href, label, icon: Icon, external }) => {
        const title = name ? `${label}: ${name}` : label
        return (
          <Button
            key={label}
            variant="outline"
            size={variant === "icon" ? "icon-sm" : "sm"}
            nativeButton={false}
            render={
              <a
                href={href as string}
                title={title}
                aria-label={title}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              />
            }
          >
            <Icon className="size-4" />
            {variant === "icon" ? null : label}
          </Button>
        )
      })}
    </div>
  )
}
