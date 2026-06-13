import Link from 'next/link';
import Image from 'next/image';
import { Mail, Shield } from 'lucide-react';

const productLinks = [
  { href: '/tez-analizi', label: 'Tez Analizi' },
  { href: '/akademik-formatlar', label: 'Akademik Formatlar' },
  { href: '/ozellikler', label: 'Özellikler' },
  { href: '/pricing', label: 'Fiyatlar' },
];

const companyLinks = [
  { href: '/blog', label: 'Blog' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/sss', label: 'Sık Sorulan Sorular' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/auth', label: 'Giriş Yap' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo ve açıklama */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <span className="inline-flex items-center justify-center bg-white rounded-2xl p-3 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="TezAI"
                  width={96}
                  height={96}
                  className="h-16 w-auto"
                />
              </span>
            </Link>
            <p className="text-sm max-w-sm mb-6">
              Yapay zeka destekli tez analizi, otomatik kaynakça ve özet araçlarıyla tezini güvenle
              tamamla.
            </p>
            <p className="text-xs text-gray-400 mb-2">Güvenli Ödeme</p>
            <Image
              src="/logo_band_colored@3x.png"
              alt="Kabul edilen ödemeler: iyzico, Mastercard, Visa, American Express, Troy"
              width={320}
              height={40}
              className="w-full max-w-[280px]"
            />
          </div>

          {/* Ürün */}
          <div>
            <h2 className="font-semibold text-white mb-4">Ürün</h2>
            <ul className="space-y-2 text-sm">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary-400 transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h2 className="font-semibold text-white mb-4">Kurumsal</h2>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary-400 transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h2 className="font-semibold text-white mb-4">Yasal</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:text-primary-400 transition flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-primary-400 transition">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link href="/delivery-returns" className="hover:text-primary-400 transition">
                  Teslimat ve İade
                </Link>
              </li>
              <li className="flex items-center pt-2">
                <Mail className="h-3 w-3 mr-2" />
                <a href="mailto:destek.tezai@gmail.com" className="hover:text-primary-400 transition break-all">
                  destek.tezai@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} TezAI. Tüm hakları saklıdır.</span>
          <span>KVKK & GDPR uyumlu</span>
        </div>
      </div>
    </footer>
  );
}
