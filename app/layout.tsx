import type React from "react"
import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import { Analytics as AnalyticsVercel } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
})

export const metadata: Metadata = {
  title: "عَقدي - منصة إدارة العقود والعملاء | الاتفاق كما يجب أن يكون",
  description:
    "عَقدي هي منصة SaaS عربية لإدارة العقود، التوقيع الإلكتروني، العملاء والمشاريع، مع مساحة عمل مستقلة لكل حساب ونظام عمولات للشركاء، لتجعل كل اتفاق موثقًا وواضحًا كما يجب أن يكون.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <ShadcnToaster />
          <Toaster position="bottom-left" dir="rtl" richColors closeButton />
          <AnalyticsVercel />
        </ThemeProvider>
        <Script
          src="/embed/forms"
          data-form-key="ef5fbd04-8b30-450a-be08-3667a43b2049"
          data-mode="popup"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
