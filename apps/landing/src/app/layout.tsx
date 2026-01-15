import FooterSection from "@/components/footer";
import Header from "@/components/header";
import type { Metadata } from "next";

import "./globals.css";

import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
export const metadata: Metadata = {
  title: {
    default: "DY - Business Loyalty & Marketing Platform",
    template: "%s | DY",
  },
  description:
    "Build customer loyalty programs, run targeted campaigns, and engage customers via WhatsApp. DY helps businesses drive revenue with automated loyalty rewards and smart marketing.",
  keywords: [
    "DY",
    "business loyalty program",
    "loyalty management",
    "business marketing",
    "WhatsApp marketing",
    "customer campaigns",
    "business CRM",
    "loyalty platform",
    "business technology",
  ],
  authors: [{ name: "DY" }],
  creator: "DY",
  publisher: "DY",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dy.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "DY - Business Loyalty & Marketing Platform",
    description:
      "Build customer loyalty programs, run targeted campaigns, and engage customers via WhatsApp. Drive revenue with automated loyalty rewards and smart marketing for businesses.",
    siteName: "DY",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DY - Transform Your Business",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DY - Business Loyalty & Marketing Platform",
    description:
      "Build customer loyalty programs, run targeted campaigns, and engage customers via WhatsApp. Drive revenue with automated rewards.",
    images: ["/og-image.jpg"],
    creator: "@dy",
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
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DY",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dy.com",
  description:
    "Business loyalty and marketing platform for building customer relationships and driving revenue",
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DY",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dy.com",
  logo: (process.env.NEXT_PUBLIC_SITE_URL || "https://dy.com") + "/logo.png",
  description:
    "Business loyalty and marketing platform that helps businesses build customer loyalty, run targeted campaigns, and drive revenue growth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} antialiased`}
      >
        <Header />
        <main className="pt-16">{children}</main>
        <FooterSection />
      </body>
    </html>
  );
}
