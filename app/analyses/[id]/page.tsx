import AnalysisDetailContent from './AnalysisDetailContent';

export const metadata = {
  // Sadece "Analiz Detayı" — kök layout "%s | TezAI" şablonunu ekler (çift "| TezAI" önlenir).
  title: 'Analiz Detayı',
  description: 'Tez analiz raporunuzun detayları',
  // Bireysel rapor sayfası kullanıcıya özeldir — açıkça noindex (gizlilik; layout mirasına ek savunma).
  robots: { index: false, follow: false },
};

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
  return <AnalysisDetailContent analysisId={params.id} />;
}
