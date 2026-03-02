import AnalysisDetailContent from './AnalysisDetailContent';

export const metadata = {
  title: 'Analiz Detayları - TezAI',
  description: 'Tez analiz detaylarınızı görüntüleyin'
};

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
  return <AnalysisDetailContent analysisId={params.id} />;
}
