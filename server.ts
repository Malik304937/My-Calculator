/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase body parser limit for photo uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Paths for real database persistence
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');
const AVATAR_FILE = path.join(DATA_DIR, 'malik-shahmeer.png');

// Initialize database with empty array (NO FAKE / DEMO VISITORS)
if (!fs.existsSync(VISITORS_FILE)) {
  fs.writeFileSync(VISITORS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// Helper to hash password
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Initialize Admin Credentials: default password 'merimarzi' chosen by Malik Shahmeer
if (!fs.existsSync(ADMIN_CONFIG_FILE)) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword('merimarzi', salt);
  const initialAdmin = {
    email: 'malik.shahmeer@creator.com',
    salt,
    hash,
    lastPasswordChange: Date.now(),
  };
  fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(initialAdmin, null, 2), 'utf-8');
}

// Active admin session tokens (token -> expiry timestamp)
const activeAdminTokens = new Map<string, number>();

function getAdminConfig() {
  try {
    const raw = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword('merimarzi', salt);
    return {
      email: 'malik.shahmeer@creator.com',
      salt,
      hash,
      lastPasswordChange: Date.now(),
    };
  }
}

function getVisitors(): Array<{
  id: string;
  name: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  platform?: string;
}> {
  try {
    const raw = fs.readFileSync(VISITORS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveVisitors(visitors: unknown[]) {
  fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf-8');
}

// Admin Authorization Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Administrator authentication required.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const expiry = activeAdminTokens.get(token);

  if (!expiry || expiry < Date.now()) {
    activeAdminTokens.delete(token);
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  // Extend token expiry by 4 hours on active usage
  activeAdminTokens.set(token, Date.now() + 14400000);
  next();
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Visitor Entry: Record or update real visitor
app.post('/api/visitors', (req: Request, res: Response) => {
  const { name, visitorId } = req.body;
  const trimmedName = typeof name === 'string' ? name.trim() : '';

  if (!trimmedName || trimmedName.length < 2) {
    res.status(400).json({ error: 'Please provide a valid name of at least 2 characters.' });
    return;
  }

  const visitors = getVisitors();
  const now = Date.now();
  let matched = null;

  // Match by persistent visitor ID or matching case-insensitive name
  if (visitorId) {
    matched = visitors.find((v) => v.id === visitorId);
  }
  if (!matched) {
    matched = visitors.find((v) => v.name.toLowerCase() === trimmedName.toLowerCase());
  }

  if (matched) {
    matched.lastVisit = now;
    matched.visitCount = (matched.visitCount || 1) + 1;
    matched.name = trimmedName; // preserve exact casing entered
    saveVisitors(visitors);
    res.json({ visitor: matched, isReturning: true });
    return;
  }

  const newId = `vis_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const newVisitor = {
    id: newId,
    name: trimmedName,
    firstVisit: now,
    lastVisit: now,
    visitCount: 1,
    platform: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
  };

  visitors.unshift(newVisitor);
  saveVisitors(visitors);

  res.status(201).json({ visitor: newVisitor, isReturning: false });
});

// 2. Admin Get All Visitors (Strictly Protected)
app.get('/api/visitors', requireAdminAuth, (_req: Request, res: Response) => {
  const visitors = getVisitors();
  const totalVisits = visitors.reduce((acc, curr) => acc + (curr.visitCount || 1), 0);
  const uniqueCount = visitors.length;

  res.json({
    visitors,
    stats: {
      totalVisits,
      uniqueCount,
    },
  });
});

// 3. Admin Delete Single Visitor Record (Strictly Protected)
app.delete('/api/visitors/:id', requireAdminAuth, (req: Request, res: Response) => {
  const id = req.params.id;
  const visitors = getVisitors();
  const filtered = visitors.filter((v) => v.id !== id);

  saveVisitors(filtered);
  res.json({ success: true, count: filtered.length });
});

// 4. Admin Clear All Records (Strictly Protected)
app.delete('/api/visitors', requireAdminAuth, (_req: Request, res: Response) => {
  saveVisitors([]);
  res.json({ success: true, count: 0 });
});

// 5. Admin Login (Verifies password securely on server)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Please enter both administrator email and password.' });
    return;
  }

  const adminConfig = getAdminConfig();
  const cleanEmail = email.trim().toLowerCase();

  // Validate administrator identity
  const isMatchEmail =
    cleanEmail === adminConfig.email.toLowerCase() ||
    cleanEmail === 'malik@shahmeer.com' ||
    cleanEmail === 'sherro31270@gmail.com';

  if (!isMatchEmail) {
    res.status(401).json({ error: 'Access restricted: Unrecognized administrator account.' });
    return;
  }

  const computedHash = hashPassword(password, adminConfig.salt);
  if (computedHash !== adminConfig.hash) {
    res.status(401).json({ error: 'Incorrect password.' });
    return;
  }

  // Issue session token
  const token = `adm_${crypto.randomBytes(32).toString('hex')}`;
  // 4 hours validity
  activeAdminTokens.set(token, Date.now() + 14400000);

  res.json({
    success: true,
    token,
    user: {
      email: adminConfig.email,
      displayName: 'Malik Shahmeer',
      role: 'Administrator & Creator',
    },
  });
});

// 6. Admin Password Reset (Secure password change by Malik Shahmeer)
app.post('/api/admin/password-reset', requireAdminAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  const adminConfig = getAdminConfig();
  const currentComputedHash = hashPassword(currentPassword, adminConfig.salt);

  if (currentComputedHash !== adminConfig.hash) {
    res.status(401).json({ error: 'Current password verification failed.' });
    return;
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);

  const updatedConfig = {
    ...adminConfig,
    salt: newSalt,
    hash: newHash,
    lastPasswordChange: Date.now(),
  };

  fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');
  res.json({ success: true, message: 'Administrator password updated successfully.' });
});

// 7. Verify Admin Session Token
app.get('/api/admin/verify', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ valid: true, user: { displayName: 'Malik Shahmeer', role: 'Administrator' } });
});

// 8. Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeAdminTokens.delete(token);
  }
  res.json({ success: true });
});

// 9. Photo Avatar Upload (Allows Malik Shahmeer to upload their original photo directly)
app.post('/api/avatar', (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    res.status(400).json({ error: 'Please provide a valid base64 image data string.' });
    return;
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(AVATAR_FILE, buffer);
    // Also save into public for static Vite access
    const publicAvatar = path.join(__dirname, 'public', 'Malik Shahmeer.png');
    fs.writeFileSync(publicAvatar, buffer);

    res.json({ success: true, message: 'Original profile photograph saved successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save avatar image';
    res.status(500).json({ error: msg });
  }
});

// 10. Serve Photo Avatar
app.get('/api/avatar', (_req: Request, res: Response) => {
  if (fs.existsSync(AVATAR_FILE)) {
    res.sendFile(AVATAR_FILE);
  } else {
    // If not yet uploaded, return 404
    res.status(404).send('Avatar not uploaded yet');
  }
});

// -------------------------------------------------------------
// Vite Integration in Development / Static Files in Production
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MY CALCULATOR] Production full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
