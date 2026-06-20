import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CtaBandProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** Dış kapsayıcı max genişliği (örn. 'max-w-3xl'). Varsayılan landing genişliği. */
  maxWidth?: string;
}

/**
 * Editöryel lacivert CTA bandı — tek kaynak. Zengin gradient + yumuşak ışıma +
 * ince iç çerçeve ile düz koyu blok yerine derinlikli, premium görünüm.
 */
export default function CtaBand({ title, subtitle, ctaLabel, ctaHref, maxWidth = 'max-w-5xl' }: CtaBandProps) {
  return (
    <section className="px-6 py-8">
      <div className={`${maxWidth} mx-auto relative overflow-hidden rounded-2xl ring-1 ring-white/10 bg-gradient-to-br from-[#16265c] via-[#1e3a8a] to-[#2f54a6] px-8 py-16 text-center shadow-[0_40px_80px_-40px_rgba(20,34,79,0.7)]`}>
        {/* yumuşak ışımalar */}
        <div className="pointer-events-none absolute -top-28 right-[-60px] w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(157,184,240,0.28),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-32 left-[-50px] w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(94,124,196,0.22),transparent_70%)]" />
        {/* üst ince parlama */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative">
          <h2 className="font-serif font-medium text-3xl md:text-[40px] leading-[1.1] tracking-[-0.015em] text-white mb-3">
            {title}
          </h2>
          <p className="text-lg text-primary-100/90 mb-8 max-w-xl mx-auto">{subtitle}</p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 bg-white text-primary-800 text-base font-bold px-8 py-4 rounded-xl shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-transform"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
