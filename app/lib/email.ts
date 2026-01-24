import { Resend } from 'resend';

// Lazy initialization - only create client when needed (not at build time)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from = 'TezAI <noreply@tezai.app>' } = options;

  // Skip email if RESEND_API_KEY is not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not configured, skipping email to:', to);
    return { success: true, skipped: true };
  }

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Email gönderilemedi' };
  }
}

// Analiz tamamlandı bildirimi
export async function sendAnalysisCompletedEmail(params: {
  to: string;
  userName: string;
  documentName: string;
  overallScore: number;
  gradeLetter: string;
  gradeLabel: string;
  documentId: string;
}) {
  const { to, userName, documentName, overallScore, gradeLetter, gradeLabel, documentId } = params;

  const scoreColor =
    overallScore >= 85
      ? '#10B981'
      : overallScore >= 70
      ? '#F59E0B'
      : overallScore >= 50
      ? '#F97316'
      : '#EF4444';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">TezAI</h1>
      <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Yapay Zeka Destekli Tez Analizi</p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 20px 0;">
        Merhaba ${userName},
      </h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        <strong>"${documentName}"</strong> dosyanızın analizi tamamlandı!
      </p>

      <!-- Score Box -->
      <div style="background: #f9fafb; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
        <div style="display: inline-block; width: 100px; height: 100px; border-radius: 50%; border: 4px solid ${scoreColor}; line-height: 92px; background: white;">
          <span style="font-size: 32px; font-weight: bold; color: #1f2937;">${overallScore}</span>
        </div>
        <div style="margin-top: 15px;">
          <span style="display: inline-block; background: ${scoreColor}; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 18px;">
            ${gradeLetter}
          </span>
        </div>
        <p style="color: #4b5563; font-size: 16px; margin: 10px 0 0 0;">${gradeLabel}</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/analyses/${documentId}"
           style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Detaylı Sonuçları Gör
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
        Raporda şunları bulacaksınız:
      </p>
      <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 10px 0 0 0; padding-left: 20px;">
        <li>Yapı ve organizasyon değerlendirmesi</li>
        <li>Metodoloji analizi</li>
        <li>Yazım kalitesi puanlaması</li>
        <li>Kaynak ve atıf değerlendirmesi</li>
        <li>Düzeltilmesi gereken noktalar</li>
        <li>Geliştirme önerileri</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Bu email TezAI tarafından otomatik olarak gönderilmiştir.</p>
      <p style="margin: 5px 0 0 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #3b82f6; text-decoration: none;">tezai.app</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to,
    subject: `✅ Tez Analiziniz Tamamlandı - ${overallScore}/100`,
    html,
  });
}

// Analiz başarısız bildirimi
export async function sendAnalysisFailedEmail(params: {
  to: string;
  userName: string;
  documentName: string;
  errorMessage: string;
  creditsRefunded: number;
}) {
  const { to, userName, documentName, errorMessage, creditsRefunded } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">TezAI</h1>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 20px 0;">
        Merhaba ${userName},
      </h2>

      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="color: #dc2626; font-weight: bold; margin: 0 0 5px 0;">Analiz Başarısız</p>
        <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
          "${documentName}" dosyanızın analizi sırasında bir hata oluştu.
        </p>
      </div>

      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        <strong>Hata detayı:</strong> ${errorMessage}
      </p>

      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="color: #065f46; margin: 0; font-size: 14px;">
          <strong>${creditsRefunded} kredi</strong> hesabınıza iade edildi.
        </p>
      </div>

      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        Lütfen dosyanızı kontrol edip tekrar deneyin. Sorun devam ederse destek ekibimizle iletişime geçebilirsiniz.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}"
           style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Tekrar Dene
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Bu email TezAI tarafından otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to,
    subject: `❌ Tez Analizi Başarısız - Krediniz İade Edildi`,
    html,
  });
}

// Hoş geldin emaili
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  freeCredits: number;
}) {
  const { to, userName, freeCredits } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">🎓 TezAI'ya Hoş Geldiniz!</h1>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 20px 0;">
        Merhaba ${userName},
      </h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        TezAI ailesine katıldığınız için teşekkür ederiz! Yapay zeka destekli tez analiz platformumuzu keşfetmeye hazırsınız.
      </p>

      <!-- Bonus Box -->
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 10px 0;">Başlangıç Hediyeniz</p>
        <p style="color: white; font-size: 36px; font-weight: bold; margin: 0;">${freeCredits} Kredi</p>
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 10px 0 0 0;">İlk analizinizi hemen yapabilirsiniz!</p>
      </div>

      <h3 style="color: #1f2937; font-size: 16px; margin: 25px 0 15px 0;">TezAI ile neler yapabilirsiniz?</h3>
      <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>📝 Tezinizin yapısını ve organizasyonunu değerlendirin</li>
        <li>🔬 Metodoloji ve araştırma tasarımınızı analiz edin</li>
        <li>✍️ Yazım kalitesi ve akademik dil kontrolü yapın</li>
        <li>📚 Kaynak ve atıf formatlarınızı kontrol edin</li>
        <li>💡 Profesör tarzı geri bildirimler alın</li>
      </ul>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}"
           style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          İlk Analizinizi Yapın
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} TezAI - Yapay Zeka Destekli Tez Analiz Platformu</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to,
    subject: `🎉 TezAI'ya Hoş Geldiniz - ${freeCredits} Ücretsiz Kredi!`,
    html,
  });
}
