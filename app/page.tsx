'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import CtaBand from './components/CtaBand';
import CountUp from './components/CountUp';
import { ArrowRight } from 'lucide-react';
import { CREDIT_PACKAGES, CREDIT_COSTS, ANALYSIS_TIERS } from './lib/pricing';
import { structuredData } from './lib/structuredData';
import Script from 'next/script';

const RUBRIC_CRITERIA = [
  'Problem tanımının netliği', 'Araştırma sorusu / hipotez', 'Literatür taramasının kapsamı',
  'Kaynak güncelliği', 'Yöntem uygunluğu', 'Örneklem tanımı', 'Veri analizi tutarlılığı',
  'Bulguların sunumu', 'Tartışmanın derinliği', 'Sonuç ve öneriler', 'Akademik dil ve üslup',
  'Atıf doğruluğu (APA 7)', 'Kaynakça biçimi', 'Başlık hiyerarşisi', 'Tablo ve şekil düzeni',
  'Özet yeterliliği', 'Anahtar kelimeler', 'Etik beyan', 'Biçim ve şablon uyumu', 'Bütünlük ve akış',
];

const FAQS = [
  { q: 'Başlamak için kredi kartı gerekiyor mu?', a: 'Hayır. Kayıt olunca anında 10 ücretsiz kredi kazanırsın. Bu, kısa bir tezin temel analizine ya da birkaç kaynak ve özet denemesine yeter.' },
  { q: 'Krediler sona erer mi?', a: 'Hayır, kredilerin asla sona ermez. Bir kez satın al, ihtiyaç duyduğunda kullan. Aylık ücret, abonelik veya baskı yok.' },
  { q: 'Hangi kredi paketini seçmeliyim?', a: 'Tek bir tez için Starter veya Standart genellikle yeterli. Birden fazla proje için en iyi değeri Pro paketi (500 kredi) sunar.' },
  { q: 'Tezim güvende mi?', a: 'Evet. Dosyaların diğer kullanıcılarla asla paylaşılmaz, analiz sonrası otomatik silinir, yapay zekâ modeli eğitiminde kullanılmaz ve SSL ile şifrelenir.' },
];

const STEPS = [
  { n: 'I', title: 'Tezini yükle', desc: 'PDF veya DOCX dosyanı güvenli sisteme yükle. Format otomatik algılanır.' },
  { n: 'II', title: 'Yapay zekâ inceler', desc: 'Akademik standartlara göre her bölüm tek tek, rubriğe dayalı kontrol edilir.' },
  { n: 'III', title: 'Raporunu al', desc: 'Sayfa bazlı bulgular, önceliklendirilmiş düzeltme önerileri ve PDF raporla tezini güçlendir.' },
];

// Hero kartındaki "öne çıkan öneriler" — navy vurgu sırayla bunlar arasında gezer.
const HERO_SUGGESTIONS = [
  { cat: 'Kaynakça', page: 's. 12', warn: true, fix: "3 kaynakta yıl parantez dışında. APA 7'ye göre yazar (yıl) biçimine getir." },
  { cat: 'Başlık düzeni', page: 's. 34', warn: true, fix: '2. düzey başlıkları italik ve girintili yaparak hiyerarşiyi netleştir.' },
  { cat: 'Yöntem', page: 's. 28', warn: false, fix: 'Örneklem tanımı net, ölçüt karşılanıyor. Değişiklik gerekmiyor.' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'citation' | 'abstract'>('upload');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [cardIdx, setCardIdx] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // oturum bilgisi ileride gerekirse diye hazır; CTA'lar anchor scroll kullanıyor
    supabase.auth.getSession();
  }, [supabase]);

  // Hero kartında navy vurgu, öneriler arasında yumuşakça gezer (sakin döngü).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCardIdx(-1);
      return;
    }
    const id = setInterval(() => setCardIdx((i) => (i + 1) % HERO_SUGGESTIONS.length), 1900);
    return () => clearInterval(id);
  }, []);

  const creditCostInfo = [
    { action: 'Kaynak Formatlama', credits: CREDIT_COSTS.citation_format.creditsRequired, note: 'APA, MLA, Chicago, IEEE' },
    { action: 'Özet Oluşturma', credits: CREDIT_COSTS.abstract_generate.creditsRequired, note: 'Türkçe / İngilizce' },
    ...ANALYSIS_TIERS.map((t) => ({
      action: `Tez Analizi (${t.maxPages >= 999 ? `${t.minPages}+` : `${t.minPages}-${t.maxPages}`} sayfa)`,
      credits: t.credits,
      note: t.name.replace(' Analiz', ''),
    })),
  ];

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'upload', label: 'Tez Analizi' },
    { key: 'citation', label: 'Kaynak Formatla' },
    { key: 'abstract', label: 'Özet Oluştur' },
  ];

  // Araç önizlemeleri landing'de; gerçek araç kendi sayfasında çalışır.
  const toolCta =
    activeTab === 'upload'
      ? { label: "Tez Analizi'ne başla", href: '/upload' }
      : activeTab === 'citation'
        ? { label: 'Kaynak formatlamayı aç', href: '/apa-kaynakca-olusturucu' }
        : { label: 'Özet oluşturucuyu aç', href: '/ozet' };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Script id="structured-data-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.faq) }} />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-36 right-[-60px] w-[560px] h-[460px] rounded-full bg-primary-100/80 blur-3xl animate-glow-drift pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-[78px] grid lg:grid-cols-[1.06fr_0.94fr] gap-12 items-center">
          <div>
            <div className="reveal mb-6">
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700">Akademik yazım asistanı</span>
            </div>
            <h1 className="font-serif font-medium text-5xl md:text-[62px] leading-[1.06] tracking-[-0.018em] mb-6">
              Tezini{' '}
              <span className="italic text-primary-700 underline decoration-primary-700/60 decoration-[3px] underline-offset-[8px]">kusursuz</span>{' '}
              tamamla.
            </h1>
            <p className="reveal text-lg md:text-xl leading-relaxed text-ink/60 mb-8 max-w-[490px]">
              Format hatalarını bulur, kaynaklarını düzeltir ve özetlerini cilalar. Böylece sen yalnızca araştırmana odaklanırsın.
            </p>
            <div className="reveal flex flex-wrap gap-3 mb-9">
              <a href="#tools" className="inline-flex items-center gap-2 bg-primary-600 text-white text-base font-semibold px-7 py-3.5 rounded-md shadow-[0_12px_26px_-12px_rgba(30,58,138,0.6)] hover:bg-primary-700 hover:-translate-y-0.5 transition-all">
                Ücretsiz başla <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#how" className="inline-flex items-center bg-transparent text-ink text-base font-semibold px-7 py-3.5 rounded-md border border-line hover:border-primary-600 hover:bg-primary-50 transition-colors">
                Nasıl çalışır?
              </a>
            </div>
            <div className="reveal flex items-center gap-3.5">
              <div className="flex">
                {[{ t: 'AY', bg: '#1e3a8a' }, { t: 'EK', bg: '#166534' }, { t: 'MŞ', bg: '#b45309' }, { t: 'ZB', bg: '#9f1239' }].map((a) => (
                  <span key={a.t} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold border-[2.5px] border-paper -ml-2 first:ml-0" style={{ background: a.bg }}>{a.t}</span>
                ))}
              </div>
              <span className="text-[14.5px] text-ink/60">
                <strong className="text-ink font-bold"><CountUp to={1000} />+</strong> tez analiz edildi
              </span>
            </div>
          </div>

          {/* Report card */}
          <div className="reveal relative">
            <div className="absolute -inset-3 left-6 bg-primary-50 rounded-md -z-0" aria-hidden="true" />
            <div className="relative bg-white border border-line rounded-md shadow-[0_30px_64px_-34px_rgba(28,26,23,0.4)] p-7 animate-float-y">
              {/* header */}
              <div className="flex justify-between items-center">
                <span className="font-serif text-[17px] font-semibold">Analiz Raporu</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] uppercase text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  Tamamlandı
                </span>
              </div>
              {/* score */}
              <div className="flex items-end gap-4 py-[18px] mt-3.5 border-t border-line">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-serif text-5xl font-semibold leading-[0.82] text-primary-700"><CountUp to={87} duration={1200} group={false} /></span>
                  <span className="font-serif text-lg font-medium text-ink/40">/100</span>
                </div>
                <div className="pb-0.5">
                  <div className="font-serif italic text-[17px] leading-tight">İyi durumda, 3 küçük düzeltme</div>
                  <div className="text-xs text-ink/40 mt-0.5">11 kategori incelendi · APA 7</div>
                </div>
              </div>
              {/* öne çıkan öneriler — gezen vurgu */}
              <div className="border-t border-line pt-3.5">
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-ink/40 mb-2.5">Öne çıkan öneriler</div>
                <div className="flex flex-col gap-0.5 -mx-2">
                  {HERO_SUGGESTIONS.map((s, i) => {
                    const on = cardIdx === i;
                    return (
                      <div
                        key={i}
                        className="flex gap-3 items-start px-3 py-2.5 rounded-lg transition-all duration-[550ms]"
                        style={{ background: on ? '#eef1f9' : 'transparent', boxShadow: `inset 2px 0 0 ${on ? '#1e3a8a' : 'transparent'}` }}
                      >
                        <span className="w-[22px] h-[22px] flex-none rounded-md flex items-center justify-center mt-px" style={{ background: s.warn ? '#fbeccb' : '#dcefe1' }}>
                          {s.warn ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] mb-0.5"><strong className="font-bold">{s.cat}</strong> <span className="text-ink/40 font-medium">· {s.page}</span></div>
                          <div className="text-[12.5px] leading-snug text-ink/55">{s.fix}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAND ===== */}
      <section className="reveal relative overflow-hidden bg-gradient-to-br from-[#16265c] via-primary-700 to-[#23408f]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="pointer-events-none absolute -top-24 right-[8%] w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(157,184,240,0.22),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-y-9">
          {[
            { node: <><CountUp to={1000} />+</>, label: 'tez analiz edildi' },
            { node: '~2 dk', label: 'ortalama sonuç süresi' },
            { node: <><CountUp to={50} />+</>, label: 'akademik kriter' },
            { node: '%100', label: 'gizli & güvenli' },
          ].map((s, i) => (
            <div key={i} className={`px-4 sm:px-6 text-center ${i < 3 ? 'md:border-r border-white/15' : ''}`}>
              <div className="font-serif text-[44px] md:text-5xl font-semibold text-white leading-none">{s.node}</div>
              <div className="text-[13px] text-primary-100 mt-2.5 tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STATEMENT ===== */}
      <section className="bg-primary-50 border-b border-line">
        <div className="reveal max-w-3xl mx-auto px-6 py-20 text-center">
          <span className="font-serif text-[60px] leading-[0] text-primary-700 inline-block h-7">“</span>
          <p className="font-serif font-medium text-[28px] md:text-[34px] leading-[1.34] tracking-[-0.01em] mt-4">
            Asıl güç analizde: tezini{' '}
            <span className="italic text-primary-700">50&apos;den fazla akademik ölçüte göre, sayfa sayfa ve tutarlı biçimde değerlendiririz.</span>{' '}
            Mekanik yükü TezAI üstlenir, sen fikrine odaklanırsın.
          </p>
        </div>
      </section>

      {/* ===== ANALYSIS ===== */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-[88px]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          <div className="reveal">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700 mb-4">Analiz kalitesi</div>
            <h2 className="font-serif font-medium text-4xl md:text-[42px] leading-[1.1] tracking-[-0.015em] mb-4">
              Satır satır <span className="italic text-primary-700">kanıtlı</span> değerlendirme
            </h2>
            <p className="text-[17px] leading-relaxed text-ink/60 mb-6">
              Asıl gücümüz analizde. Tahmine değil, kurallara dayalı bir rubriğe göre değerlendiririz ve her bulguyu tezdeki yerine bağlarız.
            </p>
            <div className="flex flex-col">
              {[
                { n: '01', t: 'Rubrik temelli, tutarlı skor', d: 'Aynı tez her zaman aynı sonucu alır; sübjektiflik en aza iner.' },
                { n: '02', t: 'Sayfa bazlı kanıt', d: 'Her bulgu tezdeki ilgili sayfaya bağlanır; nereye bakacağını bilirsin.' },
                { n: '03', t: 'Çoklu model, çapraz doğrulama', d: 'Tek bir modele bağlı değildir; sonuçlar birden çok modelle doğrulanır.' },
              ].map((f, i) => (
                <div key={f.n} className={`flex gap-4 py-4 border-t border-line ${i === 2 ? 'border-b' : ''}`}>
                  <span className="font-serif text-lg font-semibold text-primary-700 shrink-0 w-7">{f.n}</span>
                  <div>
                    <div className="text-[15px] font-bold mb-0.5">{f.t}</div>
                    <div className="text-sm text-ink/55 leading-relaxed">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* page-grounded evidence */}
          <div className="reveal flex gap-5 items-center bg-white border border-line rounded-md shadow-[0_28px_64px_-42px_rgba(28,26,23,0.42)] p-7">
            <div className="relative w-[168px] h-[230px] shrink-0 bg-paper border border-line rounded-md p-4 overflow-hidden">
              {[70, 100, 100, 88, 100, 62, 100, 94, 100, 78].map((w, i) => (
                <div key={i} className="h-[5px] rounded-sm bg-line/70 mb-2" style={{ width: `${w}%`, marginBottom: i === 0 ? 13 : (i === 5 ? 15 : 8), height: i === 0 ? 7 : 5 }} />
              ))}
              <div className="absolute left-0 right-0 h-7 bg-gradient-to-b from-transparent via-primary-50 to-transparent border-t-2 border-primary-600" style={{ animation: 'pScan 3.8s ease-in-out infinite' }} />
              <div className="absolute left-2.5 top-[70px] w-3.5 h-3.5 rounded-full bg-amber-600 border-2 border-white shadow" />
              <div className="absolute left-2.5 top-[162px] w-3.5 h-3.5 rounded-full bg-green-600 border-2 border-white shadow" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="bg-white border border-amber-200 rounded-md px-3.5 py-3">
                <div className="text-[13px] font-bold">Kaynakça <span className="text-amber-700">· s. 12</span></div>
                <div className="text-[12.5px] text-ink/50 leading-snug">APA 7 biçim hatası, düzeltme önerisi sunuldu</div>
              </div>
              <div className="bg-white border border-green-200 rounded-md px-3.5 py-3">
                <div className="text-[13px] font-bold">Yöntem <span className="text-green-700">· s. 28</span></div>
                <div className="text-[12.5px] text-ink/50 leading-snug">Örneklem net tanımlı, ölçüt karşılanıyor</div>
              </div>
              <div className="text-xs text-ink/40 pl-0.5">Her bulgu, tezdeki ilgili sayfaya bağlıdır.</div>
            </div>
          </div>
        </div>

        {/* 50+ criteria marquee */}
        <div className="reveal mt-[54px] grid lg:grid-cols-[0.62fr_1fr] gap-11 items-center border-t border-line pt-12">
          <div>
            <h3 className="font-serif font-medium text-3xl leading-tight tracking-[-0.015em] mb-3">50&apos;den fazla akademik kriter</h3>
            <p className="text-base leading-relaxed text-ink/60">
              Giriş, literatür, yöntem, bulgular, tartışma, dil ve biçim; her boyut ayrı ayrı, tek bir yapılandırılmış değerlendirmeyle denetlenir.
            </p>
          </div>
          <div className="relative h-[220px] overflow-hidden bg-white border border-line rounded-md">
            <div className="absolute top-0 inset-x-0 h-11 bg-gradient-to-b from-white to-transparent z-10" />
            <div className="absolute bottom-0 inset-x-0 h-11 bg-gradient-to-t from-white to-transparent z-10" />
            <div className="px-6" style={{ animation: 'mScroll 14s linear infinite' }}>
              {[...RUBRIC_CRITERIA, ...RUBRIC_CRITERIA].map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-line/60">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-primary-50 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  <span className="text-sm text-ink/80 font-medium">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOOLS (showcase + yönlendirme) ===== */}
      <section id="tools" className="max-w-6xl mx-auto px-6 py-20 md:py-[88px]">
        <div className="reveal text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700 mb-4">Araçlar</div>
          <h2 className="font-serif font-medium text-4xl md:text-[44px] leading-[1.1] tracking-[-0.015em] mb-3.5">Üç araç, üç odaklı alan</h2>
          <p className="text-lg text-ink/60">Tez analizi, kaynak formatlama ve özet — her biri kendi sayfasında.</p>
        </div>

        <div className="reveal max-w-3xl mx-auto">
          <div className="relative flex justify-center gap-2 border-b border-line mb-7">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 px-2 py-3.5 text-[15px] font-bold transition-colors border-b-2 -mb-px ${
                  activeTab === t.key ? 'text-ink border-primary-700' : 'text-ink/40 border-transparent hover:text-ink/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-line rounded-md shadow-[0_26px_60px_-40px_rgba(28,26,23,0.4)] p-6 md:p-8 min-h-[300px]">
            {/* Tez Analizi önizleme */}
            {activeTab === 'upload' && (
              <div className="grid md:grid-cols-2 gap-7 items-center" style={{ animation: 'slideKey .4s ease' }}>
                <div>
                  <h3 className="font-serif text-[25px] font-semibold mb-3">Sayfa sayfa, kategori kategori</h3>
                  <p className="text-[15.5px] leading-relaxed text-ink/60 mb-5">Format, kaynakça, akademik dil ve bütünlük ayrı ayrı puanlanır. Her bulgu sayfa numarasıyla işaretlenir.</p>
                  <div className="flex flex-col gap-3.5">
                    {[{ l: 'Format & Düzen', p: 92, c: '#15803d' }, { l: 'Kaynakça (APA 7)', p: 74, c: '#b45309' }, { l: 'Akademik Dil', p: 88, c: '#15803d' }, { l: 'Bütünlük', p: 81, c: '#1e3a8a' }].map((b) => (
                      <div key={b.l}>
                        <div className="flex justify-between mb-1.5"><span className="text-[13px] font-medium text-ink/80">{b.l}</span><span className="font-serif text-base font-semibold" style={{ color: b.c }}>{b.p}</span></div>
                        <div className="h-1.5 rounded-sm bg-line/70 overflow-hidden"><div className="h-full rounded-sm" style={{ width: `${b.p}%`, background: b.c }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-paper border border-line rounded-md p-5">
                  <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-ink/40 mb-3">Bulgular</div>
                  <div className="flex flex-col gap-2.5">
                    {[{ ic: '!', bg: '#fdf0d8', col: '#b45309', bd: '#f5e4c0', t: 'APA kaynak formatı', p: 's. 12', d: 'Üç kaynakta yıl parantez dışında.' }, { ic: '!', bg: '#fdf0d8', col: '#b45309', bd: '#f5e4c0', t: 'Başlık hiyerarşisi', p: 's. 34', d: 'Alt başlıkları italik yapın.' }, { ic: '✓', bg: '#dcefe1', col: '#15803d', bd: '#c4e3cc', t: 'Kenar boşlukları', p: 'tümü', d: 'Yönergeye tamamen uygun.' }].map((f, i) => (
                      <div key={i} className="flex gap-2.5 items-start bg-white rounded-md px-3 py-2.5" style={{ border: `1px solid ${f.bd}` }}>
                        <span className="w-[22px] h-[22px] shrink-0 rounded-[5px] flex items-center justify-center text-[13px] font-extrabold" style={{ background: f.bg, color: f.col }}>{f.ic}</span>
                        <div><div className="text-[13px] font-bold">{f.t} <span className="text-[11px] font-semibold text-ink/40">· {f.p}</span></div><div className="text-[12.5px] leading-snug text-ink/55 mt-0.5">{f.d}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Kaynak Formatla önizleme */}
            {activeTab === 'citation' && (
              <div style={{ animation: 'slideKey .4s ease' }}>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h3 className="font-serif text-[25px] font-semibold">Kaynağını biçimlendir</h3>
                  <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-[13px] font-bold px-3.5 py-2 rounded-md">APA 7 · MLA · Chicago · IEEE</span>
                </div>
                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3.5 items-center">
                  <div className="bg-paper border border-dashed border-line rounded-md p-4">
                    <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-ink/40 mb-2">Girdi</div>
                    <div className="text-[13.5px] leading-relaxed text-ink/60">yılmaz, ahmet. yapay zeka ve egitim. 2021, ankara üniversitesi yayınları sayfa 45-60</div>
                  </div>
                  <div className="flex justify-center"><span className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center"><ArrowRight className="h-4 w-4 text-white" /></span></div>
                  <div className="bg-primary-50 border border-primary-100 rounded-md p-4">
                    <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-primary-700 mb-2">Çıktı · APA 7</div>
                    <div className="font-serif text-sm leading-relaxed">Yılmaz, A. (2021). <em>Yapay zekâ ve eğitim</em> (ss. 45-60). Ankara Üniversitesi Yayınları.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Özet önizleme */}
            {activeTab === 'abstract' && (
              <div className="grid md:grid-cols-2 gap-7 items-center" style={{ animation: 'slideKey .4s ease' }}>
                <div>
                  <h3 className="font-serif text-[25px] font-semibold mb-3">Net, kısa, düzenlenebilir özet</h3>
                  <p className="text-[15.5px] leading-relaxed text-ink/60 mb-5">Tezinin tamamından Türkçe, İngilizce veya her ikisinde akıcı bir özet üretilir. Kelime sınırına uygun ve düzenlemeye hazır.</p>
                  <div className="flex gap-2">
                    {[['Türkçe', true], ['İngilizce', false], ['Her ikisi', false]].map(([l, a]) => (
                      <span key={l as string} className={`text-[13px] font-bold px-3.5 py-2 rounded ${a ? 'bg-primary-600 text-white' : 'bg-paper text-ink/60'}`}>{l}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-paper border border-line rounded-md p-5">
                  <div className="flex justify-between items-center mb-2.5"><span className="text-[11px] font-bold tracking-[0.1em] uppercase text-ink/40">Üretilen özet</span><span className="text-[11.5px] font-bold text-primary-700">198 kelime</span></div>
                  <p className="font-serif text-[14.5px] leading-relaxed text-ink/80 m-0">Bu çalışma, yapay zekâ destekli araçların lisansüstü tez yazım sürecindeki rolünü incelemektedir. Nicel ve nitel yöntemlerin birlikte kullanıldığı araştırmada, format denetiminin yazarların düzeltmeye ayırdığı süreyi belirgin biçimde azalttığı bulunmuştur.</p>
                </div>
              </div>
            )}
          </div>

          {/* yönlendirme CTA */}
          <div className="text-center mt-7">
            <Link href={toolCta.href} className="inline-flex items-center gap-2 bg-primary-600 text-white text-base font-semibold px-7 py-3.5 rounded-md shadow-[0_12px_26px_-12px_rgba(30,58,138,0.6)] hover:bg-primary-700 hover:-translate-y-0.5 transition-all">
              {toolCta.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW ===== */}
      <section id="how" className="bg-white border-y border-line">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-[88px]">
          <div className="reveal max-w-xl mx-auto mb-14 text-center">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700 mb-4">Nasıl çalışır</div>
            <h2 className="font-serif font-medium text-4xl md:text-[44px] leading-[1.1] tracking-[-0.015em]">Üç adımda hazır</h2>
          </div>
          <div className="grid md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className={`reveal px-8 ${i < 2 ? 'md:border-r border-line' : ''}`}>
                <div className="font-serif text-4xl font-medium text-primary-700 leading-none mb-4">{s.n}</div>
                <h3 className="font-serif text-xl font-semibold mb-2.5">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink/55">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 md:py-[88px]">
        <div className="reveal text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700 mb-4">Fiyatlandırma</div>
          <h2 className="font-serif font-medium text-4xl md:text-[44px] leading-[1.1] tracking-[-0.015em] mb-3.5">Sadece kullandığın kadar öde</h2>
          <p className="text-lg text-ink/60">Abonelik yok, aylık ücret yok. Kredilerin asla sona ermez.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-line rounded-md overflow-hidden bg-white">
          {Object.values(CREDIT_PACKAGES).map((pkg, i) => (
            <div key={pkg.id} className={`reveal relative flex flex-col p-7 border-line ${i < 3 ? 'lg:border-r' : ''} ${i < 2 ? 'sm:border-r lg:border-r' : ''} ${i < 2 ? 'border-b sm:border-b-0' : ''} ${pkg.popular ? 'bg-primary-50' : ''}`}>
              {pkg.popular && <span className="absolute top-0 inset-x-0 h-[3px] bg-primary-700" />}
              <div className="text-[13px] font-bold tracking-[0.05em] uppercase mb-4" style={{ color: pkg.popular ? '#1e3a8a' : 'rgba(28,26,23,0.5)' }}>{pkg.name}</div>
              <div className="font-serif text-[42px] font-semibold leading-none mb-1.5">₺{pkg.priceUsd}</div>
              <div className="text-sm text-ink/60 mb-1"><strong className="text-primary-700 font-bold">{pkg.totalCredits}</strong> kredi</div>
              <div className="text-[12.5px] font-semibold text-green-700 min-h-[18px] mb-5">{pkg.bonusCredits > 0 ? `+${pkg.bonusCredits} bonus dahil` : ''}</div>
              <div className="flex flex-col gap-2 mb-6 flex-1">
                <div className="flex gap-2 text-[13.5px] text-ink/60"><span className="text-primary-700 font-bold">·</span>~{Math.floor(pkg.totalCredits / CREDIT_COSTS.thesis_standard.creditsRequired)} tez analizi</div>
                <div className="flex gap-2 text-[13.5px] text-ink/60"><span className="text-primary-700 font-bold">·</span>~{Math.floor(pkg.totalCredits / CREDIT_COSTS.abstract_generate.creditsRequired)} özet</div>
                <div className="flex gap-2 text-[13.5px] text-ink/60"><span className="text-primary-700 font-bold">·</span>~{pkg.totalCredits} kaynak</div>
              </div>
              <Link href="/pricing" className={`text-center py-3 rounded-md text-sm font-bold transition-all hover:-translate-y-0.5 ${pkg.popular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-ink text-white hover:opacity-90'}`}>Satın Al</Link>
            </div>
          ))}
        </div>

        <div className="reveal max-w-xl mx-auto mt-11">
          <h3 className="font-serif text-xl font-semibold text-center mb-4">Kredi maliyetleri</h3>
          {creditCostInfo.map((c, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-line last:border-0">
              <div><span className="text-[14.5px] text-ink/80">{c.action}</span>{c.note && <span className="text-[12.5px] text-ink/40 ml-2">{c.note}</span>}</div>
              <span className="font-serif text-base font-semibold text-primary-700 whitespace-nowrap">{c.credits} kredi</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="bg-white border-t border-line">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <h2 className="reveal font-serif font-medium text-3xl md:text-[38px] leading-[1.1] tracking-[-0.015em] text-center mb-11">Sık sorulan sorular</h2>
          <div>
            {FAQS.map((f, i) => (
              <div key={i} className="reveal border-b border-line">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
                  <span className="font-serif text-lg font-semibold">{f.q}</span>
                  <span className={`text-2xl text-primary-700 leading-none transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openFaq === i ? 240 : 0, opacity: openFaq === i ? 1 : 0 }}>
                  <p className="text-[15px] leading-relaxed text-ink/60 pb-5">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <div className="reveal">
        <CtaBand
          title="Tez yazımına bugün başla"
          subtitle="Kayıt ol, 10 ücretsiz kredini hemen kullan."
          ctaLabel="Ücretsiz başla"
          ctaHref="/auth?mode=signup"
        />
      </div>
    </main>
  );
}
