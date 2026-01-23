import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/app/lib/queue/qstash';

export async function POST(request: NextRequest) {
  try {
    // QStash signature doğrulama
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    if (signature && process.env.QSTASH_CURRENT_SIGNING_KEY) {
      const isValid = await verifyQStashSignature(signature, body);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const callbackData = JSON.parse(body);

    console.log('[Callback] Job completed:', {
      messageId: callbackData.messageId,
      status: callbackData.status,
      url: callbackData.url,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Callback] Error:', error);
    return NextResponse.json(
      { error: 'Callback işleme hatası' },
      { status: 500 }
    );
  }
}
