/* eslint-disable jsx-a11y/alt-text */
// ============================================================================
// AnalysisReportPDF — TezAI analiz raporunun profesyonel PDF çıktısı
// ============================================================================
// @react-pdf/renderer ile VEKTÖREL PDF (seçilebilir/aranabilir metin). Server
// tarafında renderToBuffer ile üretilir (app/api/reports/pdf/route.ts).
// Türkçe karakterler (ş/ğ/İ/ı/ö/ü/ç) için Roboto TTF gömülür — varsayılan
// Helvetica WinAnsi Türkçe glyph'leri basamaz.
// ============================================================================
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Türkçe destekli font (Google Fonts / google-fonts repo, gerçek TTF).
// Modül seviyesinde bir kez register edilir.
// NOT: google/fonts gh repo Roboto'yu variable-font'a taşıdı (static/ 404). Bunun
// yerine @expo-google-fonts paketinin gerçek static TTF'leri kullanılıyor (jsdelivr,
// HEAD ile 200 doğrulandı; ~168KB her biri, tam Latin-Extended = Türkçe ş/ğ/İ/ç).
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/roboto@0.2.3/Roboto_400Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/roboto@0.2.3/Roboto_500Medium.ttf',
      fontWeight: 'medium',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/roboto@0.2.3/Roboto_700Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});
// Uzun kelimelerde satır kaydırma sorununu azalt
Font.registerHyphenationCallback((word) => [word]);

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10B981', A: '#10B981', 'A-': '#34D399',
  'B+': '#F59E0B', B: '#F59E0B', 'B-': '#FBBF24',
  'C+': '#F97316', C: '#EF4444', F: '#DC2626',
};

const SECTION_LABELS: Record<string, string> = {
  formatting: 'Biçim ve Düzen',
  structure: 'Yapı ve Organizasyon',
  introduction: 'Giriş',
  literature: 'Literatür Taraması',
  methodology: 'Metodoloji',
  findings: 'Bulgular',
  discussion: 'Tartışma / Yorum',
  conclusion: 'Sonuç',
  originality: 'Özgünlük ve Katkı',
  writingQuality: 'Yazım Kalitesi',
  writing_quality: 'Yazım Kalitesi',
  references: 'Kaynaklar',
};

const SEV: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'KRİTİK', color: '#DC2626', bg: '#FEF2F2' },
  major: { label: 'ÖNEMLİ', color: '#EA580C', bg: '#FFF7ED' },
  minor: { label: 'KÜÇÜK', color: '#2563EB', bg: '#EFF6FF' },
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#1F2937',
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    lineHeight: 1.5,
  },
  // Header
  header: { marginBottom: 18, borderBottomWidth: 2, borderBottomColor: '#E5E7EB', paddingBottom: 12 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
  headerSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  headerMeta: { fontSize: 9, color: '#9CA3AF', marginTop: 4 },

  // Score block
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8 },
  scoreCircle: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  scoreValue: { fontSize: 26, fontWeight: 'bold' },
  scoreOutOf: { fontSize: 9, color: '#6B7280' },
  gradeBadge: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start' },
  gradeLabel: { fontSize: 12, color: '#374151', marginTop: 4, fontWeight: 'medium' },

  // Verdict
  verdict: { fontSize: 10, color: '#374151', marginBottom: 14, lineHeight: 1.55 },

  // Banner
  banner: { padding: 8, borderRadius: 6, marginBottom: 10, fontSize: 9 },

  // Section
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },

  // Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: { width: '18%', minWidth: 70, alignItems: 'center', paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 6 },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 8, color: '#6B7280', marginTop: 2 },

  // Category row
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  catName: { width: '42%', fontSize: 9.5 },
  catBarBg: { flex: 1, height: 7, backgroundColor: '#E5E7EB', borderRadius: 4, marginHorizontal: 8 },
  catBarFill: { height: 7, borderRadius: 4 },
  catScore: { width: 44, fontSize: 9.5, fontWeight: 'bold', textAlign: 'right' },
  catNA: { width: 44, fontSize: 8, color: '#9CA3AF', textAlign: 'right' },

  // Issue card
  issue: { marginBottom: 9, padding: 9, borderRadius: 6, borderLeftWidth: 3 },
  issueHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  issueSev: { fontSize: 8, fontWeight: 'bold', paddingVertical: 1, paddingHorizontal: 5, borderRadius: 3, color: '#FFFFFF', marginRight: 6 },
  issueTitle: { fontSize: 10, fontWeight: 'bold', color: '#111827', flex: 1 },
  issuePage: { fontSize: 8, color: '#6B7280', marginLeft: 4 },
  issueQuote: { fontSize: 8.5, color: '#4B5563', fontStyle: 'italic', marginTop: 3, paddingLeft: 6, borderLeftWidth: 1, borderLeftColor: '#D1D5DB' },
  issueDesc: { fontSize: 9, color: '#374151', marginTop: 3 },
  issueAction: { fontSize: 9, color: '#065F46', marginTop: 4, padding: 5, backgroundColor: '#ECFDF5', borderRadius: 4 },

  // Strengths
  strength: { fontSize: 9.5, color: '#374151', marginBottom: 4, paddingLeft: 12 },

  // Footer
  footer: { position: 'absolute', bottom: 24, left: 44, right: 44, textAlign: 'center', fontSize: 8, color: '#9CA3AF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
  pageNum: { position: 'absolute', bottom: 24, right: 44, fontSize: 8, color: '#9CA3AF' },
});

function pickColor(letter: string): string {
  return GRADE_COLORS[letter] || '#2563EB';
}

interface IssueLike {
  title?: string;
  severity?: string;
  pageNumber?: number | null;
  originalText?: string;
  description?: string;
  actionHint?: string;
}

function IssueCard({ issue }: { issue: IssueLike }) {
  const sev = SEV[issue.severity || 'minor'] || SEV.minor;
  return (
    <View style={[styles.issue, { backgroundColor: sev.bg, borderLeftColor: sev.color }]} wrap={false}>
      <View style={styles.issueHead}>
        <Text style={[styles.issueSev, { backgroundColor: sev.color }]}>{sev.label}</Text>
        <Text style={styles.issueTitle}>{issue.title || 'Bulgu'}</Text>
        {issue.pageNumber ? <Text style={styles.issuePage}>Sayfa {issue.pageNumber}</Text> : null}
      </View>
      {issue.originalText ? <Text style={styles.issueQuote}>&ldquo;{issue.originalText}&rdquo;</Text> : null}
      {issue.description ? <Text style={styles.issueDesc}>{issue.description}</Text> : null}
      {issue.actionHint ? <Text style={styles.issueAction}>Ne yapmalısın: {issue.actionHint}</Text> : null}
    </View>
  );
}

export function AnalysisReportPDF({ result, filename }: { result: any; filename?: string }) {
  const grade = result?.grade || {};
  const color = pickColor(grade.letter);
  const stats = result?.statistics || result?.metadata || {};
  const sections: Record<string, any> = result?.sections || {};
  const issues = result?.issues || {};
  const critical: IssueLike[] = issues.critical || [];
  const major: IssueLike[] = issues.major || [];
  const minor: IssueLike[] = issues.minor || [];
  const strengths: string[] = result?.strengths || [];
  const dateStr = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  const num = (v: any) => (typeof v === 'number' ? v.toLocaleString('tr-TR') : (v ?? '-'));

  return (
    <Document
      title={`TezAI Analiz Raporu${filename ? ' - ' + filename : ''}`}
      author="TezAI"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <Text style={styles.logo}>TezAI</Text>
          <Text style={styles.headerSub}>Tez Analiz Raporu</Text>
          <Text style={styles.headerMeta}>
            {filename ? `${filename}  •  ` : ''}{dateStr}
          </Text>
        </View>

        {/* Score */}
        <View style={styles.scoreRow}>
          <View style={[styles.scoreCircle, { borderColor: color }]}>
            <Text style={[styles.scoreValue, { color }]}>{num(result?.overallScore)}</Text>
            <Text style={styles.scoreOutOf}>/ 100</Text>
          </View>
          <View>
            <Text style={[styles.gradeBadge, { backgroundColor: color }]}>{grade.letter || 'N/A'}</Text>
            <Text style={styles.gradeLabel}>{grade.label || 'Değerlendirildi'}</Text>
          </View>
        </View>

        {/* Verdict / executive summary */}
        {result?.executiveSummary ? (
          <Text style={styles.verdict}>{result.executiveSummary}</Text>
        ) : null}

        {/* Study type / partial upload notes */}
        {result?.studyType === 'theoretical' ? (
          <Text style={[styles.banner, { backgroundColor: '#F0F9FF', color: '#0369A1' }]}>
            Bu tez teorik/derleme niteliğinde değerlendirildi; empirik (veri toplama) kriterleri bu tür için uygulanmadı.
          </Text>
        ) : null}
        {result?.likelyPartialUpload ? (
          <Text style={[styles.banner, { backgroundColor: '#FFFBEB', color: '#B45309' }]}>
            Uyarı: Yüklenen dosyada bazı temel bölümler bulunamadı; tezin tamamı yüklenmemiş olabilir. Sonuçları buna göre değerlendirin.
          </Text>
        ) : null}

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel Bilgiler</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}><Text style={styles.statValue}>{num(stats.pageCount)}</Text><Text style={styles.statLabel}>Sayfa</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{num(stats.wordCount)}</Text><Text style={styles.statLabel}>Kelime</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{num(stats.referenceCount)}</Text><Text style={styles.statLabel}>Kaynak</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{num(stats.figureCount)}</Text><Text style={styles.statLabel}>Şekil</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{num(stats.tableCount)}</Text><Text style={styles.statLabel}>Tablo</Text></View>
          </View>
        </View>

        {/* Category scores */}
        {Object.keys(sections).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategori Puanları</Text>
            {Object.entries(sections).map(([key, data]: [string, any]) => {
              const label = SECTION_LABELS[key] || key;
              const applicable = data?.applicable !== false;
              const score = typeof data?.score === 'number' ? data.score : 0;
              const barColor = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
              return (
                <View style={styles.catRow} key={key}>
                  <Text style={styles.catName}>{label}</Text>
                  {applicable ? (
                    <>
                      <View style={styles.catBarBg}>
                        <View style={[styles.catBarFill, { width: `${Math.max(2, score)}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={styles.catScore}>{score}/100</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.catBarBg} />
                      <Text style={styles.catNA}>Uygulanamaz</Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Issues */}
        {critical.length + major.length + minor.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tespit Edilen Bulgular ({critical.length + major.length + minor.length})
            </Text>
            {critical.map((it, i) => <IssueCard issue={it} key={`c${i}`} />)}
            {major.map((it, i) => <IssueCard issue={it} key={`m${i}`} />)}
            {minor.map((it, i) => <IssueCard issue={it} key={`n${i}`} />)}
          </View>
        ) : null}

        {/* Strengths */}
        {strengths.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Güçlü Yönler</Text>
            {strengths.slice(0, 10).map((s, i) => (
              <Text style={styles.strength} key={i}>•  {s}</Text>
            ))}
          </View>
        ) : null}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Bu rapor TezAI tarafından otomatik oluşturulmuştur • www.tezai.com.tr • Yapay zeka destekli ön değerlendirmedir, jüri kararı yerine geçmez.
        </Text>
        <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

export default AnalysisReportPDF;
