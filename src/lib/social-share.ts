export type SocialShareLink = {
  provider: string
  label: string
  url: string
}

export function extractFirstUrl(content: string): string | null {
  const match = content.match(/https?:\/\/[^\s]+/i)
  return match?.[0] ?? null
}

export function buildSocialShareLinks(content: string): SocialShareLink[] {
  const text = encodeURIComponent(content)
  const firstUrl = extractFirstUrl(content)
  const links: SocialShareLink[] = [
    {
      provider: "x",
      label: "Abrir no X",
      url: `https://twitter.com/intent/tweet?text=${text}`,
    },
    {
      provider: "bluesky",
      label: "Abrir no Bluesky",
      url: `https://bsky.app/intent/compose?text=${text}`,
    },
    {
      provider: "whatsapp",
      label: "Compartilhar no WhatsApp",
      url: `https://wa.me/?text=${text}`,
    },
  ]

  if (firstUrl) {
    const url = encodeURIComponent(firstUrl)
    links.push(
      {
        provider: "telegram",
        label: "Compartilhar no Telegram",
        url: `https://t.me/share/url?url=${url}&text=${text}`,
      },
      {
        provider: "facebook",
        label: "Compartilhar link no Facebook",
        url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      },
      {
        provider: "linkedin",
        label: "Compartilhar link no LinkedIn",
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      },
    )
  }

  return links
}
