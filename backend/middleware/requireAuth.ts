import type { Request, Response, NextFunction } from 'express';
import { verifySessionJwt } from '../services/userAuthService.js';
import { openDb } from '../db.js';

// Augment Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        avatarUrl: string;
        role: 'admin' | 'creator';
        orgId: number | null;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.ns_session;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const payload = verifySessionJwt(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE id = ?', [Number(payload.sub)]);

  if (!user || !user.is_active) {
    res.status(401).json({ error: 'Account not found or deactivated' });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    role: user.role,
    orgId: user.org_id,
  };

  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}
