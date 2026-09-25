import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PREFIXES = ["/app", "/plataforma", "/portal"]
const AUTH_PREFIXES = ["/login", "/convite", "/portal/login"]

export async function updateSession(request: NextRequest) {
  // Resolução de tenant por subdomínio (inativo até definir NEXT_PUBLIC_ROOT_DOMAIN)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (rootDomain) {
    const hostname = (request.headers.get("host") ?? "").split(":")[0]
    if (
      hostname.endsWith(`.${rootDomain}`) &&
      hostname !== `www.${rootDomain}`
    ) {
      const slug = hostname.slice(0, -(rootDomain.length + 1))
      if (slug) request.headers.set("x-tenant-slug", slug)
    }
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )
  const isProtected =
    !isAuthRoute &&
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith("/portal") ? "/portal/login" : "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith("/portal") ? "/portal" : "/app"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}
