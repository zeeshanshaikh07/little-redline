import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://little-redline.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Little Redline — Hot Wheels for collectors",
  description:
    "Shop collectible Hot Wheels in India. Browse handpicked die-cast cars, check condition and packaging details, and find your next 1:64 favorite.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Little Redline — Hot Wheels for collectors",
    description:
      "Shop collectible Hot Wheels in India. Browse handpicked die-cast cars and find your next 1:64 favorite.",
    siteName: "Little Redline",
    locale: "en_IN",
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#f2eee5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
