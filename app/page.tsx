'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FileUploader from './components/FileUploader';
import CitationFormatter from './components/CitationFormatter';
import AbstractGenerator from './components/AbstractGenerator';
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'citation' | 'abstract'>('upload');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // oturum bilgisi ileride gerekirse diye hazır; CTA'lar anchor scroll kullanıyor
    supabase.auth.getSession();
  }, [supabase]);

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

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Script id="structured-data-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.faq) }} />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-36 right-[-60px] w-[560px] h-[460px] rounded-full bg-primary-100/80 blur-3xl animate-glow-drift pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-[78px] grid lg:grid-cols-[1.06fr_0.94fr] gap-12 items-center">
          <div>
            <div className="reveal flex items-center gap-3 mb-7">
              <span className="w-9 h-px bg-primary-600" />
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700">Akademik yazım asistanı</span>
            </div>
            <h1 className="font-serif font-medium text-5xl md:text-[62px] leading-[1.06] tracking-[-0.018em] mb-6">
              Tezini{' '}
              <span className="relative italic text-primary-700">
                kusursuz
                <span className="absolute left-0 right-0 -bottom-0.5 h-[3px] bg-primary-700/80" />
              </span>{' '}
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
            <p className="reveal text-[15px] text-ink/55">
              Lisans, yüksek lisans ve doktora tezleri için — <span className="text-ink font-semibold">Türkçe akademik dile özel.</span>
            </p>
          </div>

          {/* Report card */}
          <div className="reveal relative">
            <div className="absolute -inset-3 left-6 bg-primary-50 rounded-md -z-0" aria-hidden="true" />
            <div className="relative bg-white border border-line rounded-md shadow-[0_30px_64px_-34px_rgba(28,26,23,0.4)] p-7 animate-float-y">
              <div className="flex justify-between items-center pb-4 border-b border-line">
                <span className="font-serif text-[17px] font-semibold">Analiz Raporu</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] uppercase text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Tamamlandı
                </span>
              </div>
              <div className="flex items-end gap-4 py-5">
                <span className="font-serif text-[60px] font-semibold leading-[0.9] text-primary-700">87</span>
                <div className="pb-1.5">
                  <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-ink/40 mb-0.5">Genel skor / 100</div>
                  <div className="font-serif italic text-lg">İyi durumda, az düzeltme</div>
                </div>
              </div>
              <svg viewBox="0 0 320 64" preserveAspectRatio="none" className="w-full h-16 mb-4">
                <defs>
                  <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,50 L40,44 L80,47 L120,33 L160,36 L200,23 L240,27 L280,13 L320,16 L320,64 L0,64 Z" fill="url(#sf)" />
                <path d="M0,50 L40,44 L80,47 L120,33 L160,36 L200,23 L240,27 L280,13 L320,16" fill="none" stroke="#1e3a8a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 760, strokeDashoffset: 760, animation: 'drawLine 1.7s cubic-bezier(.4,0,.2,1) .4s forwards' }} />
              </svg>
              <div className="flex flex-col border-t border-line">
                <div className="flex justify-between items-center py-3 border-b border-line/60">
                  <span className="text-sm text-ink/80">Kaynakça (APA 7)</span>
                  <span className="font-serif text-[17px] font-semibold text-amber-700">74</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-ink/80">Akademik dil</span>
                  <span className="font-serif text-[17px] font-semibold text-green-700">88</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAND (honest facts only) ===== */}
      <section className="reveal bg-primary-700">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4">
          {[
            { value: '50+', label: 'akademik kriter' },
            { value: '4', label: 'atıf formatı' },
            { value: '10', label: 'kayıtta ücretsiz kredi' },
            { value: 'Sayfa', label: 'bazlı kanıt' },
          ].map((s, i) => (
            <div key={i} className={`px-6 text-center ${i < 3 ? 'md:border-r border-white/15' : ''}`}>
              <div className="font-serif text-[34px] font-semibold text-white leading-none">{s.value}</div>
              <div className="text-[13px] text-primary-100 mt-2">{s.label}</div>
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

      {/* ===== TOOLS (real components) ===== */}
      <section id="tools" className="max-w-6xl mx-auto px-6 py-20 md:py-[88px]">
        <div className="reveal text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700 mb-4">Araçlar</div>
          <h2 className="font-serif font-medium text-4xl md:text-[44px] leading-[1.1] tracking-[-0.015em] mb-3.5">Tek panelde üç araç</h2>
          <p className="text-lg text-ink/60">Tez analizi, kaynak formatlama ve özet — hepsi burada.</p>
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
          <div className="bg-white border border-line rounded-md shadow-[0_26px_60px_-40px_rgba(28,26,23,0.4)] p-6 md:p-8">
            {activeTab === 'upload' && <FileUploader />}
            {activeTab === 'citation' && <CitationFormatter />}
            {activeTab === 'abstract' && <AbstractGenerator />}
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
      <section className="relative overflow-hidden bg-primary-700">
        <div className="absolute -top-24 right-[-50px] w-80 h-80 rounded-full bg-white/10 blur-2xl animate-glow-drift pointer-events-none" aria-hidden="true" />
        <div className="reveal relative max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-serif font-medium text-4xl md:text-[46px] leading-[1.1] tracking-[-0.015em] text-white mb-4">Tez yazımına bugün başla</h2>
          <p className="text-lg md:text-xl text-primary-100 mb-8">Kayıt ol, 10 ücretsiz kredini hemen kullan.</p>
          <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 bg-white text-primary-700 text-base font-bold px-8 py-4 rounded-md hover:-translate-y-0.5 transition-transform">
            Ücretsiz başla <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
