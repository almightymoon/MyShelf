import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { query } from './db.js';
import { adminRequired, authRequired, bcrypt, ensureAdminUser, signToken, ADMIN_EMAIL } from './auth.js';
import { ensureBucket, getObjectStream, publicObjectUrl, putObject, removeObject } from './storage.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const maxMb = Number(process.env.MAX_UPLOAD_MB || 300);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
});

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '12mb' }));

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    blocked: Boolean(row.blocked),
    created_at: row.created_at,
  };
}

function mapSite(row) {
  if (!row) return null;
  const look = row.look || {};
  return {
    id: row.id,
    title: row.title,
    blurb: row.blurb || '',
    url: row.url,
    category: row.category || 'studio',
    description: row.description || '',
    exploreNote: row.explore_note || '',
    image: row.image_url || '',
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    cardBg: look.cardBg,
    titleColor: look.titleColor,
    bodyColor: look.bodyColor,
    accentColor: look.accentColor,
    imagePosition: look.imagePosition,
    textAlign: look.textAlign,
    createdAt: row.created_at,
  };
}

function siteToRow(site, sortOrder = 0) {
  return {
    title: site.title,
    blurb: site.blurb || '',
    url: site.url,
    category: site.category || null,
    description: site.description || '',
    explore_note: site.exploreNote || '',
    image_url: site.image || '',
    gallery: JSON.stringify(site.gallery || []),
    look: JSON.stringify({
      cardBg: site.cardBg,
      titleColor: site.titleColor,
      bodyColor: site.bodyColor,
      accentColor: site.accentColor,
      imagePosition: site.imagePosition,
      textAlign: site.textAlign,
    }),
    sort_order: sortOrder,
  };
}

function mapIdea(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    type: row.type || 'Reference',
    access: row.access === 'paid' ? 'paid' : 'free',
    price: row.price != null ? Number(row.price) : undefined,
    image: row.image_url,
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
}

function mapModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    note: row.note || '',
    filename: row.filename || '',
    storagePath: row.storage_path || '',
    src: row.src_url || (row.storage_path ? publicObjectUrl(row.storage_path) : ''),
    size: row.size || 0,
    sample: Boolean(row.sample),
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, maxUploadMb: maxMb });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim() || email.split('@')[0];
    const password = String(req.body.password || '');
    if (!email || password.length < 6) {
      return res.status(400).json({ error: 'Valid email and password (6+) required' });
    }
    const role = email === ADMIN_EMAIL ? 'admin' : 'member';
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `insert into users (email, name, password_hash, role)
       values ($1, $2, $3, $4)
       returning id, email, name, role, blocked, created_at`,
      [email, name, hash, role]
    );
    const user = mapUser(result.rows[0]);
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    if (String(err.message || '').includes('duplicate')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const result = await query('select * from users where lower(email) = $1', [email]);
    const row = result.rows[0];
    if (!row) return res.status(400).json({ error: 'Invalid login credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid login credentials' });
    if (row.blocked && row.role !== 'admin') {
      return res.status(403).json({ error: 'Your account has been blocked from Athar’s Shelf.' });
    }
    const user = mapUser(row);
    if (user.email === ADMIN_EMAIL) user.role = 'admin';
    res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const result = await query(
      'select id, email, name, role, blocked, created_at from users where id = $1',
      [req.user.sub]
    );
    const user = mapUser(result.rows[0]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.blocked && user.role !== 'admin') {
      return res.status(403).json({ error: 'Your account has been blocked from Athar’s Shelf.', code: 'blocked' });
    }
    if (user.email === ADMIN_EMAIL) user.role = 'admin';
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile lookup failed' });
  }
});

app.get('/api/shelf', async (req, res) => {
  try {
    const [sites, ideas, categories, models, likes, comments] = await Promise.all([
      query('select * from sites order by sort_order asc, created_at desc'),
      query('select * from ideas order by sort_order asc, created_at desc'),
      query('select * from categories order by label'),
      query('select * from models order by created_at desc'),
      query('select idea_id, user_id from idea_likes'),
      query('select * from idea_comments order by created_at asc'),
    ]);

    let messages = [];
    let users = [];
    let messagesError = null;
    let usersError = null;

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    let isAdmin = false;
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const payload = jwt.default.verify(token, process.env.JWT_SECRET || 'dev-secret');
        isAdmin = payload.role === 'admin' || String(payload.email || '').toLowerCase() === ADMIN_EMAIL;
      } catch {
        /* guest */
      }
    }

    if (isAdmin) {
      try {
        const msgRes = await query('select * from messages order by created_at desc');
        messages = msgRes.rows.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          message: m.body,
          createdAt: m.created_at,
        }));
      } catch (err) {
        messagesError = err.message;
      }
      try {
        const userRes = await query(
          'select id, email, name, role, blocked, created_at from users order by created_at desc'
        );
        users = userRes.rows.map((u) => ({
          ...mapUser(u),
          createdAt: u.created_at ? Date.parse(u.created_at) : Date.now(),
        }));
      } catch (err) {
        usersError = err.message;
      }
    }

    res.json({
      configured: true,
      sites: sites.rows.map(mapSite),
      ideas: ideas.rows.map(mapIdea),
      categories: categories.rows,
      models: models.rows.map(mapModel),
      messages,
      messagesError,
      users,
      usersError,
      likes: likes.rows,
      comments: comments.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to load shelf' });
  }
});

app.post('/api/sites', adminRequired, async (req, res) => {
  try {
    const row = siteToRow(req.body, req.body.sortOrder ?? 0);
    const result = await query(
      `insert into sites (title, blurb, url, category, description, explore_note, image_url, gallery, look, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)
       returning *`,
      [
        row.title,
        row.blurb,
        row.url,
        row.category,
        row.description,
        row.explore_note,
        row.image_url,
        row.gallery,
        row.look,
        row.sort_order,
      ]
    );
    res.json(mapSite(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sites/:id', adminRequired, async (req, res) => {
  try {
    const row = siteToRow(req.body, req.body.sortOrder ?? 0);
    const result = await query(
      `update sites set title=$1, blurb=$2, url=$3, category=$4, description=$5, explore_note=$6,
       image_url=$7, gallery=$8::jsonb, look=$9::jsonb, sort_order=$10
       where id=$11 returning *`,
      [
        row.title,
        row.blurb,
        row.url,
        row.category,
        row.description,
        row.explore_note,
        row.image_url,
        row.gallery,
        row.look,
        row.sort_order,
        req.params.id,
      ]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json(mapSite(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sites/:id', adminRequired, async (req, res) => {
  await query('delete from sites where id = $1', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/categories', adminRequired, async (req, res) => {
  const { id, label } = req.body;
  const result = await query(
    `insert into categories (id, label) values ($1, $2)
     on conflict (id) do update set label = excluded.label
     returning *`,
    [id, label]
  );
  res.json(result.rows[0]);
});

app.delete('/api/categories/:id', adminRequired, async (req, res) => {
  await query('delete from categories where id = $1', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/ideas', adminRequired, async (req, res) => {
  const idea = req.body;
  const result = await query(
    `insert into ideas (id, title, type, access, price, image_url, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (id) do update set
       title = excluded.title,
       type = excluded.type,
       access = excluded.access,
       price = excluded.price,
       image_url = excluded.image_url,
       sort_order = excluded.sort_order
     returning *`,
    [
      idea.id,
      idea.title,
      idea.type || 'Reference',
      idea.access === 'paid' ? 'paid' : 'free',
      idea.access === 'paid' ? idea.price ?? 0 : null,
      idea.image,
      idea.sortOrder ?? 0,
    ]
  );
  res.json(mapIdea(result.rows[0]));
});

app.delete('/api/ideas/:id', adminRequired, async (req, res) => {
  await query('delete from ideas where id = $1', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/models', adminRequired, async (req, res) => {
  const m = req.body;
  const result = await query(
    `insert into models (id, title, note, filename, storage_path, src_url, size, sample)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (id) do update set
       title = excluded.title,
       note = excluded.note,
       filename = excluded.filename,
       storage_path = excluded.storage_path,
       src_url = excluded.src_url,
       size = excluded.size,
       sample = excluded.sample
     returning *`,
    [
      m.id,
      m.title,
      m.note || '',
      m.filename || '',
      m.storagePath || null,
      m.src || null,
      m.size ?? null,
      Boolean(m.sample),
    ]
  );
  res.json(mapModel(result.rows[0]));
});

app.delete('/api/models/:id', adminRequired, async (req, res) => {
  const existing = await query('select storage_path from models where id = $1', [req.params.id]);
  const path = existing.rows[0]?.storage_path;
  await query('delete from models where id = $1', [req.params.id]);
  if (path) await removeObject(path).catch(() => {});
  res.json({ ok: true });
});

app.post('/api/messages', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });
  await query('insert into messages (name, email, body) values ($1,$2,$3)', [name, email, message]);
  res.json({ ok: true });
});

app.post('/api/ideas/:id/like', authRequired, async (req, res) => {
  const ideaId = req.params.id;
  const userId = req.user.sub;
  const liked = Boolean(req.body.liked);
  if (liked) {
    await query('delete from idea_likes where idea_id = $1 and user_id = $2', [ideaId, userId]);
    return res.json({ liked: false });
  }
  await query(
    `insert into idea_likes (idea_id, user_id) values ($1,$2)
     on conflict do nothing`,
    [ideaId, userId]
  );
  res.json({ liked: true });
});

app.post('/api/ideas/:id/comments', authRequired, async (req, res) => {
  const text = String(req.body.text || '').trim();
  const name = String(req.body.name || 'Guest').trim();
  if (!text) return res.status(400).json({ error: 'Comment required' });
  const result = await query(
    `insert into idea_comments (idea_id, user_id, name, body)
     values ($1,$2,$3,$4) returning *`,
    [req.params.id, req.user.sub, name, text]
  );
  const c = result.rows[0];
  res.json({ id: c.id, idea_id: c.idea_id, name: c.name, body: c.body, created_at: c.created_at });
});

app.post('/api/users', adminRequired, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim() || email.split('@')[0];
    const password = String(req.body.password || '');
    if (!email || password.length < 6) {
      return res.status(400).json({ error: 'Valid email and password (6+) required' });
    }
    if (email === ADMIN_EMAIL) return res.status(400).json({ error: 'That email is reserved for the admin' });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `insert into users (email, name, password_hash, role, blocked)
       values ($1,$2,$3,'member', false)
       returning id, email, name, role, blocked, created_at`,
      [email, name, hash]
    );
    res.json(mapUser(result.rows[0]));
  } catch (err) {
    if (String(err.message || '').includes('duplicate')) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id', adminRequired, async (req, res) => {
  const id = req.params.id;
  const target = await query('select * from users where id = $1', [id]);
  const row = target.rows[0];
  if (!row) return res.status(404).json({ error: 'User not found' });
  const isProtected = row.role === 'admin' || String(row.email).toLowerCase() === ADMIN_EMAIL;
  if (isProtected && req.body.blocked === true) {
    return res.status(400).json({ error: 'Cannot block the admin account' });
  }
  const name = req.body.name != null ? String(req.body.name).trim() : row.name;
  const blocked = typeof req.body.blocked === 'boolean' ? req.body.blocked : row.blocked;
  const result = await query(
    `update users set name = $1, blocked = $2 where id = $3
     returning id, email, name, role, blocked, created_at`,
    [name || row.name, blocked, id]
  );
  res.json(mapUser(result.rows[0]));
});

app.delete('/api/users/:id', adminRequired, async (req, res) => {
  const id = req.params.id;
  const target = await query('select * from users where id = $1', [id]);
  const row = target.rows[0];
  if (!row) return res.status(404).json({ error: 'User not found' });
  if (row.role === 'admin' || String(row.email).toLowerCase() === ADMIN_EMAIL) {
    return res.status(400).json({ error: 'Cannot delete the admin account' });
  }
  await query('delete from users where id = $1', [id]);
  res.json({ ok: true });
});

app.post('/api/upload', adminRequired, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const folder = String(req.body.folder || 'uploads').replace(/[^a-z0-9_-]/gi, '');
    const safe = (req.file.originalname || 'file.bin').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const objectName = `${folder}/${Date.now()}-${safe}`;
    const uploaded = await putObject(objectName, req.file.buffer, req.file.mimetype);
    res.json(uploaded);
  } catch (err) {
    console.error(err);
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large (max ${maxMb}MB)` });
    }
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

app.delete('/api/upload', adminRequired, async (req, res) => {
  const path = String(req.body.path || '');
  await removeObject(path);
  res.json({ ok: true });
});

app.get(/^\/media\/(.+)$/, async (req, res) => {
  try {
    const objectName = decodeURIComponent(req.params[0]);
    const stream = await getObjectStream(objectName);
    stream.on('error', () => res.status(404).end());
    stream.pipe(res);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large (max ${maxMb}MB)` });
  }
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

async function boot() {
  await ensureBucket();
  await ensureAdminUser();
  app.listen(port, () => {
    console.log(`Athar's Shelf API on :${port} (upload limit ${maxMb}MB)`);
  });
}

boot().catch((err) => {
  console.error('Failed to start API', err);
  process.exit(1);
});
