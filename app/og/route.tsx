import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'TezAI – Yapay Zeka Tez Asistanı'
  const subtitle = searchParams.get('subtitle') || 'APA/MLA/Chicago Kaynakça • Özet • Tez Analizi'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #111827 100%)',
          color: 'white',
          padding: '80px',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 16px',
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 9999,
            fontSize: 28,
            marginBottom: 24,
          }}
        >
          {'\uD83C\uDF93'} Akademik Yaz\u0131m
        </div>

        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 36, opacity: 0.9, marginTop: 16 }}>{subtitle}</div>

        <div style={{ display: 'flex', marginTop: 48, alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            {'🎓'}
          </div>
          <div style={{ fontSize: 28, opacity: 0.95 }}>tezai.com.tr</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
