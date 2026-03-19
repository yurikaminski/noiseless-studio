import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAuth.js';
import { openDb } from '../db.js';

const router = Router();

// GET /api/org/members — list all org members
router.get('/members', requireAdmin, async (req, res) => {
  const db = await openDb();
  const members = await db.all(
    `SELECT id, email, name, avatar_url, role, is_active, created_at, last_login_at
     FROM users WHERE org_id = ? ORDER BY created_at ASC`,
    [req.user!.orgId],
  );
  res.json(members);
});

// PUT /api/org/members/:id/role — change member role
router.put('/members/:id/role', requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  const { role } = req.body;

  if (!['admin', 'creator'].includes(role)) {
    res.status(400).json({ error: 'role must be admin or creator' });
    return;
  }
  if (targetId === req.user!.id) {
    res.status(400).json({ error: 'Cannot change your own role' });
    return;
  }

  const db = await openDb();
  const member = await db.get(
    'SELECT id FROM users WHERE id = ? AND org_id = ?',
    [targetId, req.user!.orgId],
  );
  if (!member) { res.status(404).json({ error: 'User not found in your org' }); return; }

  await db.run('UPDATE users SET role = ? WHERE id = ?', [role, targetId]);
  res.json({ ok: true });
});

// DELETE /api/org/members/:id — deactivate member
router.delete('/members/:id', requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);

  if (targetId === req.user!.id) {
    res.status(400).json({ error: 'Cannot deactivate yourself' });
    return;
  }

  const db = await openDb();
  const member = await db.get(
    'SELECT id FROM users WHERE id = ? AND org_id = ?',
    [targetId, req.user!.orgId],
  );
  if (!member) { res.status(404).json({ error: 'User not found in your org' }); return; }

  await db.run('UPDATE users SET is_active = 0 WHERE id = ?', [targetId]);
  res.json({ ok: true });
});

// POST /api/org/setup — called from OnboardingScreen to create the org
router.post('/setup', async (req, res) => {
  // User must be logged in (cookie) but may not have an org yet
  const token = req.cookies?.ns_session;
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { verifySessionJwt } = await import('../services/userAuthService.js');
  const payload = verifySessionJwt(token);
  if (!payload) { res.status(401).json({ error: 'Invalid session' }); return; }

  const { name, type } = req.body;
  if (!name || !type) { res.status(400).json({ error: 'name and type are required' }); return; }

  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE id = ?', [Number(payload.sub)]);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  if (user.org_id) { res.status(400).json({ error: 'User already belongs to an org' }); return; }

  const domain = user.email.split('@')[1]?.toLowerCase();
  const { isGenericDomain } = await import('../services/userAuthService.js');
  const orgDomain = isGenericDomain(user.email) ? null : domain;

  const result = await db.run(
    'INSERT INTO organizations (name, domain, type) VALUES (?, ?, ?)',
    [name, orgDomain, type],
  );
  const orgId = result.lastID!;

  await db.run(
    "UPDATE users SET org_id = ?, role = 'admin' WHERE id = ?",
    [orgId, user.id],
  );

  const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);

  // Re-issue cookie with updated orgId + role
  const { signSessionJwt } = await import('../services/userAuthService.js');
  const newToken = signSessionJwt(updatedUser.id, updatedUser.role, updatedUser.org_id);
  const IS_PROD = process.env.NODE_ENV === 'production';
  res.cookie('ns_session', newToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: Number(process.env.SESSION_DURATION_SECONDS || 86400) * 1000,
    path: '/',
  });

  res.json({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    avatarUrl: updatedUser.avatar_url,
    role: updatedUser.role,
    orgId: updatedUser.org_id,
  });
});

export default router;
