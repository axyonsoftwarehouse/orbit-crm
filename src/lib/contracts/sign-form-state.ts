export type SignFormState = {
  firstname: string
  email: string
  hasStroke: boolean
  consent: boolean
}

/** O botão de assinar só libera com nome, e-mail, traço e consentimento. */
export function canSign(state: SignFormState): boolean {
  return (
    state.firstname.trim().length > 0 &&
    state.email.trim().length > 0 &&
    state.hasStroke &&
    state.consent
  )
}
