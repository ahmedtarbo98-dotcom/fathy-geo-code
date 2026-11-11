import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    template: "%s | FATHY GEO CODE",
    default: "FATHY GEO CODE — GIS & Remote Sensing Educational Hub",
  },
  description:
    "Bilingual GIS, Surveying & Remote Sensing Learning Platform led by Eng. Ahmed Fathy. Comprehensive courses in ArcGIS Pro, Google Earth Engine, Spatial Modeling, and Geomatics.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://fathygeocode.com/#organization",
        "name": "FATHY GEO CODE",
        "url": "https://fathygeocode.com",
        "logo": "https://fathygeocode.com/logo.jpg",
        "description": "GIS & Remote Sensing Educational Hub",
        "sameAs": [
          "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
          "https://t.me/Fathy772",
          "https://www.facebook.com/share/1NiKuCvtnM/",
          "https://www.linkedin.com/in/ahmed-fathy-57b168364"
        ]
      },
      {
        "@type": "Person",
        "@id": "https://fathygeocode.com/#person",
        "name": "Ahmed Fathy",
        "alternateName": "م. أحمد فتحي",
        "jobTitle": "Spatial Data Analyst",
        "worksFor": {
          "@id": "https://fathygeocode.com/#organization"
        }
      }
    ]
  };

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`min-h-screen bg-background text-foreground antialiased selection:bg-brand-cyan/20 selection:text-brand-navy ${
          locale === "ar" ? "font-arabic" : "font-latin"
        }`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages} locale={locale}>
            <div className="flex min-h-screen flex-col overflow-x-hidden w-full">
              <Navbar currentLocale={locale} />
              <main className="flex-1 w-full min-w-0">{children}</main>
              <Footer currentLocale={locale} />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
