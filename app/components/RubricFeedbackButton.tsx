'use client';

// app/components/RubricFeedbackButton.tsx
// ============================================================================
// Bir rubric bulgusu için "yanlış / eksik / yorum hatalı" geri bildirim butonu
// ============================================================================
//
// Her issue card'ında render edilir. Tıklayınca pop-up açılır, tip seçilir
// (false_positive / incomplete / wrong_comment / other) + opsiyonel not yazılır,
// gönderilir. Aynı bulgu tekrar gönderilirse mevcut feedback güncellenir
// (DB UNIQUE + upsert).
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Flag, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const FEEDBACK_OPTIONS = [
  {
    value: 'false_positive',
    label: 'Bu bulgu hatalı',
    desc: 'AI yanlış işaretlemiş; bu kriter aslında karşılanmış.',
  },
  {
    value: 'incomplete',
    label: 'Eksik / kapsamsız',
    desc: 'Tespit doğru ama açıklama yetersiz veya yüzeysel.',
  },
  {
    value: 'wrong_comment',
    label: 'Yorum yanlış / alakasız',
    desc: 'Yorum, tezde olan duruma uymuyor.',
  },
  {
    value: 'other',
    label: 'Diğer',
    desc: 'Yukarıdakilerden biri değil; notta açıklayın.',
  },
] as const;

type FeedbackType = typeof FEEDBACK_OPTIONS[number]['value'];

interface RubricFeedbackButtonProps {
  documentId: string;
  rubricItemId: string;
  // Opsiyonel: parent ödü zaten "bildirildi" durumunu biliyorsa initialState verir.
  alreadySubmitted?: boolean;
}

export default function RubricFeedbackButton({
  documentId,
  rubricItemId,
  alreadySubmitted = false,
}: RubricFeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [selectedType, setSelectedType] = useState<FeedbackType>('false_positive');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal erişilebilirliği: Esc ile kapatma, açılışta odak yönetimi, focus-trap (WCAG 2.1.2 / 2.4.3)
  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    const focusables = modal
      ? Array.from(
          modal.querySelectorAll<HTMLElement>(
            'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled'))
      : [];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'Tab' && focusables.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rubric/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          rubricItemId,
          feedbackType: selectedType,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Geri bildirim gönderilemedi');
      }
      setSubmitted(true);
      setOpen(false);
      setNote('');
      toast.success('Geri bildiriminiz alındı, teşekkürler.');
    } catch (err: any) {
      toast.error(err.message || 'Geri bildirim gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (!documentId || !rubricItemId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition ${
          submitted
            ? 'text-green-700 bg-green-50 hover:bg-green-100'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title={submitted ? 'Geri bildirim alındı' : 'Bu bulgu hakkında geri bildir'}
      >
        {submitted ? (
          <>
            <Check className="h-3 w-3" />
            Bildirildi
          </>
        ) : (
          <>
            <Flag className="h-3 w-3" />
            Geri bildir
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rubric-feedback-title"
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="rubric-feedback-title" className="text-lg font-semibold text-gray-900">Geri Bildirim</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Bu bulguyu nasıl değerlendirirsiniz?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {FEEDBACK_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedType === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="feedback-type"
                    value={opt.value}
                    checked={selectedType === opt.value}
                    onChange={() => setSelectedType(opt.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Not (opsiyonel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Detay eklemek isterseniz..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {note.length}/1000
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 rounded-lg"
              >
                {loading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
