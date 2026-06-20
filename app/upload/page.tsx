import FileUploader from '../components/FileUploader';
import { buildPageMetadata } from '../lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Yeni Tez Analizi',
  description: 'Tezini PDF veya DOCX olarak yükle, rapor dilini seç ve analiz et. Ücret sayfa sayısına göre otomatik belirlenir.',
  path: '/upload',
  keywords: 'tez analizi, tez yükle, yeni analiz',
});

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-paper-cool">
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">
        <div className="mb-7">
          <h1 className="font-serif font-medium text-4xl md:text-[42px] leading-[1.05] tracking-[-0.02em] mb-2">
            Tez analizi
          </h1>
          <p className="text-base text-ink/60">
            Tezini yükle, rapor dilini seç ve analiz et. Ücret sayfa sayısına göre otomatik belirlenir.
          </p>
        </div>
        <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 md:p-8">
          <FileUploader />
        </div>
      </div>
    </div>
  );
}
