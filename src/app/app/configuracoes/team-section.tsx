import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { TeamInvitation, TeamMember } from "@/server/queries/team"
import { InviteMemberDialog } from "./invite-member-dialog"
import { MemberRowActions } from "./member-row-actions"
import { RevokeInvitationButton } from "./revoke-invitation-button"

function initials(name: string | null, email: string | null) {
  const source = name ?? email ?? "?"
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function TeamSection({
  members,
  invitations,
  canManage,
}: {
  members: TeamMember[]
  invitations: TeamInvitation[]
  canManage: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold">
            Membros
            <span className="text-muted-foreground ml-2 text-xs font-normal">
              {members.length}
            </span>
          </h2>
          {canManage ? <InviteMemberDialog /> : null}
        </div>

        <ul className="divide-y rounded-2xl border">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">
                    {initials(member.full_name, member.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.full_name ?? "Usuário"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {member.email ?? "—"}
                  </p>
                </div>
              </div>
              <MemberRowActions
                userId={member.user_id}
                role={member.role}
                canManage={canManage}
              />
            </li>
          ))}
        </ul>
      </div>

      {canManage && invitations.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-heading text-sm font-semibold">
            Convites pendentes
            <span className="text-muted-foreground ml-2 text-xs font-normal">
              {invitations.length}
            </span>
          </h2>
          <ul className="divide-y rounded-2xl border">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm">{invitation.email}</p>
                  <p className="text-muted-foreground text-xs">
                    Expira em{" "}
                    {new Date(invitation.expires_at).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {invitation.role === "admin" ? "Administrador" : "Membro"}
                  </Badge>
                  <RevokeInvitationButton id={invitation.id} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
