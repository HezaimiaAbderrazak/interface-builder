import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'noteflow-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function registerUser(email: string, password: string, fullName: string) {
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) throw new Error('Email already in use');
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
  }).returning();
  return user;
}

export async function loginUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) throw new Error('Invalid email or password');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid email or password');
  return user;
}
