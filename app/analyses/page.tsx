import AnalysesContent from './AnalysesContent';

// Metadata kasıtlı olarak burada tanımlı DEĞİL — analyses/layout.tsx zaten
// analysesMetadata'yı (TR "Analizlerim" + noindex) sağlıyor. Burada tekrar
// tanımlamak başlığı İngilizce'ye çevirip "| TezAI"yi ikiye katlıyordu.

export default function AnalysesPage() {
  return <AnalysesContent />;
}
