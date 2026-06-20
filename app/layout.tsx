// app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Spectral, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ActiveAnalysisBanner from './components/ActiveAnalysisBanner';
import RevealOnScroll from './components/RevealOnScroll';
import { homeMetadata } from './lib/metadata';
import { structuredData } from './lib/structuredData';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';


// Editöryel akademik dil: Spectral (serif başlıklar) + Hanken Grotesk (gövde).
// latin-ext alt kümesi Türkçe glyph'leri (ş ğ İ ı ç ö ü) kapsar.
const serif = Spectral({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

const sans = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = homeMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e3a8a' },
    { media: '(prefers-color-scheme: dark)', color: '#15296b' }
  ],
  colorScheme: 'light'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <html lang="tr" className={`${serif.variable} ${sans.variable}`}>
      <head>
        {/* Structured Data Scripts */}
        <Script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.website) }}
        />
        <Script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.organization) }}
        />
        <Script
          id="structured-data-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.softwareApplication) }}
        />

        {/* Manifest, favicon ve format-detection metadata API üzerinden yönetiliyor (lib/metadata.ts) */}
        <meta name="msapplication-TileColor" content="#1e3a8a" />
      </head>
      <body className={sans.className}>
  <Navbar />
        <RevealOnScroll />
        <main role="main">
          {children}
        </main>
        {/* Global: kullanıcı analiz başlattıysa, bitene kadar her sayfada görünür */}
        <ActiveAnalysisBanner />
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        {/* Analytics and other scripts */}
        <Analytics />
        <SpeedInsights />

        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} 
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}