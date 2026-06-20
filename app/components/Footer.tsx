'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const productLinks = [
  { href: '/apa-kaynakca-olusturucu', label: 'Kaynakça oluşturucu' },
  { href: '/akademik-formatlar', label: 'Akademik formatlar' },
  { href: '/pricing', label: 'Fiyatlar' },
];

const companyLinks = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/blog', label: 'Blog' },
  { href: '/iletisim', label: 'İletişim' },
];

const legalLinks = [
  { href: '/privacy-policy', label: 'Gizlilik Politikası' },
  { href: '/mesafeli-satis-sozlesmesi', label: 'Mesafeli Satış' },
  { href: '/delivery-returns', label: 'Teslimat ve İade' },
  { href: '/sss', label: 'Sık Sorulan Sorular' },
];

export default function Footer() {
  const pathname = usePathname() || '/';
  // Auth ve ödeme sayfalarının kendi tam-ekran düzeni var; footer gösterme.
  if (pathname.startsWith('/auth') || pathname.startsWith('/payment')) return null;

  return (
    <footer className="bg-paper border-t border-line">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Marka */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4" aria-label="TezAI ana sayfa">
              <Image src="/logo.png" alt="TezAI" width={40} height={40} className="h-10 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed text-ink/60 max-w-[250px]">
              Akademik tez yazarları için format, kaynak ve özet asistanı.
            </p>
            <a
              href="mailto:destek.tezai@gmail.com"
              className="inline-block mt-4 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors break-all"
            >
              destek.tezai@gmail.com
            </a>
          </div>

          {/* Ürün */}
          <div>
            <h2 className="font-serif text-sm font-semibold text-ink mb-4">Ürün</h2>
            <ul className="space-y-3">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink/60 hover:text-primary-700 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Şirket */}
          <div>
            <h2 className="font-serif text-sm font-semibold text-ink mb-4">Şirket</h2>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink/60 hover:text-primary-700 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h2 className="font-serif text-sm font-semibold text-ink mb-4">Yasal</h2>
            <ul className="space-y-3">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink/60 hover:text-primary-700 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-line mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-ink/40">
          <span>© {new Date().getFullYear()} TezAI. Tüm hakları saklıdır.</span>
          <span>KVKK &amp; GDPR uyumlu · tezai.com.tr</span>
        </div>
      </div>
    </footer>
  );
}
