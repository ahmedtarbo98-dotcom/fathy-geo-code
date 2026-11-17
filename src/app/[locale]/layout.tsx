import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteBrandingProvider } from "@/components/site-branding-provider";
import { getSiteBranding } from "@/lib/site-branding";
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

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const isRtl = locale === "ar";
  const branding = await getSiteBranding();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fathy-geo-code.vercel.app";
  const iconUrl = branding.logoUrl || "/logo.jpg";

  const titleAr = "FATHY GEO CODE | فتحي جيو كود — منصة نظم المعلومات الجغرافية والاستشعار عن بعد | م. أحمد فتحي";
  const titleEn = "FATHY GEO CODE — GIS & Remote Sensing Educational Hub | Eng. Ahmed Fathy";

  const descAr =
    "المنصة التعليمية الرائدة للمهندس أحمد فتحي في نظم المعلومات الجغرافية (GIS)، الاستشعار عن بعد (Remote Sensing)، التحليلات المكانية المتقدمة، وتطبيقات ArcGIS Pro وGoogle Earth Engine والمساحة الرقمية.";
  const descEn =
    "Bilingual GIS, Surveying & Remote Sensing Learning Platform led by Eng. Ahmed Fathy. Comprehensive practical courses in ArcGIS Pro, Google Earth Engine, Spatial Modeling, and Geomatics.";

  const currentTitle = isRtl ? titleAr : titleEn;
  const currentDesc = isRtl ? descAr : descEn;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: `%s | ${branding.siteName || "FATHY GEO CODE"}`,
      default: currentTitle,
    },
    description: currentDesc,
    keywords: [
      "فتحي جيو كود",
      "FATHY GEO CODE",
      "أحمد فتحي",
      "Ahmed Fathy",
      "GIS",
      "نظم المعلومات الجغرافية",
      "الاستشعار عن بعد",
      "Remote Sensing",
      "ArcGIS Pro",
      "Google Earth Engine",
      "GEE",
      "التحليل المكاني",
      "Spatial Analysis",
      "المساحة الرقمية",
      "Digital Surveying",
      "كارتوغرافيا",
      "Cartography",
      "كورسات GIS",
      "GIS courses Egypt",
      "شهادات GIS",
      "تعلم GIS بالعربي",
    ],
    authors: [{ name: "Eng. Ahmed Fathy", url: baseUrl }],
    creator: "Eng. Ahmed Fathy",
    publisher: "FATHY GEO CODE",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        ar: `${baseUrl}/ar`,
        en: `${baseUrl}/en`,
        "x-default": `${baseUrl}/ar`,
      },
    },
    openGraph: {
      type: "website",
      locale: isRtl ? "ar_EG" : "en_US",
      alternateLocale: isRtl ? "en_US" : "ar_EG",
      url: `${baseUrl}/${locale}`,
      siteName: "FATHY GEO CODE • فتحي جيو كود",
      title: currentTitle,
      description: currentDesc,
      images: [
        {
          url: `${baseUrl}/images/logo.jpg`,
          width: 800,
          height: 800,
          alt: "FATHY GEO CODE • فتحي جيو كود",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: currentTitle,
      description: currentDesc,
      images: [`${baseUrl}/images/logo.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: iconUrl,
      apple: iconUrl,
    },
  };
}

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
  const initialBranding = await getSiteBranding();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fathy-geo-code.vercel.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${baseUrl}/#organization`,
        name: "FATHY GEO CODE",
        alternateName: "فتحي جيو كود",
        url: baseUrl,
        logo: initialBranding.logoUrl || `${baseUrl}/logo.jpg`,
        description: initialBranding.tagline || "GIS & Remote Sensing Educational Hub",
        sameAs: [
          "https://wa.me/201060683463",
          "https://t.me/Fathy772",
          "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
          "https://www.facebook.com/share/1NiKuCvtnM/",
          "https://www.linkedin.com/in/ahmed-fathy-57b168364",
        ],
      },
      {
        "@type": "Person",
        "@id": `${baseUrl}/#person`,
        name: "Ahmed Fathy",
        alternateName: "م. أحمد فتحي",
        jobTitle: "Spatial Data Analyst & Remote Sensing Specialist",
        worksFor: {
          "@id": `${baseUrl}/#organization`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "FATHY GEO CODE • فتحي جيو كود",
        description: "منصة تعليمية متخصصة في نظم المعلومات الجغرافية والاستشعار عن بعد",
        inLanguage: ["ar", "en"],
      },
    ],
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
      <body className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col selection:bg-brand-cyan/20 selection:text-brand-navy dark:selection:text-brand-cyan">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SiteBrandingProvider initialBranding={initialBranding}>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <Navbar currentLocale={locale} />
              <main className="flex-1">{children}</main>
              <Footer currentLocale={locale} />
            </NextIntlClientProvider>
          </SiteBrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
