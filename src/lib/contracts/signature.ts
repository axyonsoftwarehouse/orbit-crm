const PNG_PREFIX = "data:image/png;base64,"
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
/** 512 KB é o teto da spec: assinatura desenhada não passa disso. */
export const SIGNATURE_MAX_BYTES = 512 * 1024

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

export type SignatureResult = { bytes: Buffer } | { error: string }

/**
 * Valida e decodifica a assinatura vinda do canvas (`toDataURL`). Aceita só
 * PNG — o `toDataURL` do navegador pode ser mudado no cliente, então confere
 * prefixo, base64 estrito, tamanho e os bytes mágicos antes de gravar.
 */
export function decodeSignatureDataUrl(
  value: string,
  maxBytes: number = SIGNATURE_MAX_BYTES,
): SignatureResult {
  if (!value.startsWith(PNG_PREFIX)) {
    return { error: "Formato de assinatura inválido." }
  }

  const base64 = value.slice(PNG_PREFIX.length).trim()
  if (!base64 || base64.length % 4 !== 0 || !BASE64.test(base64)) {
    return { error: "Assinatura inválida." }
  }

  const bytes = Buffer.from(base64, "base64")
  if (bytes.length > maxBytes) {
    return { error: "Assinatura muito grande." }
  }
  if (bytes.length < PNG_MAGIC.length) {
    return { error: "Assinatura inválida." }
  }
  for (let index = 0; index < PNG_MAGIC.length; index++) {
    if (bytes[index] !== PNG_MAGIC[index]) {
      return { error: "Assinatura inválida." }
    }
  }

  return { bytes }
}
