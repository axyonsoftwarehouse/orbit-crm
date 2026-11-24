/**
 * Quem recebe um aviso interno sobre um post do Social: o autor, se ainda for
 * membro ativo do tenant; senão (ou sem autor), os owner/admin ativos.
 */
export {
  resolveStaffRecipients as resolveSocialRecipients,
  uniqueEmails,
} from "@/server/recipients"
