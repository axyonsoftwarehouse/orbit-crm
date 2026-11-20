/**
 * Erro cuja mensagem foi escrita para o usuário final (em português, sem
 * detalhe técnico). Só esses têm a mensagem exibida na tela; qualquer outro
 * erro vira uma mensagem padrão e o detalhe fica no log.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/** Mensagem segura para exibir: a do erro, se for para o usuário; senão o padrão. */
export function userMessage(error: unknown, fallback: string): string {
  return error instanceof UserFacingError ? error.message : fallback
}
