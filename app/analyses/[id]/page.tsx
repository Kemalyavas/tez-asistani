import AnalysisDetailContent from './AnalysisDetailContent';

export const metadata = {
  title: 'Analysis Details - TezAI',
  description: 'View your thesis analysis details'
};

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
  return <AnalysisDetailContent analysisId={params.id} />;
}
