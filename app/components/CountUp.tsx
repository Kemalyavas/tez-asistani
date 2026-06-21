'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  duration?: number;
  /** tr-TR binlik ayraçlı göster (1.000 gibi). */
  group?: boolean;
}

/**
 * Görünür olunca 0'dan hedefe sayan küçük animasyon. prefers-reduced-motion'da
 * doğrudan son değeri gösterir. rAF kısıtlanırsa (arka plan sekmesi vb.) bir
 * güvenlik timeout'u son değeri yine de garanti eder.
 */
export default function CountUp({ to, duration = 1400, group = true }: CountUpProps) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let safety: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setVal(to);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    let started = false;
    const animate = () => {
      if (started) return;
      started = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setVal(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
        else finish();
      };
      raf = requestAnimationFrame(tick);
      safety = setTimeout(finish, duration + 400); // rAF kısıtlanırsa garanti
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (safety) clearTimeout(safety);
    };
  }, [to, duration]);

  const rounded = Math.round(val);
  return <span ref={ref}>{group ? rounded.toLocaleString('tr-TR') : rounded}</span>;
}
