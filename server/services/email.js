const RESET_FROM = process.env.RESEND_FROM || 'MNOONX <noreply@mnoonx.fun>';
const IS_PROD = process.env.NODE_ENV === 'production';
const DEV_REDIRECT = !IS_PROD ? process.env.RESEND_DEV_REDIRECT?.trim() : '';

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'missing_api_key' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESET_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[email] Resend error', res.status, body);
    return { ok: false, reason: 'send_failed', status: res.status, detail: body };
  }

  return { ok: true };
}

async function sendPasswordResetEmail({ to, code, locale = 'en' }) {
  const isRu = locale === 'ru';
  const devNote =
    DEV_REDIRECT && DEV_REDIRECT !== to
      ? isRu
        ? `<p style="font-size:13px;color:#737373;margin-top:16px">Письмо перенаправлено в dev-режиме. Аккаунт: <strong>${to}</strong></p>`
        : `<p style="font-size:13px;color:#737373;margin-top:16px">Dev redirect — account: <strong>${to}</strong></p>`
      : '';
  const subject = isRu ? 'Код для сброса пароля MNOONX' : 'Your MNOONX password reset code';
  const html = isRu
    ? `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#171717">
        <p style="font-size:16px;margin-bottom:8px">Здравствуйте,</p>
        <p style="font-size:15px;line-height:1.5;color:#525252">Используйте этот код для сброса пароля. Он действует 15 минут.</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:0.25em;margin:24px 0">${code}</p>
        <p style="font-size:13px;color:#737373">Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>
        ${devNote}
      </div>`
    : `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#171717">
        <p style="font-size:16px;margin-bottom:8px">Hello,</p>
        <p style="font-size:15px;line-height:1.5;color:#525252">Use this code to reset your password. It expires in 15 minutes.</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:0.25em;margin:24px 0">${code}</p>
        <p style="font-size:13px;color:#737373">If you did not request a reset, you can ignore this email.</p>
        ${devNote}
      </div>`;
  const text = isRu
    ? `Код для сброса пароля MNOONX: ${code}\nДействует 15 минут.`
    : `Your MNOONX password reset code: ${code}\nExpires in 15 minutes.`;

  const recipient = DEV_REDIRECT || to;
  if (DEV_REDIRECT && DEV_REDIRECT !== to) {
    console.log(`[password-reset] Dev redirect → ${DEV_REDIRECT} (account: ${to})`);
  }

  const result = await sendViaResend({ to: recipient, subject, html, text });

  if (!result.ok && !IS_PROD) {
    console.log('\n[password-reset] ─────────────────────────────────');
    console.log(`[password-reset] Email to: ${to}`);
    console.log(`[password-reset] CODE: ${code}`);
    if (result.status === 403) {
      console.log(
        '[password-reset] Resend sandbox: letters go ONLY to your Resend account email.',
      );
      console.log('[password-reset] Verify a domain at resend.com/domains for any recipient.');
    }
    console.log('[password-reset] ─────────────────────────────────\n');
    return { ok: true, devFallback: true };
  }

  if (result.ok) {
    console.log(`[password-reset] Email sent to ${recipient}${recipient !== to ? ` (account: ${to})` : ''}`);
  }

  return result;
}

module.exports = {
  sendPasswordResetEmail,
};
