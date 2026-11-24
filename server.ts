import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { RepositoryStore, hashPassword, verifyPassword } from './server/store';
import type { AdminStats, CampusAnalytics, ItemStatus, ReportType, UserRole } from './src/types';

interface SessionPayload {
  sub: string;
  role: UserRole;
  name: string;
  email: string;
  exp: number;
}

interface AuthedRequest extends Request {
  auth?: SessionPayload;
}

const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const ALLOWED_STATUSES: ItemStatus[] = [
  'Reported',
  'Under Review',
  'Potential Match',
  'Claim Requested',
  'Verified',
  'Returned',
  'Closed',
  'Rejected',
];

function signToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.sub || !parsed.role || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();
  if (/^\/src\/assets\/images\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/.test(trimmed)) {
    return true;
  }
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return trimmed.length <= 2_600_000;
  }
  return false;
}

function safeTrim(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function startServer(): Promise<void> {
  const app = express();
  const store = new RepositoryStore();

  app.use(express.json({ limit: '3mb' }));

  const authenticateOptional = (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice(7).trim();
      const payload = verifyToken(token);
      if (payload) {
        req.auth = payload;
      }
    }
    next();
  };

  const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    const payload = verifyToken(header.slice(7).trim());
    if (!payload) {
      res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
      return;
    }
    if (payload.role === 'student') {
      const user = store.getState().users.find((u) => u.id === payload.sub);
      if (!user || !user.active) {
        res.status(403).json({ error: 'Your user account is inactive or unavailable.' });
        return;
      }
    }
    req.auth = payload;
    next();
  };

  const requireAdmin = (req: AuthedRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (req.auth?.role !== 'admin') {
        res.status(403).json({ error: 'Administrator privileges required for this action.' });
        return;
      }
      next();
    });
  };

  // --- Auth & Session Routes ---
  app.get('/api/auth/me', authenticateOptional, (req: AuthedRequest, res: Response) => {
    if (!req.auth) {
      res.json({ authenticated: false, user: null });
      return;
    }
    if (req.auth.role === 'admin') {
      res.json({
        authenticated: true,
        user: {
          id: req.auth.sub,
          studentId: 'ADMIN-DESK',
          name: req.auth.name,
          email: req.auth.email,
          department: 'Campus Student Services',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }
    const found = store.getState().users.find((u) => u.id === req.auth?.sub);
    if (!found || !found.active) {
      res.json({ authenticated: false, user: null });
      return;
    }
    res.json({ authenticated: true, user: store.sanitizeUser(found) });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const name = safeTrim(req.body?.name, 80);
    const email = safeTrim(req.body?.email, 120).toLowerCase();
    const studentId = safeTrim(req.body?.studentId, 32).toUpperCase();
    const department = safeTrim(req.body?.department, 80);
    const phone = safeTrim(req.body?.phone, 20);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!name || !isValidEmail(email) || !studentId || !department || password.length < 6) {
      res.status(400).json({
        error: 'Please provide valid name, email, student/staff ID, department, and password (minimum 6 characters).',
      });
      return;
    }

    const state = store.getState();
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'An account with this email address is already registered.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const newUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      studentId,
      name,
      email,
      phone,
      department,
      role: 'student' as const,
      active: true,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    state.users.push(newUser);
    store.addNotification({
      userId: newUser.id,
      title: 'Welcome to Campus Lost and Found',
      message: 'Your campus account is active. You can now report lost/found belongings and track claim verification.',
    });
    store.save();

    const token = signToken({
      sub: newUser.id,
      role: 'student',
      name: newUser.name,
      email: newUser.email,
    });

    res.status(201).json({ token, user: store.sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const email = safeTrim(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Valid email and password are required.' });
      return;
    }

    const user = store.getState().users.find((u) => u.email.toLowerCase() === email);
    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'Account has been deactivated. Contact campus administration.' });
      return;
    }

    const token = signToken({
      sub: user.id,
      role: 'student',
      name: user.name,
      email: user.email,
    });

    res.json({ token, user: store.sanitizeUser(user) });
  });

  app.post('/api/auth/recover', (req: Request, res: Response) => {
    const email = safeTrim(req.body?.email, 120).toLowerCase();
    const studentId = safeTrim(req.body?.studentId, 32).toUpperCase();
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!isValidEmail(email) || !studentId || newPassword.length < 6) {
      res.status(400).json({ error: 'Valid email, registered Student/Staff ID, and new password (6+ chars) are required.' });
      return;
    }

    const state = store.getState();
    const user = state.users.find(
      (u) => u.email.toLowerCase() === email && u.studentId.toUpperCase() === studentId
    );
    if (!user) {
      res.status(404).json({ error: 'No matching campus record found for that email and Student/Staff ID.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    store.addNotification({
      userId: user.id,
      title: 'Password Updated',
      message: 'Your account password was reset via campus ID verification.',
    });
    store.save();

    res.json({ message: 'Password updated successfully. You may now sign in with your new password.' });
  });

  // --- Admin Auth & First-Run Setup ---
  app.get('/api/auth/admin-status', (_req: Request, res: Response) => {
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    const claimed = Boolean(store.getState().adminCredential);
    res.json({
      adminConfigured: Boolean(envPasscode) || claimed,
      envConfigured: Boolean(envPasscode),
    });
  });

  app.post('/api/auth/admin-claim', (req: Request, res: Response) => {
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    const state = store.getState();

    if (envPasscode || state.adminCredential) {
      res.status(409).json({ error: 'Administrator credentials are already configured.' });
      return;
    }

    const name = safeTrim(req.body?.name, 80) || 'Campus Administrator';
    const email = safeTrim(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidEmail(email) || password.length < 8) {
      res.status(400).json({ error: 'Provide a valid administrator email and a password of at least 8 characters.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    state.adminCredential = {
      name,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };
    store.addAuditLog({
      action: 'ADMIN_ACCOUNT_CLAIMED',
      targetType: 'system',
      targetId: 'admin-desk',
      adminId: 'admin-1',
      adminName: name,
      adminEmail: email,
      details: 'First-run administrator password was claimed and initialized.',
    });
    store.save();

    const token = signToken({
      sub: 'admin-1',
      role: 'admin',
      name,
      email,
    });

    res.status(201).json({
      token,
      user: {
        id: 'admin-1',
        studentId: 'ADMIN-DESK',
        name,
        email,
        department: 'Campus Student Services',
        role: 'admin',
        active: true,
        createdAt: state.adminCredential.createdAt,
      },
    });
  });

  app.post('/api/auth/login-admin', (req: Request, res: Response) => {
    const email = safeTrim(req.body?.email, 120).toLowerCase() || 'admin@campus.edu';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    const cred = store.getState().adminCredential;

    if (!password) {
      res.status(400).json({ error: 'Administrator password or passcode is required.' });
      return;
    }

    let valid = false;
    let adminName = cred?.name || 'Campus Administrator';
    let adminEmail = cred?.email || email;

    if (envPasscode) {
      const a = Buffer.from(password, 'utf8');
      const b = Buffer.from(envPasscode, 'utf8');
      valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    } else if (cred) {
      valid = verifyPassword(password, cred.passwordHash, cred.passwordSalt);
      if (isValidEmail(email) && email !== cred.email.toLowerCase()) {
        valid = false;
      }
    } else {
      res.status(400).json({ error: 'Administrator access is not initialized yet.' });
      return;
    }

    if (!valid) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    const token = signToken({
      sub: 'admin-1',
      role: 'admin',
      name: adminName,
      email: adminEmail,
    });

    res.json({
      token,
      user: {
        id: 'admin-1',
        studentId: 'ADMIN-DESK',
        name: adminName,
        email: adminEmail,
        department: 'Campus Student Services',
        role: 'admin',
        active: true,
        createdAt: cred?.createdAt || new Date().toISOString(),
      },
    });
  });

  // --- Public & Catalog Metadata Routes ---
  app.get('/api/metadata', (_req: Request, res: Response) => {
    const state = store.getState();
    res.json({
      categories: state.categories,
      locations: state.locations,
    });
  });

  app.get('/api/analytics', (_req: Request, res: Response) => {
    const activeItems = store.getState().items.filter((i) => i.active);
    const totalReports = activeItems.length;
    const lostCount = activeItems.filter((i) => i.type === 'Lost').length;
    const foundCount = activeItems.filter((i) => i.type === 'Found').length;
    const recoveredCount = activeItems.filter(
      (i) => i.status === 'Returned' || i.status === 'Closed' || i.status === 'Verified'
    ).length;

    const locationMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    for (const item of activeItems) {
      locationMap.set(item.location, (locationMap.get(item.location) || 0) + 1);
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    }

    const byLocation = Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const byCategory = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const analytics: CampusAnalytics = {
      totalReports,
      lostCount,
      foundCount,
      recoveredCount,
      recoveryRatePercent: totalReports > 0 ? Math.round((recoveredCount / totalReports) * 100) : 0,
      byLocation,
      byCategory,
    };

    res.json(analytics);
  });

  app.get('/api/items', (req: Request, res: Response) => {
    const state = store.getState();
    const search = safeTrim(req.query.q, 100).toLowerCase();
    const type = safeTrim(req.query.type, 16);
    const category = safeTrim(req.query.category, 80);
    const location = safeTrim(req.query.location, 120);
    const status = safeTrim(req.query.status, 40);
    const sort = safeTrim(req.query.sort, 20) || 'newest';

    const visibleItems = state.items
      .filter((item) => item.active)
      .filter((item) => (!type || type === 'All' ? true : item.type === type))
      .filter((item) => (!category || category === 'All' ? true : item.category === category))
      .filter((item) => (!location || location === 'All' ? true : item.location === location))
      .filter((item) => (!status || status === 'All' ? true : item.status === status))
      .filter((item) => {
        if (!search) return true;
        return (
          item.title.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          item.reportCode.toLowerCase().includes(search) ||
          item.location.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        if (sort === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sort === 'matches') {
          const aMatch = a.status === 'Potential Match' ? 1 : 0;
          const bMatch = b.status === 'Potential Match' ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((item) => store.toPublicItem(item));

    const summary = {
      totalActive: state.items.filter((i) => i.active).length,
      potentialMatches: state.items.filter((i) => i.active && i.status === 'Potential Match').length,
      claimsInReview: state.claims.filter((c) => c.status === 'Pending').length,
      returnedCount: state.items.filter((i) => i.active && (i.status === 'Returned' || i.status === 'Closed')).length,
    };

    res.json({ items: visibleItems, summary });
  });

  app.get('/api/items/:id', (req: Request, res: Response) => {
    const state = store.getState();
    const item = state.items.find((i) => i.id === req.params.id && i.active);
    if (!item) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    const matches = store
      .findPotentialOppositeMatches(item)
      .map((m) => store.toPublicItem(m));

    const inquiries = state.inquiries
      .filter((inq) => inq.itemId === item.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json({
      item: store.toPublicItem(item),
      suggestedMatches: matches,
      inquiries,
    });
  });

  app.post('/api/items/:id/inquiries', requireAuth, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const item = state.items.find((i) => i.id === req.params.id && i.active);
    if (!item) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    const message = safeTrim(req.body?.message, 500);
    if (!message) {
      res.status(400).json({ error: 'Please enter a clarification question or desk note.' });
      return;
    }

    const userRecord = state.users.find((u) => u.id === req.auth!.sub);
    const senderLabel =
      req.auth!.role === 'admin'
        ? 'Campus Services Admin'
        : userRecord?.studentId
          ? `Student · ${userRecord.studentId}`
          : 'Campus Member';

    const inquiry = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      itemId: item.id,
      senderId: req.auth!.sub,
      senderLabel,
      senderRole: req.auth!.role,
      message,
      createdAt: new Date().toISOString(),
    };

    state.inquiries.push(inquiry);
    if (item.reporterId && item.reporterId !== req.auth!.sub) {
      store.addNotification({
        userId: item.reporterId,
        title: `New Inquiry on ${item.reportCode}`,
        message: `${senderLabel} posted a clarification question on "${item.title}".`,
        relatedItemId: item.id,
      });
    }
    store.save();

    res.status(201).json({ inquiry });
  });

  // --- Registered User: Report Lost / Found Item ---
  app.post('/api/items', requireAuth, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const type = req.body?.type === 'Found' ? 'Found' : req.body?.type === 'Lost' ? 'Lost' : null;
    const title = safeTrim(req.body?.title, 100);
    const category = safeTrim(req.body?.category, 80);
    const location = safeTrim(req.body?.location, 120);
    const date = safeTrim(req.body?.date, 20);
    const description = safeTrim(req.body?.description, 1000);
    const imageUrl = req.body?.imageUrl;
    const confirmDuplicate = Boolean(req.body?.confirmDuplicate);

    if (!type || !title || !category || !location || !date || !description) {
      res.status(400).json({ error: 'Please complete all required fields: type, title, category, location, date, and description.' });
      return;
    }

    const validCategory = state.categories.some((c) => c.active && c.name === category);
    const validLocation = state.locations.some((l) => l.active && l.name === location);
    if (!validCategory || !validLocation) {
      res.status(400).json({ error: 'Selected category or campus location is invalid or inactive.' });
      return;
    }

    if (imageUrl && !isValidImageUrl(imageUrl)) {
      res.status(400).json({ error: 'Invalid image format. Upload PNG, JPEG, or WebP up to 2MB.' });
      return;
    }

    // Duplicate Detection (REQ-056)
    const similar = store.findSimilarSameType(type as ReportType, {
      title,
      description,
      category,
      location,
      date,
    });

    if (similar.length > 0 && !confirmDuplicate) {
      res.status(409).json({
        duplicateWarning: true,
        message: 'A similar report already exists in the system. Review these records or confirm to submit anyway.',
        similarItems: similar,
      });
      return;
    }

    state.reportCounter += 1;
    const reportCode = `CLF-2026-${String(state.reportCounter).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newItem = {
      id: `itm-${crypto.randomUUID().slice(0, 8)}`,
      reportCode,
      type: type as ReportType,
      title,
      category,
      location,
      date,
      description,
      imageUrl: imageUrl ? String(imageUrl) : undefined,
      status: 'Reported' as ItemStatus,
      reporterId: req.auth!.sub,
      reporterName: req.auth!.name,
      suspectedDuplicate: similar.length > 0,
      matchedItemIds: [] as string[],
      active: true,
      statusHistory: [
        {
          status: 'Reported' as ItemStatus,
          timestamp: now,
          note: `${type} report submitted by ${req.auth!.name}.`,
          actorRole: req.auth!.role,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Matching Engine (REQ-049, REQ-050, REQ-051)
    const matches = store.findPotentialOppositeMatches(newItem);
    if (matches.length > 0) {
      newItem.matchedItemIds = matches.map((m) => m.id);
      store.updateItemStatus(
        newItem,
        'Potential Match',
        `System detected ${matches.length} potential match(es) across opposite reports.`,
        'system'
      );

      for (const matched of matches) {
        if (!matched.matchedItemIds.includes(newItem.id)) {
          matched.matchedItemIds.push(newItem.id);
        }
        if (matched.status === 'Reported' || matched.status === 'Under Review') {
          store.updateItemStatus(
            matched,
            'Potential Match',
            `Potential match detected with ${newItem.reportCode} (${newItem.title}).`,
            'system'
          );
        }
        store.addNotification({
          userId: matched.reporterId,
          title: 'Potential Match Detected',
          message: `A newly reported ${newItem.type.toLowerCase()} item (${newItem.reportCode}) may match your report "${matched.title}".`,
          relatedItemId: newItem.id,
        });
      }
    }

    state.items.unshift(newItem);
    store.addNotification({
      userId: req.auth!.sub,
      title: `${type} Report Submitted (${reportCode})`,
      message:
        matches.length > 0
          ? `Your report is live and matched ${matches.length} existing campus listing(s).`
          : `Your ${type.toLowerCase()} item report has been logged for review.`,
      relatedItemId: newItem.id,
    });
    store.save();

    res.status(201).json({
      item: store.toPublicItem(newItem),
      potentialMatches: matches.map((m) => store.toPublicItem(m)),
    });
  });

  // --- Claims (REQ-021 to REQ-027, REQ-052 to REQ-055) ---
  app.get('/api/claims/mine', requireAuth, (req: AuthedRequest, res: Response) => {
    const claims = store
      .getState()
      .claims.filter((c) => c.claimantId === req.auth!.sub)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ claims });
  });

  app.get('/api/items/mine', requireAuth, (req: AuthedRequest, res: Response) => {
    const items = store
      .getState()
      .items.filter((i) => i.active && i.reporterId === req.auth!.sub)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((i) => store.toPublicItem(i));
    res.json({ items });
  });

  app.post('/api/claims', requireAuth, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const itemId = safeTrim(req.body?.itemId, 64);
    const identifyingDetails = safeTrim(req.body?.identifyingDetails, 800);
    const proofReference = safeTrim(req.body?.proofReference, 200);
    const claimantPhone = safeTrim(req.body?.claimantPhone, 20);

    if (!itemId || !identifyingDetails) {
      res.status(400).json({ error: 'Item ID and identifying ownership details are required.' });
      return;
    }

    const item = state.items.find((i) => i.id === itemId && i.active);
    if (!item) {
      res.status(404).json({ error: 'Referenced item report was not found.' });
      return;
    }

    if (item.type !== 'Found') {
      res.status(400).json({ error: 'Ownership claims can only be submitted for Found item listings.' });
      return;
    }

    if (item.status === 'Returned' || item.status === 'Closed' || item.status === 'Rejected') {
      res.status(400).json({ error: `This item is already marked as ${item.status} and is no longer eligible for claims.` });
      return;
    }

    const alreadyPending = state.claims.some(
      (c) => c.itemId === item.id && c.claimantId === req.auth!.sub && c.status === 'Pending'
    );
    if (alreadyPending) {
      res.status(409).json({ error: 'You already have a pending claim request on this item.' });
      return;
    }

    const userRecord = state.users.find((u) => u.id === req.auth!.sub);
    state.claimCounter += 1;
    const claimCode = `CLM-2026-${String(state.claimCounter).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const claim = {
      id: `clm-${crypto.randomUUID().slice(0, 8)}`,
      claimCode,
      itemId: item.id,
      itemTitle: item.title,
      itemReportCode: item.reportCode,
      claimantId: req.auth!.sub,
      claimantName: req.auth!.name,
      claimantEmail: req.auth!.email,
      claimantStudentId: userRecord?.studentId || 'STAFF/ADMIN',
      claimantPhone: claimantPhone || userRecord?.phone || 'Not provided',
      identifyingDetails,
      proofReference: proofReference || 'In-person ID verification at desk',
      status: 'Pending' as const,
      adminRemarks: '',
      createdAt: now,
      updatedAt: now,
    };

    state.claims.unshift(claim);
    store.updateItemStatus(
      item,
      'Claim Requested',
      `Claim ${claimCode} submitted for administrator verification.`,
      req.auth!.role
    );

    store.addNotification({
      userId: req.auth!.sub,
      title: `Claim Submitted (${claimCode})`,
      message: `Your claim request for "${item.title}" is pending administrator review.`,
      relatedItemId: item.id,
      relatedClaimId: claim.id,
    });

    if (item.reporterId && item.reporterId !== req.auth!.sub) {
      store.addNotification({
        userId: item.reporterId,
        title: `Claim Received on ${item.reportCode}`,
        message: `Someone submitted a verification claim for the item "${item.title}" you reported.`,
        relatedItemId: item.id,
      });
    }

    store.save();
    res.status(201).json({ claim });
  });

  // --- Notifications (REQ-028 to REQ-033) ---
  app.get('/api/notifications', requireAuth, (req: AuthedRequest, res: Response) => {
    const notifications = store
      .getState()
      .notifications.filter((n) => n.userId === req.auth!.sub)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ notifications });
  });

  app.patch('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res: Response) => {
    const notif = store
      .getState()
      .notifications.find((n) => n.id === req.params.id && n.userId === req.auth!.sub);
    if (!notif) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }
    notif.read = true;
    store.save();
    res.json({ notification: notif });
  });

  app.post('/api/notifications/read-all', requireAuth, (req: AuthedRequest, res: Response) => {
    for (const notif of store.getState().notifications) {
      if (notif.userId === req.auth!.sub) {
        notif.read = true;
      }
    }
    store.save();
    res.json({ ok: true });
  });

  // --- Admin Operations (REQ-034 to REQ-045, REQ-052 to REQ-069) ---
  app.get('/api/admin/overview', requireAdmin, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const fromDate = safeTrim(req.query.from, 20);
    const toDate = safeTrim(req.query.to, 20);
    const statusFilter = safeTrim(req.query.status, 40);

    const activeItems = state.items.filter((i) => i.active);
    const filteredItems = activeItems.filter((item) => {
      if (statusFilter && statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (fromDate && item.date < fromDate) return false;
      if (toDate && item.date > toDate) return false;
      return true;
    });

    const stats: AdminStats = {
      totalLost: filteredItems.filter((i) => i.type === 'Lost').length,
      totalFound: filteredItems.filter((i) => i.type === 'Found').length,
      underReview: filteredItems.filter((i) => i.status === 'Under Review').length,
      potentialMatches: filteredItems.filter((i) => i.status === 'Potential Match').length,
      pendingClaims: state.claims.filter((c) => c.status === 'Pending').length,
      returnedItems: filteredItems.filter((i) => i.status === 'Returned').length,
      closedCases: filteredItems.filter((i) => i.status === 'Closed').length,
      suspectedDuplicates: filteredItems.filter((i) => i.suspectedDuplicate).length,
    };

    res.json({
      stats,
      items: activeItems.map((i) => store.toPublicItem(i)),
      claims: state.claims,
      users: state.users.map((u) => store.sanitizeUser(u)),
      auditLogs: state.auditLogs,
      categories: state.categories,
      locations: state.locations,
    });
  });

  app.patch('/api/admin/claims/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const claim = state.claims.find((c) => c.id === req.params.id);
    if (!claim) {
      res.status(404).json({ error: 'Claim record not found.' });
      return;
    }

    const decision = req.body?.decision as 'approve' | 'reject' | 'handover';
    const remarks = safeTrim(req.body?.remarks, 400);
    const confirmHandover = Boolean(req.body?.confirmHandover);

    if (!['approve', 'reject', 'handover'].includes(decision)) {
      res.status(400).json({ error: 'Invalid claim decision.' });
      return;
    }

    const item = state.items.find((i) => i.id === claim.itemId);
    const now = new Date().toISOString();

    if (decision === 'approve') {
      const pickupCode = `PU-${crypto.randomInt(1000, 9999)}`;
      claim.status = 'Approved';
      claim.pickupCode = pickupCode;
      claim.adminRemarks =
        remarks || `Ownership details verified. Present pickup code ${pickupCode} at Student Services Desk.`;
      claim.updatedAt = now;
      if (item) {
        store.updateItemStatus(item, 'Verified', `Claim ${claim.claimCode} approved for collection.`, 'admin');
      }
      store.addNotification({
        userId: claim.claimantId,
        title: `Claim Approved (${claim.claimCode}) · Pickup Code ${pickupCode}`,
        message: `Your claim for "${claim.itemTitle}" was verified. Present pickup code ${pickupCode} and your campus ID at Student Services Desk.`,
        relatedItemId: claim.itemId,
        relatedClaimId: claim.id,
      });
      store.addAuditLog({
        action: 'CLAIM_APPROVED',
        targetType: 'claim',
        targetId: claim.claimCode,
        adminId: req.auth!.sub,
        adminName: req.auth!.name,
        adminEmail: req.auth!.email,
        details: `Approved claim ${claim.claimCode} for item ${claim.itemReportCode} and issued pickup code.`,
      });
    } else if (decision === 'reject') {
      claim.status = 'Rejected';
      claim.adminRemarks = remarks || 'Provided identifying details did not match item records.';
      claim.updatedAt = now;
      if (item && item.status === 'Claim Requested') {
        store.updateItemStatus(item, 'Under Review', `Claim ${claim.claimCode} rejected; item returned to review.`, 'admin');
      }
      store.addNotification({
        userId: claim.claimantId,
        title: `Claim Update (${claim.claimCode})`,
        message: `Your claim for "${claim.itemTitle}" was not approved. Remarks: ${claim.adminRemarks}`,
        relatedItemId: claim.itemId,
        relatedClaimId: claim.id,
      });
      store.addAuditLog({
        action: 'CLAIM_REJECTED',
        targetType: 'claim',
        targetId: claim.claimCode,
        adminId: req.auth!.sub,
        adminName: req.auth!.name,
        adminEmail: req.auth!.email,
        details: `Rejected claim ${claim.claimCode} for ${claim.itemReportCode}.`,
      });
    } else if (decision === 'handover') {
      const providedCode = safeTrim(req.body?.pickupCode, 16).toUpperCase();
      if (!confirmHandover) {
        res.status(400).json({ error: 'Explicit handover confirmation is required before marking an item as Returned.' });
        return;
      }
      if (claim.pickupCode && providedCode && providedCode !== claim.pickupCode.toUpperCase()) {
        res.status(400).json({ error: 'Entered pickup verification code does not match the issued claim code.' });
        return;
      }
      claim.status = 'Handed Over';
      claim.adminRemarks = remarks || 'Item physically handed over to verified owner.';
      claim.updatedAt = now;
      if (item) {
        store.updateItemStatus(item, 'Returned', `Handed over to ${claim.claimantName} (${claim.claimCode}).`, 'admin');
      }
      store.addNotification({
        userId: claim.claimantId,
        title: `Item Handed Over (${claim.itemReportCode})`,
        message: `Handover confirmed for "${claim.itemTitle}". Case marked as Returned.`,
        relatedItemId: claim.itemId,
        relatedClaimId: claim.id,
      });
      store.addAuditLog({
        action: 'ITEM_HANDOVER_RETURNED',
        targetType: 'item',
        targetId: claim.itemReportCode,
        adminId: req.auth!.sub,
        adminName: req.auth!.name,
        adminEmail: req.auth!.email,
        details: `Confirmed physical handover for ${claim.itemReportCode} via claim ${claim.claimCode}.`,
      });
    }

    store.save();
    res.json({ claim });
  });

  app.patch('/api/admin/items/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const item = state.items.find((i) => i.id === req.params.id && i.active);
    if (!item) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    const nextStatus = req.body?.status as ItemStatus | undefined;
    const note = safeTrim(req.body?.note, 300);
    const confirmReturned = Boolean(req.body?.confirmReturned);
    const clearDuplicate = Boolean(req.body?.clearDuplicate);

    if (nextStatus) {
      if (!ALLOWED_STATUSES.includes(nextStatus)) {
        res.status(400).json({ error: 'Invalid status value.' });
        return;
      }
      if (nextStatus === 'Returned' && !confirmReturned) {
        res.status(400).json({ error: 'Confirmation is required before marking an item as Returned.' });
        return;
      }
      store.updateItemStatus(item, nextStatus, note || `Status updated to ${nextStatus} by administrator.`, 'admin');
      store.addNotification({
        userId: item.reporterId,
        title: `Status Update: ${item.reportCode}`,
        message: `Your report "${item.title}" is now marked as ${nextStatus}.`,
        relatedItemId: item.id,
      });
      store.addAuditLog({
        action: 'ITEM_STATUS_UPDATED',
        targetType: 'item',
        targetId: item.reportCode,
        adminId: req.auth!.sub,
        adminName: req.auth!.name,
        adminEmail: req.auth!.email,
        details: `Updated ${item.reportCode} status to ${nextStatus}.`,
      });
    }

    if (clearDuplicate) {
      item.suspectedDuplicate = false;
      item.updatedAt = new Date().toISOString();
      store.addAuditLog({
        action: 'DUPLICATE_FLAG_CLEARED',
        targetType: 'item',
        targetId: item.reportCode,
        adminId: req.auth!.sub,
        adminName: req.auth!.name,
        adminEmail: req.auth!.email,
        details: `Verified ${item.reportCode} is distinct and cleared duplicate warning flag.`,
      });
    }

    store.save();
    res.json({ item: store.toPublicItem(item) });
  });

  app.delete('/api/admin/items/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const item = state.items.find((i) => i.id === req.params.id && i.active);
    if (!item) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    item.active = false;
    item.updatedAt = new Date().toISOString();
    store.addAuditLog({
      action: 'ITEM_REPORT_DEACTIVATED',
      targetType: 'item',
      targetId: item.reportCode,
      adminId: req.auth!.sub,
      adminName: req.auth!.name,
      adminEmail: req.auth!.email,
      details: `Deactivated report ${item.reportCode} (${item.title}).`,
    });
    store.save();

    res.json({ ok: true });
  });

  app.post('/api/admin/categories', requireAdmin, (req: AuthedRequest, res: Response) => {
    const name = safeTrim(req.body?.name, 60);
    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const state = store.getState();
    if (state.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: 'Category already exists.' });
      return;
    }
    const cat = { id: `cat-${crypto.randomUUID().slice(0, 6)}`, name, active: true };
    state.categories.push(cat);
    store.addAuditLog({
      action: 'CATEGORY_ADDED',
      targetType: 'category',
      targetId: cat.id,
      adminId: req.auth!.sub,
      adminName: req.auth!.name,
      adminEmail: req.auth!.email,
      details: `Added item category "${name}".`,
    });
    store.save();
    res.status(201).json({ category: cat });
  });

  app.patch('/api/admin/categories/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const cat = state.categories.find((c) => c.id === req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    cat.active = Boolean(req.body?.active);
    store.addAuditLog({
      action: 'CATEGORY_TOGGLED',
      targetType: 'category',
      targetId: cat.id,
      adminId: req.auth!.sub,
      adminName: req.auth!.name,
      adminEmail: req.auth!.email,
      details: `${cat.active ? 'Activated' : 'Deactivated'} category "${cat.name}".`,
    });
    store.save();
    res.json({ category: cat });
  });

  app.post('/api/admin/locations', requireAdmin, (req: AuthedRequest, res: Response) => {
    const name = safeTrim(req.body?.name, 80);
    const zone = safeTrim(req.body?.zone, 80) || 'Academic blocks and classrooms';
    if (!name) {
      res.status(400).json({ error: 'Campus location name is required.' });
      return;
    }
    const state = store.getState();
    if (state.locations.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: 'Campus location already exists.' });
      return;
    }
    const loc = { id: `loc-${crypto.randomUUID().slice(0, 6)}`, name, zone, active: true };
    state.locations.push(loc);
    store.addAuditLog({
      action: 'LOCATION_ADDED',
      targetType: 'location',
      targetId: loc.id,
      adminId: req.auth!.sub,
      adminName: req.auth!.name,
      adminEmail: req.auth!.email,
      details: `Added campus location "${name}" (${zone}).`,
    });
    store.save();
    res.status(201).json({ location: loc });
  });

  app.patch('/api/admin/locations/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const loc = state.locations.find((l) => l.id === req.params.id);
    if (!loc) {
      res.status(404).json({ error: 'Campus location not found.' });
      return;
    }
    loc.active = Boolean(req.body?.active);
    store.addAuditLog({
      action: 'LOCATION_TOGGLED',
      targetType: 'location',
      targetId: loc.id,
      adminId: req.auth!.sub,
      adminName: req.auth!.name,
      adminEmail: req.auth!.email,
      details: `${loc.active ? 'Activated' : 'Deactivated'} location "${loc.name}".`,
    });
    store.save();
    res.json({ location: loc });
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const state = store.getState();
    const user = state.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    user.active = Boolean(req.body?.active);
    store.addAuditLog({
      action: 'USER_ACCOUNT_UPDATED',
      targetType: 'user',
      targetId: user.studentId,
      adminId: req.auth!.sub,
      adminName: req.auth!.name,
      adminEmail: req.auth!.email,
      details: `${user.active ? 'Activated' : 'Suspended'} user account ${user.email}.`,
    });
    store.save();
    res.json({ user: store.sanitizeUser(user) });
  });

  // --- Vite Dev Middleware or Static Dist ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Production build not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Lost and Found System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
