import Link from 'next/link';
import Image from 'next/image'; 
import { FileText, Mail, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo ve Açıklama */}
          <div>
            <div className="flex items-center space-x-2 mb-8">
              <FileText className="h-6 w-6 text-blue-400" />
              <span className="font-bold text-xl text-white">Tez Asistanı</span>
            </div>
            <p className="text-sm">
              YÖK formatında hatasız tez yazımı için AI destekli asistanınız
            </p>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="font-semibold text-white mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-blue-400 transition">Ana Sayfa</Link></li>
              <li><Link href="/#features" className="hover:text-blue-400 transition">Özellikler</Link></li>
              <li><Link href="/#pricing" className="hover:text-blue-400 transition">Fiyatlar</Link></li>
              <li><Link href="/#app" className="hover:text-blue-400 transition">Uygulama</Link></li>
              <li><Link href="/auth" className="hover:text-blue-400 transition">Giriş Yap</Link></li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Yasal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:text-blue-400 transition flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-blue-400 transition">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link href="/teslimat-iade" className="hover:text-blue-400 transition">
                  Teslimat ve İade
                </Link>
              </li>
              <li>
                <Link href="/kvkk" className="hover:text-blue-400 transition">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim ve Ödeme */}
          <div>
            <h3 className="font-semibold text-white mb-4">İletişim</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Mail className="h-3 w-3 mr-2" />
                info@tezasistani.com
              </li>
              <li className="mt-8">
                <p className="text-xs text-gray-400 mb-2 mt-6">Güvenli Ödeme</p>

                
                <Image
            src="/logo_band_colored@3x.png"
                    alt="Ödeme Yöntemleri: Iyzico, Mastercard, Visa, American Express, Troy"
                  width={320} 
                      height={40}  
                      className="w-full max-w-[320px] mt-4" 
/>

              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}