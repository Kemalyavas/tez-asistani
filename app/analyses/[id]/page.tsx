import AnalysisDetailContent from './AnalysisDetailContent';

export const metadata = {
  title: 'Analiz Detayı | TezAI',
  description: 'Tez analiz raporunuzun detayları'
};

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
  return <AnalysisDetailContent analysisId={params.id} />;
}
