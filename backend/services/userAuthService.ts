import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { openDb } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOGIN_SCOPES = ['openid', 'email', 'profile'];

// Generic email domains that get their own org instead of domain-matching
const GENERIC_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr',
  'outlook.com', 'outlook.co.uk', 'outlook.fr',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.es',
  'icloud.com', 'me.com', 'mac.com',
  'live.com', 'live.co.uk',
  'msn.com',
  'protonmail.com', 'proton.me',
  'tutanota.com',
  'aol.com',
  'yandex.com', 'yandex.ru',
  'mail.com',
]);

// ── Helpers ────────────────────────────────────────────────────────────────────

function getCredentialsPath() {
  return path.resolve(
    process.env.GOOGLE_OAUTH_CLIENT_FILE ||
    path.join(__dirname, '../../credentials/oauth_client.json')
  );
}

export function isGenericDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !domain || GENERIC_DOMAINS.has(domain);
}

export function getDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

// ── Google OAuth (login flow) ─────────────────────────────────────────────────

export async function buildLoginOAuthClient(): Promise<OAuth2Client | null> {
  const credPath = getCredentialsPath();
  if (!fs.existsSync(credPath)) return null;
  const { google } = await import('googleapis');
  const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  const { client_secret, client_id } = creds.installed || creds.web;
  const redirectUri = process.env.LOGIN_REDIRECT_URI || 'http://localhost:3001/api/user/auth/callback';
  return new google.auth.OAuth2(client_id, client_secret, redirectUri);
}

export async function getLoginAuthUrl(client: OAuth2Client): Promise<string> {
  return client.generateAuthUrl({
    access_type: 'online',
    scope: LOGIN_SCOPES,
    prompt: 'select_account',
  });
}

export async function exchangeLoginCode(
  client: OAuth2Client,
  code: string,
): Promise<{ googleId: string; email: string; name: string; avatarUrl: string }> {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: (JSON.parse(fs.readFileSync(getCredentialsPath(), 'utf-8')).installed || JSON.parse(fs.readFileSync(getCredentialsPath(), 'utf-8')).web).client_id,
  });

  const payload = ticket.getPayload()!;
  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name || payload.email!,
    avatarUrl: payload.picture || '',
  };
}

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

export interface SessionPayload {
  sub: string;
  role: 'admin' | 'creator';
  orgId: number | null;
  jti: string;
}

export function signSessionJwt(userId: number, role: string, orgId: number | null): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  const expiresIn = Number(process.env.SESSION_DURATION_SECONDS || 86400);
  return jwt.sign(
    { sub: String(userId), role, orgId, jti: randomUUID() },
    secret,
    { expiresIn },
  );
}

export function verifySessionJwt(token: string): SessionPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as SessionPayload;
  } catch {
    return null;
  }
}

// ── Email token helpers ───────────────────────────────────────────────────────

export async function createEmailToken(
  userId: number,
  type: 'verify_email' | 'approve_access' | 'reset_password',
  expiresInHours = 24,
): Promise<string> {
  const db = await openDb();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  await db.run(
    'INSERT INTO email_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
    [userId, token, type, expiresAt],
  );
  return token;
}

export async function consumeEmailToken(
  token: string,
  type: string,
): Promise<{ userId: number } | null> {
  const db = await openDb();
  const row = await db.get(
    `SELECT * FROM email_tokens
     WHERE token = ? AND type = ? AND used_at IS NULL AND expires_at > datetime('now')`,
    [token, type],
  );
  if (!row) return null;
  await db.run('UPDATE email_tokens SET used_at = datetime("now") WHERE id = ?', [row.id]);
  return { userId: row.user_id };
}

// ── Org resolution ────────────────────────────────────────────────────────────

export async function resolveOrgForEmail(email: string): Promise<{ id: number; name: string } | null> {
  if (isGenericDomain(email)) return null;
  const domain = getDomain(email);
  const db = await openDb();
  const org = await db.get<{ id: number; name: string }>('SELECT id, name FROM organizations WHERE domain = ?', [domain]);
  return org ?? null;
}

// ── User upsert (Google login) ────────────────────────────────────────────────

export type UpsertResult =
  | { status: 'ok'; user: any }
  | { status: 'pending_org'; user: any }      // needs onboarding
  | { status: 'access_requested'; user: any }; // waiting for admin approval

export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
}): Promise<UpsertResult> {
  const db = await openDb();

  // Check if user already exists
  let user = await db.get('SELECT * FROM users WHERE google_id = ?', [profile.googleId]);

  if (user) {
    if (!user.is_active) throw Object.assign(new Error('A sua conta foi desativada.'), { status: 403 });
    await db.run('UPDATE users SET last_login_at = datetime("now"), name = ?, avatar_url = ? WHERE id = ?',
      [profile.name, profile.avatarUrl, user.id]);
    user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);

    // User exists but has no org yet → back to onboarding
    if (!user.org_id) return { status: 'pending_org', user };

    return { status: 'ok', user };
  }

  // New user — check org routing
  const existingOrg = await resolveOrgForEmail(profile.email);

  if (existingOrg) {
    // Corporate domain with existing org → request access
    const result = await db.run(
      `INSERT INTO users (google_id, email, name, avatar_url, email_verified, is_active, org_id, role)
       VALUES (?, ?, ?, ?, 1, 0, ?, 'creator')`,
      [profile.googleId, profile.email, profile.name, profile.avatarUrl, existingOrg.id],
    );
    const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    await db.run(
      'INSERT INTO org_access_requests (user_id, org_id) VALUES (?, ?)',
      [newUser.id, existingOrg.id],
    );
    return { status: 'access_requested', user: newUser };
  }

  // Generic domain or new corporate domain → create user, needs onboarding
  const result = await db.run(
    `INSERT INTO users (google_id, email, name, avatar_url, email_verified, is_active)
     VALUES (?, ?, ?, ?, 1, 1)`,
    [profile.googleId, profile.email, profile.name, profile.avatarUrl],
  );
  const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
  return { status: 'pending_org', user: newUser };
}
