import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const FROM = 'Noiseless Studio <noreply@noiseless.studio>';

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Confirme o seu email — Noiseless Studio',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#fff;border-radius:16px;">
        <h2 style="margin:0 0 16px;font-weight:300;font-size:24px;">Noiseless Studio</h2>
        <p style="color:#aaa;margin:0 0 24px;">Clique no botão abaixo para confirmar o seu email e ativar a sua conta.</p>
        <a href="${link}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;">
          Confirmar email
        </a>
        <p style="color:#555;font-size:12px;margin:24px 0 0;">Este link expira em 24 horas. Se não criou uma conta, ignore este email.</p>
      </div>
    `,
  });
}

export async function sendAdminAccessRequestEmail(
  adminEmail: string,
  requesterEmail: string,
  approveToken: string,
): Promise<void> {
  const approveLink = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/user/auth/approve-access?token=${approveToken}`;
  await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Novo pedido de acesso — ${requesterEmail}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#fff;border-radius:16px;">
        <h2 style="margin:0 0 16px;font-weight:300;font-size:24px;">Noiseless Studio</h2>
        <p style="color:#aaa;margin:0 0 8px;">
          <strong style="color:#fff;">${requesterEmail}</strong> está solicitando um acesso ao Noiseless Studio.
        </p>
        <p style="color:#aaa;margin:0 0 24px;">Clique abaixo para aprovar o acesso.</p>
        <a href="${approveLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;">
          Libere aqui
        </a>
        <p style="color:#555;font-size:12px;margin:24px 0 0;">Se não reconhece este pedido, ignore este email.</p>
      </div>
    `,
  });
}

export async function sendAccessApprovedEmail(to: string): Promise<void> {
  const link = `${APP_URL}`;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Acesso aprovado — Noiseless Studio',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#fff;border-radius:16px;">
        <h2 style="margin:0 0 16px;font-weight:300;font-size:24px;">Noiseless Studio</h2>
        <p style="color:#aaa;margin:0 0 24px;">O seu acesso foi aprovado. Já pode entrar na plataforma.</p>
        <a href="${link}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;">
          Entrar agora
        </a>
      </div>
    `,
  });
}
