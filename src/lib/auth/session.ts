import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { query } from '../db';

const SESSION_COOKIE_NAME = 'vws_studio_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'vws_secure_production_secret_key_antigravity_2026';

export interface AdminSession {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: number;
}

/**
 * Hash password with PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored PBKDF2 hash using timing-safe comparison
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Signs payload with HMAC-SHA256
 */
export function signSession(session: AdminSession): string {
  const data = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verifies signed session token
 */
export function verifySessionToken(token: string): AdminSession | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(data)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload: AdminSession = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current session from Next.js cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Set session cookie
 */
export async function setAdminSessionCookie(session: AdminSession): Promise<void> {
  const token = signSession(session);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clear session cookie on logout
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Authenticate admin by email and password against admin_users table
 */
export async function authenticateAdmin(identifier: string, password: string): Promise<AdminSession | null> {
  const cleanId = (identifier || '').trim().toLowerCase();
  const searchEmail = cleanId === 'admin' ? 'admin@vacaywithstrangers.com' : cleanId;

  const res = await query(
    `SELECT id, email, password_hash, full_name, role, is_active
     FROM admin_users
     WHERE (email = $1 OR email = $2) AND is_active = true`,
    [cleanId, searchEmail]
  );

  if (res.rowCount === 0) return null;
  const user = res.rows[0];

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  return {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}
