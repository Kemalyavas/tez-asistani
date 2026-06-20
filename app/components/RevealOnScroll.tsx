'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Sayfadaki tüm `.reveal` öğelerini izler ve görünür olduklarında `.is-visible`
 * ekler. Gizleme yalnızca JS `.reveal-ready` ekledikten sonra başlar; böylece
 * JS kapalıyken içerik gizlenmez (SEO/erişilebilirlik güvenli).
 * Rota değişiminde yeniden tarar.
 */
export default function RevealOnScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (els.length === 0) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.forEach((el) => el.classList.add('reveal-ready'));

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -7% 0px' }
    );

    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
