import type { Metadata } from "next"
import localFont from "next/font/local"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const poppins = localFont({
  variable: "--font-poppins",
  display: "swap",
  src: [
    {
      path: "./fonts/poppins/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/poppins/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/poppins/Poppins-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/poppins/Poppins-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
})

const roboto = localFont({
  variable: "--font-roboto",
  display: "swap",
  src: [
    {
      path: "./fonts/roboto/Roboto-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/roboto/Roboto-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    { path: "./fonts/roboto/Roboto-Bold.ttf", weight: "700", style: "normal" },
  ],
})

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
})

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Orbit CRM"

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description:
    "CRM SaaS multi-tenant para gestão de clientes, projetos e tarefas.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${poppins.variable} ${roboto.variable} ${robotoMono.variable}`}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
