import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'atharqulimoon@gmail.com').toLowerCase();

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user?.role !== 'admin' && String(req.user?.email || '').toLowerCase() !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin only' });
    }
    next();
  });
}

export async function ensureAdminUser() {
  const email = ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || 'Roll#947131';
  const name = process.env.ADMIN_NAME || 'Athar Iqbal';
  const existing = await query('select id from users where lower(email) = $1', [email]);
  if (existing.rowCount) {
    await query(`update users set role = 'admin', blocked = false, name = coalesce(nullif(name, ''), $2) where lower(email) = $1`, [
      email,
      name,
    ]);
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await query(
    `insert into users (email, name, password_hash, role, blocked)
     values ($1, $2, $3, 'admin', false)`,
    [email, name, hash]
  );
  console.log(`Seeded admin user: ${email}`);
}

export { bcrypt, ADMIN_EMAIL };
