import { Router } from 'express';
import { loginUser, registerUser, signToken, authMiddleware } from '../auth.js';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { AuthRequest } from '../auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName = '' } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const user = await registerUser(email, password, fullName);
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const user = await loginUser(email, password);
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ id: user.id, email: user.email, fullName: user.fullName });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
