import { Router } from 'express';
import {
  buildLoginOAuthClient, getLoginAuthUrl, exchangeLoginCode,
  upsertGoogleUser, signSessionJwt, verifyPassword, hashPassword,
  createEmailToken, consumeEmailToken, isGenericDomain, getDomain,
  resolveOrgForEmail,
} from '../services/userAuthService.js';
import {
  sendVerificationEmail, sendAdminAccessRequestEmail, sendAccessApprovedEmail,
} from '../services/emailService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { openDb } from '../db.js';

const router = Router();

const SESSION_MS = Number(process.env.SESSION_DURATION_SECONDS || 86400) * 1000;
const IS_PROD = process.env.NODE_ENV === 'production';

function setSessionCookie(res: any, token: string) {
  res.cookie('ns_session', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: SESSION_MS,
    path: '/',
  });
}

// ── Google OAuth ───────────────────────────────────────────────────────────────

router.get('/auth/google', async (_req, res) => {
  const client = await buildLoginOAuthClient();
  if (!client) { res.status(500).json({ error: 'OAuth not configured' }); return; }
  const url = await getLoginAuthUrl(client);
  res.redirect(url);
});

router.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query as Record<string, string>;
  const frontendUrl = process.env.APP_URL || 'http://localhost:5173';

  if (error || !code) {
    res.redirect(`${frontendUrl}?auth_error=${error || 'missing_code'}`);
    return;
  }

  try {
    const client = await buildLoginOAuthClient();
    if (!client) throw new Error('OAuth not configured');

    const profile = await exchangeLoginCode(client, code);
    const result = await upsertGoogleUser(profile);

    const { user } = result;

    if (result.status === 'access_requested') {
      // Send request email to org admin
      const db = await openDb();
      const org = await db.get('SELECT * FROM organizations WHERE id = ?', [user.org_id]);
      const admin = await db.get(
        "SELECT email FROM users WHERE org_id = ? AND role = 'admin' AND is_active = 1 LIMIT 1",
        [user.org_id],
      );
      if (admin && org) {
        const approveToken = await createEmailToken(user.id, 'approve_access', 72);
        await sendAdminAccessRequestEmail(admin.email, user.email, approveToken);
      }
      res.redirect(`${frontendUrl}?auth_state=access_requested`);
      return;
    }

    const token = signSessionJwt(user.id, user.role, user.org_id);
    setSessionCookie(res, token);

    if (result.status === 'pending_org') {
      res.redirect(`${frontendUrl}?auth_state=onboarding`);
    } else {
      res.redirect(frontendUrl);
    }
  } catch (err: any) {
    console.error('[auth/callback]', err);
    const status = err.status === 403 ? 'deactivated' : 'error';
    res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}?auth_error=${status}`);
  }
});

// ── Email + Password ───────────────────────────────────────────────────────────

router.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'email, password and name are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  try {
    const db = await openDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const existingOrg = await resolveOrgForEmail(email);
    const passwordHash = await hashPassword(password);

    let userId: number;
    let responseStatus: string;

    if (existingOrg) {
      // Corporate domain with existing org → pending access
      const result = await db.run(
        `INSERT INTO users (email, name, password_hash, email_verified, is_active, org_id, role)
         VALUES (?, ?, ?, 0, 0, ?, 'creator')`,
        [email.toLowerCase(), name, passwordHash, existingOrg.id],
      );
      userId = result.lastID!;
      await db.run('INSERT INTO org_access_requests (user_id, org_id) VALUES (?, ?)', [userId, existingOrg.id]);
      responseStatus = 'access_requested';
    } else {
      // Generic or new corporate domain → create user, needs onboarding
      const result = await db.run(
        'INSERT INTO users (email, name, password_hash, email_verified, is_active) VALUES (?, ?, ?, 0, 1)',
        [email.toLowerCase(), name, passwordHash],
      );
      userId = result.lastID!;
      responseStatus = 'verify_email';
    }

    // Send verification email
    const token = await createEmailToken(userId, 'verify_email', 24);
    await sendVerificationEmail(email.toLowerCase(), token);

    res.json({ status: responseStatus });
  } catch (err: any) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  try {
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.email_verified) {
      res.status(403).json({ error: 'Please verify your email before logging in' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Your account has been deactivated' });
      return;
    }

    await db.run('UPDATE users SET last_login_at = datetime("now") WHERE id = ?', [user.id]);

    const token = signSessionJwt(user.id, user.role, user.org_id);
    setSessionCookie(res, token);

    res.json({
      status: user.org_id ? 'ok' : 'pending_org',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.org_id },
    });
  } catch (err: any) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/auth/verify-email', async (req, res) => {
  const { token } = req.query as Record<string, string>;
  const frontendUrl = process.env.APP_URL || 'http://localhost:5173';

  const result = await consumeEmailToken(token, 'verify_email');
  if (!result) {
    res.redirect(`${frontendUrl}?auth_error=invalid_token`);
    return;
  }

  const db = await openDb();
  await db.run('UPDATE users SET email_verified = 1 WHERE id = ?', [result.userId]);
  const user = await db.get('SELECT * FROM users WHERE id = ?', [result.userId]);

  // If pending access (corporate domain org exists) → just show success, no session
  if (!user.is_active) {
    const org = await db.get('SELECT * FROM organizations WHERE id = ?', [user.org_id]);
    const admin = await db.get(
      "SELECT email FROM users WHERE org_id = ? AND role = 'admin' AND is_active = 1 LIMIT 1",
      [user.org_id],
    );
    if (admin && org) {
      const approveToken = await createEmailToken(user.id, 'approve_access', 72);
      await sendAdminAccessRequestEmail(admin.email, user.email, approveToken);
    }
    res.redirect(`${frontendUrl}?auth_state=access_requested`);
    return;
  }

  const sessionToken = signSessionJwt(user.id, user.role, user.org_id);
  setSessionCookie(res, sessionToken);
  res.redirect(`${frontendUrl}?auth_state=${user.org_id ? 'ok' : 'onboarding'}`);
});

// ── Admin approval link ────────────────────────────────────────────────────────

router.get('/auth/approve-access', async (req, res) => {
  const { token } = req.query as Record<string, string>;
  const frontendUrl = process.env.APP_URL || 'http://localhost:5173';

  const result = await consumeEmailToken(token, 'approve_access');
  if (!result) {
    res.status(400).send('Link inválido ou expirado.');
    return;
  }

  const db = await openDb();
  await db.run('UPDATE users SET is_active = 1 WHERE id = ?', [result.userId]);
  await db.run(
    "UPDATE org_access_requests SET status = 'approved' WHERE user_id = ?",
    [result.userId],
  );

  const user = await db.get('SELECT * FROM users WHERE id = ?', [result.userId]);
  await sendAccessApprovedEmail(user.email);

  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0f0f;color:#fff;">
      <h2>Acesso aprovado!</h2>
      <p style="color:#aaa;">O utilizador <strong>${user.email}</strong> já pode entrar no Noiseless Studio.</p>
    </body></html>
  `);
});

// ── Session ────────────────────────────────────────────────────────────────────

router.post('/auth/logout', (_req, res) => {
  res.clearCookie('ns_session', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
