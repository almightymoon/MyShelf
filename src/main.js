import './styles/styles.css';
import './styles/overrides.css';
import './styles/results.css';
import './styles/values.css';
import './styles/editor.css';
import './styles/appearance.css';
import './styles/extras.css';
import './styles/models.css';
import './styles/experience.css';
import {
  addIdeaComment,
  deleteCategory,
  deleteIdea,
  deleteSite,
  fetchProfile,
  insertMessage,
  isSupabaseConfigured,
  loadShelf,
  seedDefaults,
  signIn,
  signOut,
  signUp,
  supabase,
  toggleIdeaLike as setIdeaLikeRemote,
  uploadDataUrl,
  upsertCategory,
  upsertIdea,
  upsertModel,
  upsertSite,
} from './lib/db.js';
import {
  createObjectUrl,
  deleteModelBlob,
  getModelBlob,
  uploadModelFile,
} from './models.js';

const ADMIN = {
  email: 'atharqulimoon@gmail.com',
  password: 'Roll#947131',
};

const defaults = [
  {
    title: 'Other Means',
    blurb: 'Culture, brand, and sharp moments.',
    category: 'studio',
    description: 'A studio for culture and brand moments.',
    exploreNote: 'What stands out is the pacing — every section feels intentional, never busy. Typography and motion share the same quiet confidence.',
    url: 'https://othermeans.studio',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Noma Projects',
    blurb: 'Objects with a story attached.',
    category: 'shop',
    description: 'Curiosities from the Noma universe.',
    exploreNote: 'The shop feels like an extension of the restaurant’s world — tactile photography, restrained type, and products that read as souvenirs from another place.',
    url: 'https://nomaprojects.com',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Field Notes',
    blurb: 'A slower kind of internet.',
    category: 'culture',
    description: 'Notes from a slower kind of life.',
    exploreNote: 'Editorial calm done right. The site trusts white space and lets the product photography do most of the talking.',
    url: 'https://fieldnotesbrand.com',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Mina Kwon',
    blurb: 'Soft colours, sharp perspective.',
    category: 'portfolio',
    description: 'A portfolio that knows when to stay quiet.',
    exploreNote: 'Colour is used like a signature — never decorative noise. The work is left room to breathe, which makes each project land harder.',
    url: 'https://example.com',
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Aesop',
    blurb: 'A sensory storefront online.',
    category: 'shop',
    description: 'A sensory world, beautifully built.',
    exploreNote: 'Aesop’s digital presence matches the brand: considered materials, deliberate hierarchy, and almost no wasted motion.',
    url: 'https://www.aesop.com',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Yuko Shimizu',
    blurb: 'Ink with wild instinct.',
    category: 'portfolio',
    description: 'Ink, instinct and wildness.',
    exploreNote: 'The site stays out of the way of the illustrations. High-contrast work, strong grids, and a portfolio rhythm that feels hand-led.',
    url: 'https://yukoart.com',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80',
  },
];

const fallbackImage =
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85';

const galleryFallbacks = [
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?auto=format&fit=crop&w=1400&q=85',
];

const defaultIdeas = [
  { id: 'soft-chrome', title: 'Soft chrome', type: 'Material study', access: 'free', image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=900&q=85' },
  { id: 'quiet-architecture', title: 'Quiet architecture', type: 'Space', access: 'free', image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85' },
  { id: 'red-interruption', title: 'A red interruption', type: 'Colour', access: 'paid', price: 4, image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85' },
  { id: 'type-in-motion', title: 'Type in motion', type: 'Typography', access: 'free', image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=900&q=85' },
  { id: 'blue-room', title: 'The blue room', type: 'Atmosphere', access: 'free', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=900&q=85' },
  { id: 'gloss-grain', title: 'Gloss & grain', type: 'Material study', access: 'paid', price: 6, image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=900&q=85' },
  { id: 'useful-object', title: 'A useful object', type: 'Object', access: 'free', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=85' },
  { id: 'paper-folded', title: 'Paper, folded', type: 'Composition', access: 'free', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85' },
  { id: 'late-afternoon', title: 'Late afternoon', type: 'Light', access: 'free', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85' },
  { id: 'frame-within', title: 'A frame within', type: 'Composition', access: 'free', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=85' },
  { id: 'signal-orange', title: 'Signal orange', type: 'Colour', access: 'paid', price: 3, image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85' },
  { id: 'almost-tactile', title: 'Almost tactile', type: 'Texture', access: 'free', image: 'https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=900&q=85' },
];

const ideaQualityMap = {
  preview: { w: 720, q: 60, label: 'preview' },
  high: { w: 1600, q: 85, label: 'high' },
  print: { w: 2400, q: 90, label: 'print' },
};

const defaultModels = [
  {
    id: 'sample-astronaut',
    title: 'Astronaut study',
    note: 'A classic spatial reference — orbit, light, and clean silhouette.',
    filename: 'Astronaut.glb',
    src: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    createdAt: Date.now() - 86400000 * 3,
    sample: true,
  },
  {
    id: 'sample-robot',
    title: 'Robot expressive',
    note: 'Character form in the round — useful when you need presence, not polish.',
    filename: 'RobotExpressive.glb',
    src: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    createdAt: Date.now() - 86400000 * 2,
    sample: true,
  },
  {
    id: 'sample-armstrong',
    title: 'Neil Armstrong',
    note: 'Figure study with a clear silhouette — good for scale and framing.',
    filename: 'NeilArmstrong.glb',
    src: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
    createdAt: Date.now() - 86400000,
    sample: true,
  },
];

function ensureSampleModels(list) {
  let current = Array.isArray(list) ? [...list] : [];
  if (!current.length) return [...defaultModels];

  const replacements = {
    'sample-chair': 'sample-armstrong',
    'sample-helmet': 'sample-armstrong',
  };
  current = current.map((model) => {
    const nextId = replacements[model.id];
    if (!nextId) return model;
    const sample = defaultModels.find((item) => item.id === nextId);
    return sample ? { ...sample } : model;
  });

  const ids = new Set(current.map((m) => m.id));
  for (const sample of defaultModels) {
    if (!ids.has(sample.id) && current.every((m) => m.sample)) {
      current.push({ ...sample });
      ids.add(sample.id);
    }
  }
  return current;
}

const ideaSeedNotes = {
  'late-afternoon': {
    likes: 12,
    likedBy: [],
    comments: [
      { name: 'Mina', text: 'That shadow line is everything — warm light done quietly.', at: Date.now() - 86400000 * 2 },
      { name: 'Jules', text: 'Feels like a still from a road trip film.', at: Date.now() - 86400000 },
    ],
  },
  'soft-chrome': {
    likes: 7,
    likedBy: [],
    comments: [{ name: 'Ari', text: 'Chrome like soft metal — saving for a product page mood.', at: Date.now() - 86400000 * 4 }],
  },
};

const get = (k, f = []) => JSON.parse(localStorage.getItem(k) || JSON.stringify(f));
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const $ = (s) => document.querySelector(s);

function normalizeIdeas(list) {
  return (Array.isArray(list) ? list : []).map((idea, i) => ({
    access: 'free',
    ...idea,
    id: idea.id || `idea-${Date.now()}-${i}`,
    title: idea.title || 'Untitled pin',
    type: idea.type || 'Reference',
    image: idea.image || '',
  })).filter((idea) => idea.image);
}

let ideas = [];
let sites = [];
let messages = [];
let activeFilter = 'all';
let query = '';
let reverse = false;
let editingSiteIndex = null;
let draftCover = '';
let draftGallery = [];
let modelMeta = [];
let currentProfile = null;
let ideaNotesCache = {};
const modelObjectUrls = new Map();
let supabaseReady = false;

async function resolveModelUrl(meta) {
  if (!meta) return null;
  if (meta.src) return meta.src;
  if (modelObjectUrls.has(meta.id)) return modelObjectUrls.get(meta.id);
  const record = await getModelBlob(meta.id);
  if (!record?.blob) return null;
  const url = createObjectUrl(record.blob);
  modelObjectUrls.set(meta.id, url);
  return url;
}

const defaultCategories = [
  { id: 'studio', label: 'Studios' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'culture', label: 'Culture' },
  { id: 'shop', label: 'Shops' },
];

function slugifyCategory(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'category';
}

function loadCategories() {
  const map = new Map();
  defaultCategories.forEach((cat) => map.set(cat.id, { id: cat.id, label: cat.label || cat.id }));
  sites.forEach((site) => {
    if (!site.category || map.has(site.category)) return;
    map.set(site.category, {
      id: site.category,
      label: site.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  });
  return [...map.values()];
}

let categories = [...defaultCategories];

function saveCategories() {
  /* categories persist via Supabase helpers */
}

function categoryLabel(id) {
  return categories.find((c) => c.id === id)?.label || id;
}

function normalizeSites(list) {
  return (Array.isArray(list) ? list : []).map((site, index) => {
    const cover = site.image || fallbackImage;
    let gallery = parseGallery(site.gallery).filter(Boolean);
    gallery = gallery.filter((src, i, all) => src && all.indexOf(src) === i);
    if (!gallery.length || (gallery.length === 1 && gallery[0] === cover)) {
      gallery = [cover, galleryFallbacks[index % galleryFallbacks.length]].filter(
        (src, i, all) => all.indexOf(src) === i
      );
    }
    return {
      ...site,
      gallery,
      blurb: site.blurb || site.description || '',
    };
  });
}

const lookDefaults = {
  cardBg: '#ffffff',
  titleColor: '#202020',
  bodyColor: '#696969',
  accentColor: '#ff7556',
  imagePosition: 'center',
  textAlign: 'left',
};

function lookOf(site) {
  return {
    cardBg: site.cardBg || lookDefaults.cardBg,
    titleColor: site.titleColor || lookDefaults.titleColor,
    bodyColor: site.bodyColor || lookDefaults.bodyColor,
    accentColor: site.accentColor || lookDefaults.accentColor,
    imagePosition: site.imagePosition || lookDefaults.imagePosition,
    textAlign: site.textAlign || lookDefaults.textAlign,
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char]));
}

function parseGallery(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not process that image.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderGalleryUploads() {
  const wrap = $('#galleryUploads');
  const clearBtn = $('#clearGallery');
  if (!wrap) return;
  wrap.innerHTML = draftGallery
    .map(
      (src, i) =>
        `<div class="gallery-upload-item"><img src="${src}" alt="Gallery upload ${i + 1}"><button type="button" data-remove-gallery="${i}" aria-label="Remove image">×</button></div>`
    )
    .join('');
  if (clearBtn) clearBtn.hidden = !draftGallery.length;
}

function syncCoverUploadUi() {
  const clearBtn = $('#clearCover');
  const status = $('#coverUploadStatus');
  if (clearBtn) clearBtn.hidden = !draftCover;
  if (status) status.textContent = draftCover ? 'Cover image ready.' : '';
}

function clearDraftMedia() {
  draftCover = '';
  draftGallery = [];
  const coverInput = $('#coverUpload');
  const galleryInput = $('#galleryUpload');
  if (coverInput) coverInput.value = '';
  if (galleryInput) galleryInput.value = '';
  syncCoverUploadUi();
  renderGalleryUploads();
}

function isAdmin() {
  if (currentProfile?.role === 'admin') return true;
  const email = String(currentProfile?.email || '').trim().toLowerCase();
  return Boolean(email && email === ADMIN.email.toLowerCase());
}

function setAdmin() {
  /* no-op — admin comes from Supabase profile.role */
}

function getUsers() {
  return get('athar-shelf-users-cache', []);
}

function saveUsers(users) {
  set('athar-shelf-users-cache', users);
}

function getMemberSession() {
  if (!currentProfile) return null;
  return { email: currentProfile.email, name: currentProfile.name, id: currentProfile.id };
}

function setMemberSession() {
  /* session lives in Supabase Auth */
}

function isMember() {
  return Boolean(currentProfile?.email);
}

function canDownload() {
  return isAdmin() || isMember();
}

function canDownloadIdea(idea) {
  if (!idea) return false;
  if (isAdmin()) return true;
  if (!isMember()) return false;
  return idea.access !== 'paid';
}

/** @deprecated use isAdmin — kept for fewer churn points during migration */
function isLoggedIn() {
  return isAdmin();
}

function setLoggedIn() {
  /* no-op */
}

let activeIdeaIndex = null;
let pendingDownload = null;
let draftIdeaImage = '';

function syncAccountUi() {
  const member = getMemberSession();
  const admin = isAdmin();
  const guest = $('#accountGuest');
  const account = $('#accountMember');
  const navAdmin = $('#navAdmin');
  const signedIn = Boolean(member) || admin;

  if (guest) guest.hidden = signedIn;
  if (account) account.hidden = !signedIn;
  if (navAdmin) navAdmin.hidden = !admin;

  if (signedIn && $('#accountChip')) {
    const name = member?.name || (admin ? 'Athar Iqbal' : 'U');
    const email = member?.email || (admin ? ADMIN.email : '');
    const initials = name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    $('#accountChip').textContent = initials || (admin ? 'AI' : 'U');
    $('#accountChip').title = email || name;
  }
  syncModelDownloadUi();
  syncIdeaDownloadUi();
}

function requireDownloadAuth(kind, payload) {
  pendingDownload = { kind, ...payload };
  if (kind === 'idea') closeIdea();
  if (kind === 'model') closeModelDetail();
  window.location.hash = 'login';
  const note = $('#memberLoginNote');
  if (note) {
    note.textContent = 'Log in to finish your download.';
    note.classList.remove('error');
  }
}

async function resumePendingDownload() {
  if (!pendingDownload || !canDownload()) return;
  const job = pendingDownload;
  pendingDownload = null;
  if (job.kind === 'model' && job.id) {
    window.location.hash = 'models';
    await openModelDetail(job.id);
    await downloadActiveModel(true);
  } else if (job.kind === 'idea' && Number.isInteger(job.index)) {
    window.location.hash = 'ideas';
    openIdea(job.index);
    const idea = ideas[job.index];
    if (canDownloadIdea(idea)) await downloadActiveIdea(true);
  }
}

function renderSites() {
  let shown = sites.filter(
    (s) =>
      (activeFilter === 'all' || s.category === activeFilter) &&
      `${s.title} ${s.blurb || ''} ${s.description} ${s.exploreNote || ''} ${s.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  if (reverse) shown = [...shown].reverse();

  $('#siteGrid').innerHTML =
    shown
      .map((s, i) => {
        const look = lookOf(s);
        const index = sites.indexOf(s);
        const line = s.blurb || '';
        return `<article class="site-card" data-site-index="${index}" style="--site-background:${look.cardBg};--site-title:${look.titleColor};--site-body:${look.bodyColor};--site-accent:${look.accentColor};text-align:${look.textAlign}">
          <div class="cover"><img src="${escapeHtml(s.image || fallbackImage)}" alt="${escapeHtml(s.title)}" style="object-position:${look.imagePosition}"><span class="card-top">${escapeHtml(categoryLabel(s.category))}</span><div class="card-overlay"><span class="open">↗</span></div></div>
          <div class="card-info"><div><h3>${escapeHtml(s.title)}</h3>${line ? `<p class="card-blurb">${escapeHtml(line)}</p>` : ''}</div><span class="card-index">${String(i + 1).padStart(2, '0')}</span></div>
        </article>`;
      })
      .join('') || '<p>No websites match that search.</p>';

  $('#resultCount').textContent = `${String(shown.length).padStart(2, '0')} results`;
  $('#siteGrid').setAttribute('aria-busy', 'false');
  renderHomeSites();
  const countEl = $('#siteCount');
  if (countEl) countEl.textContent = String(sites.length).padStart(2, '0');
}

function renderHomeSites() {
  const grid = $('#homeSiteGrid');
  if (!grid) return;
  grid.innerHTML = sites.slice(0, 3).map((s, i) => {
    const look = lookOf(s);
    const index = sites.indexOf(s);
    return `<article class="site-card" data-depth="${i + 1}" data-site-index="${index}" tabindex="0" role="button" aria-label="Open ${escapeHtml(s.title)}" style="--site-background:${look.cardBg};--site-title:${look.titleColor};--site-body:${look.bodyColor};--site-accent:${look.accentColor};text-align:${look.textAlign}">
      <div class="cover"><img src="${escapeHtml(s.image || fallbackImage)}" alt="${escapeHtml(s.title)}" style="object-position:${look.imagePosition}"><span class="card-top">${escapeHtml(categoryLabel(s.category))}</span><div class="card-overlay"><span class="open">↗</span></div></div>
      <div class="card-info"><div><h3>${escapeHtml(s.title)}</h3>${s.blurb ? `<p class="card-blurb">${escapeHtml(s.blurb)}</p>` : ''}</div><span class="card-index">${String(i + 1).padStart(2, '0')}</span></div>
    </article>`;
  }).join('');
  grid.setAttribute('aria-busy', 'false');
}

function renderIdeas() {
  const wall = $('#ideasWall');
  if (!wall) return;
  wall.innerHTML = ideas.map((idea, i) => `<article class="idea-pin" data-idea-index="${i}" tabindex="0" role="button" aria-label="Open ${escapeHtml(idea.title)}">
    <img src="${idea.image}" alt="${escapeHtml(idea.title)}" loading="lazy"><div><span>${escapeHtml(idea.type)}</span><h2>${escapeHtml(idea.title)}</h2><b>↗</b></div>
  </article>`).join('');
  $('#ideasCount').textContent = `${String(ideas.length).padStart(2, '0')} pins`;
}

function ideaKey(index) {
  return ideas[index]?.id || String(index);
}

function getIdeaNotes() {
  return ideaNotesCache;
}

function saveIdeaNotes(notes) {
  ideaNotesCache = notes;
}

function ideaSocial(index) {
  const notes = getIdeaNotes();
  const key = ideaKey(index);
  if (!notes[key]) notes[key] = { likes: 0, likedBy: [], comments: [] };
  return notes[key];
}

function memberId() {
  return currentProfile?.id || currentProfile?.email || null;
}

function buildIdeaNotes(likes, comments) {
  const notes = {};
  (likes || []).forEach((like) => {
    const key = like.idea_id;
    if (!notes[key]) notes[key] = { likes: 0, likedBy: [], comments: [] };
    notes[key].likedBy.push(like.user_id);
    notes[key].likes = notes[key].likedBy.length;
  });
  (comments || []).forEach((c) => {
    const key = c.idea_id;
    if (!notes[key]) notes[key] = { likes: 0, likedBy: [], comments: [] };
    notes[key].comments.push({
      name: c.name,
      text: c.body,
      at: c.created_at ? Date.parse(c.created_at) : Date.now(),
    });
  });
  return notes;
}

async function saveIdeas() {
  /* individual idea writes go through upsertIdea/deleteIdea */
}

function ideaQualityUrl(src, quality) {
  const preset = ideaQualityMap[quality] || ideaQualityMap.high;
  try {
    const url = new URL(src);
    url.searchParams.set('w', String(preset.w));
    url.searchParams.set('q', String(preset.q));
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  } catch {
    return src;
  }
}

function selectedIdeaQuality() {
  return document.querySelector('input[name="ideaQuality"]:checked')?.value || 'high';
}

function openIdeaPanel() {
  const panel = $('#ideaSidePanel');
  if (!panel) return;
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  $('#ideaLightbox')?.classList.add('panel-open');
}

function closeIdeaPanel() {
  const panel = $('#ideaSidePanel');
  if (!panel) return;
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  $('#ideaLightbox')?.classList.remove('panel-open');
}

function renderIdeaAccess(idea) {
  const el = $('#ideaPanelAccess');
  if (!el || !idea) return;
  if (idea.access === 'paid') {
    el.innerHTML = `<span class="idea-access paid">Paid pin</span><p>High-res download · $${idea.price || 4}. Members can preview; full download stays with Athar for now — <a href="#contact">send a request</a>.</p>`;
  } else {
    el.innerHTML = `<span class="idea-access free">Free pin</span><p>Open for members — pick a quality and download.</p>`;
  }
}

function renderIdeaSocial() {
  if (activeIdeaIndex === null) return;
  const social = ideaSocial(activeIdeaIndex);
  const uid = memberId();
  const liked = uid ? social.likedBy.includes(uid) : false;
  const likeBtn = $('#ideaLikeBtn');
  const likeCount = $('#ideaLikeCount');
  if (likeBtn) {
    likeBtn.classList.toggle('is-liked', liked);
    likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    likeBtn.innerHTML = liked
      ? '<span aria-hidden="true">♥</span> Liked'
      : '<span aria-hidden="true">♡</span> Like this pin';
  }
  if (likeCount) {
    const n = social.likes || 0;
    likeCount.textContent = `${n} like${n === 1 ? '' : 's'}`;
  }
  const list = $('#ideaComments');
  if (!list) return;
  if (!social.comments?.length) {
    list.innerHTML = '<p class="idea-comments-empty">No comments yet — leave the first feeling.</p>';
  } else {
    list.innerHTML = social.comments
      .slice()
      .reverse()
      .map(
        (c) => `<article class="idea-comment"><header><b>${escapeHtml(c.name)}</b><time>${new Date(c.at).toLocaleDateString()}</time></header><p>${escapeHtml(c.text)}</p></article>`
      )
      .join('');
  }
  const note = $('#ideaCommentNote');
  if (note) {
    note.textContent = canDownload()
      ? 'Be kind — this is a shared mood board.'
      : 'Log in to like or comment.';
    note.classList.toggle('error', false);
  }
}

function openIdea(index) {
  const idea = ideas[index];
  if (!idea) return;
  activeIdeaIndex = index;
  closeIdeaPanel();
  $('#ideaLightboxImage').src = idea.image;
  $('#ideaLightboxImage').alt = idea.title;
  $('#ideaLightboxType').textContent = idea.type;
  $('#ideaLightboxTitle').textContent = idea.title;
  if ($('#ideaPanelTitle')) $('#ideaPanelTitle').textContent = idea.title;
  renderIdeaAccess(idea);
  renderIdeaSocial();
  syncIdeaDownloadUi();
  const preview = document.querySelector('input[name="ideaQuality"][value="preview"]');
  if (preview) preview.checked = true;
  $('#ideaLightbox').classList.add('show');
  $('#ideaLightbox').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeIdea() {
  activeIdeaIndex = null;
  closeIdeaPanel();
  $('#ideaLightbox').classList.remove('show');
  $('#ideaLightbox').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  syncIdeaDownloadUi();
}

function syncIdeaDownloadUi() {
  const hint = $('#ideaDownloadHint');
  const btn = $('#ideaDownloadBtn');
  const quality = $('#ideaQuality');
  if (!btn) return;
  const open = activeIdeaIndex !== null;
  const idea = open ? ideas[activeIdeaIndex] : null;
  const allowed = canDownloadIdea(idea);
  btn.hidden = !open;
  btn.disabled = false;
  if (quality) quality.hidden = !open || (idea?.access === 'paid' && !isAdmin());
  if (hint) {
    if (!open || allowed) {
      hint.hidden = true;
      hint.innerHTML = '';
    } else if (!canDownload()) {
      hint.hidden = false;
      hint.innerHTML = 'Log in required — <a href="#login">Log in</a> or <a href="#signup">Sign up</a> to download free pins.';
    } else {
      hint.hidden = false;
      hint.innerHTML = 'Paid pin — <a href="#contact">request access</a> from Athar. Preview viewing stays open.';
    }
  }
  if (btn && idea?.access === 'paid' && canDownload() && !isAdmin()) {
    btn.innerHTML = 'Request access <span>↗</span>';
  } else if (btn) {
    btn.innerHTML = 'Download image <span>↓</span>';
  }
}

async function downloadActiveIdea(skipAuthCheck = false) {
  if (activeIdeaIndex === null) return;
  const idea = ideas[activeIdeaIndex];
  if (!idea) return;

  if (!skipAuthCheck && !canDownload()) {
    requireDownloadAuth('idea', { index: activeIdeaIndex });
    return;
  }

  if (!canDownloadIdea(idea)) {
    closeIdea();
    window.location.hash = 'contact';
    const status = $('#formStatus');
    if (status) {
      status.textContent = `Request access to “${idea.title}” (paid pin · $${idea.price || 4}).`;
    }
    return;
  }

  const quality = selectedIdeaQuality();
  const preset = ideaQualityMap[quality] || ideaQualityMap.high;
  const src = ideaQualityUrl(idea.image, quality);
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${idea.title.replace(/\s+/g, '-').toLowerCase()}-${preset.label}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(src, '_blank', 'noopener');
  }
}

async function toggleIdeaLike() {
  if (activeIdeaIndex === null) return;
  if (!canDownload()) {
    requireDownloadAuth('idea', { index: activeIdeaIndex });
    return;
  }
  const uid = memberId();
  const idea = ideas[activeIdeaIndex];
  if (!uid || !idea?.id) return;
  const notes = getIdeaNotes();
  const key = ideaKey(activeIdeaIndex);
  const social = notes[key] || { likes: 0, likedBy: [], comments: [] };
  const liked = social.likedBy.includes(uid);
  try {
    if (supabaseReady) await setIdeaLikeRemote(idea.id, uid, liked);
  } catch (err) {
    console.error(err);
    return;
  }
  if (liked) {
    social.likedBy = social.likedBy.filter((id) => id !== uid);
    social.likes = Math.max(0, (social.likes || 1) - 1);
  } else {
    social.likedBy = [...social.likedBy, uid];
    social.likes = (social.likes || 0) + 1;
  }
  notes[key] = social;
  saveIdeaNotes(notes);
  renderIdeaSocial();
}

async function postIdeaComment(text) {
  if (activeIdeaIndex === null) return false;
  if (!canDownload()) {
    requireDownloadAuth('idea', { index: activeIdeaIndex });
    return false;
  }
  const member = getMemberSession();
  const name = member?.name || (isAdmin() ? 'Athar' : 'Guest');
  const idea = ideas[activeIdeaIndex];
  const uid = memberId();
  const notes = getIdeaNotes();
  const key = ideaKey(activeIdeaIndex);
  const social = notes[key] || { likes: 0, likedBy: [], comments: [] };
  social.comments = social.comments || [];
  try {
    if (supabaseReady && idea?.id) {
      await addIdeaComment(idea.id, uid, name, text);
    }
  } catch (err) {
    console.error(err);
    return false;
  }
  social.comments.push({ name, text, at: Date.now() });
  notes[key] = social;
  saveIdeaNotes(notes);
  renderIdeaSocial();
  return true;
}

function renderSitesSkeleton() {
  ['#siteGrid', '#homeSiteGrid'].forEach((selector) => {
    const grid = $(selector);
    if (!grid) return;
    grid.innerHTML = Array.from({ length: selector === '#siteGrid' ? 8 : 3 }, () => `<article class="site-skeleton" aria-hidden="true"><div></div><span></span><i></i></article>`).join('');
    grid.setAttribute('aria-busy', 'true');
  });
}

function renderModelsSkeleton() {
  ['#modelsGrid', '#homeModelsGrid'].forEach((selector) => {
    const grid = $(selector);
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 3 }, () => `<article class="model-skeleton" aria-hidden="true"><div></div><span></span><i></i></article>`).join('');
    grid.setAttribute('aria-busy', 'true');
  });
}

function renderFilters() {
  const filters = $('#filters');
  if (!filters) return;
  filters.innerHTML = [
    `<button class="${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All websites <b id="siteCount">${String(sites.length).padStart(2, '0')}</b></button>`,
    ...categories.map(
      (cat) =>
        `<button class="${activeFilter === cat.id ? 'active' : ''}" data-filter="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</button>`
    ),
  ].join('');
}

function renderCategorySelect(selected) {
  const select = $('#categorySelect');
  if (!select) return;
  const value = selected || select.value || categories[0]?.id || 'studio';
  const optionLabels = {
    studio: 'Studio',
    portfolio: 'Portfolio',
    culture: 'Culture',
    shop: 'Shop',
  };
  select.innerHTML = categories
    .map((cat) => {
      const optionLabel = optionLabels[cat.id] || cat.label;
      return `<option value="${escapeHtml(cat.id)}" ${cat.id === value ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>`;
    })
    .join('');
}

function renderCategoryList() {
  const list = $('#categoryList');
  const count = $('#categoryCount');
  if (count) count.textContent = categories.length;
  if (!list) return;
  list.innerHTML =
    categories
      .map((cat) => {
        const used = sites.filter((s) => s.category === cat.id).length;
        const isDefault = defaultCategories.some((d) => d.id === cat.id);
        return `<div class="manage-item category-item"><div><h3>${escapeHtml(cat.label)}</h3><p>${escapeHtml(cat.id)} · ${used} site${used === 1 ? '' : 's'}${isDefault ? ' · default' : ''}</p></div>${
          isDefault
            ? '<span class="category-lock">Built-in</span>'
            : `<button type="button" class="delete" data-remove-category="${escapeHtml(cat.id)}">Remove</button>`
        }</div>`;
      })
      .join('') || '<p>No categories yet.</p>';
}

function renderDash() {
  $('#manageCount').textContent = sites.length;
  $('#messageCount').textContent = messages.length;
  const modelCount = $('#modelCount');
  if (modelCount) modelCount.textContent = modelMeta.length;
  const ideaCount = $('#ideaCount');
  if (ideaCount) ideaCount.textContent = ideas.length;
  const userCount = $('#userCount');
  if (userCount) userCount.textContent = getUsers().length;
  renderCategoryList();
  renderModelManageList();
  renderIdeaManageList();
  renderUserManageList();
  $('#manageList').innerHTML =
    sites
      .map(
        (s, i) => `<div class="manage-item"><div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(categoryLabel(s.category))} · ${escapeHtml(s.url)}</p></div><div class="manage-actions"><button type="button" class="edit" data-edit="${i}">Edit</button><button type="button" class="delete" data-remove="${i}">Remove</button></div></div>`
      )
      .join('') || '<p>No sites yet.</p>';
  $('#messageList').innerHTML =
    messages
      .map(
        (m) => `<article class="message-item"><p class="message-meta">${escapeHtml(m.name)} · ${escapeHtml(m.email)}</p><h3>${escapeHtml(m.name)}</h3><p>${escapeHtml(m.message)}</p></article>`
      )
      .join('') || '<p>No messages yet.</p>';
}

function renderIdeaManageList() {
  const list = $('#ideaManageList');
  if (!list) return;
  list.innerHTML =
    ideas
      .map(
        (idea, i) =>
          `<div class="manage-item"><div class="manage-idea-thumb"><img src="${escapeHtml(idea.image)}" alt=""></div><div><h3>${escapeHtml(idea.title)}</h3><p>${escapeHtml(idea.type)} · ${idea.access === 'paid' ? `Paid $${idea.price || 0}` : 'Free'}</p></div><button type="button" class="delete" data-remove-idea="${i}">Remove</button></div>`
      )
      .join('') || '<p>No ideas on the pinboard yet.</p>';
}

function renderUserManageList() {
  const list = $('#userManageList');
  if (!list) return;
  const users = getUsers();
  list.innerHTML =
    users
      .map(
        (user, i) =>
          `<div class="manage-item"><div><h3>${escapeHtml(user.name || 'Member')}</h3><p>${escapeHtml(user.email)} · joined ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p></div><button type="button" class="delete" data-remove-user="${i}">Remove</button></div>`
      )
      .join('') || '<p>No members yet. Signups will appear here.</p>';
}

function syncIdeaUploadUi() {
  const clearBtn = $('#clearIdeaUpload');
  const status = $('#ideaUploadStatus');
  if (clearBtn) clearBtn.hidden = !draftIdeaImage;
  if (status) status.textContent = draftIdeaImage ? 'Idea image ready.' : '';
}

function clearIdeaDraft() {
  draftIdeaImage = '';
  const input = $('#ideaUpload');
  if (input) input.value = '';
  syncIdeaUploadUi();
}

function renderModelManageList() {
  const list = $('#modelManageList');
  if (!list) return;
  list.innerHTML =
    modelMeta
      .map(
        (m, i) =>
          `<div class="manage-item"><div><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.filename || '3D model')}${m.size ? ` · ${formatFileSize(m.size)}` : ''}${m.note ? ` · ${escapeHtml(m.note)}` : ''}</p></div><button type="button" class="delete" data-remove-model="${escapeHtml(m.id)}">Remove</button></div>`
      )
      .join('') || '<p>No 3D models yet.</p>';
}

async function renderModels() {
  const grid = $('#modelsGrid');
  if (!grid) return;
  if (!modelMeta.length) {
    grid.innerHTML = '<p class="models-empty">No 3D models on the shelf yet. Upload one from the dashboard.</p>';
    grid.setAttribute('aria-busy', 'false');
    return;
  }

  grid.setAttribute('aria-busy', 'false');

  grid.innerHTML = modelMeta
    .map(
      (m, i) => `<article class="model-card" data-model-id="${escapeHtml(m.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(m.title)}">
        <div class="model-viewer-wrap">
          <div class="model-fallback">Loading model…</div>
          <model-viewer id="mv-${escapeHtml(m.id)}" auto-rotate shadow-intensity="0.5" exposure="1" interaction-prompt="none" style="display:none"></model-viewer>
          <span class="model-open-hint">View model ↗</span>
        </div>
        <div class="model-card-info">
          <div>
            <h3>${escapeHtml(m.title)}</h3>
            <p>${escapeHtml(m.note || 'A piece kept in the round.')}</p>
          </div>
          <span>${String(i + 1).padStart(2, '0')}</span>
        </div>
      </article>`
    )
    .join('');

  for (const meta of modelMeta) {
    try {
      const url = await resolveModelUrl(meta);
      if (!url) {
        const card = grid.querySelector(`[data-model-id="${meta.id}"] .model-fallback`);
        if (card) card.textContent = 'Model file missing.';
        continue;
      }
      const viewer = $(`#mv-${meta.id}`);
      const fallback = viewer?.previousElementSibling;
      if (viewer) {
        viewer.src = url;
        viewer.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      }
    } catch {
      const card = grid.querySelector(`[data-model-id="${meta.id}"] .model-fallback`);
      if (card) card.textContent = 'Could not load this model.';
    }
  }
}

function renderHomeModels() {
  const grid = $('#homeModelsGrid');
  if (!grid) return;
  if (!modelMeta.length) {
    grid.innerHTML = '<p class="home-model-empty">The spatial library is waiting for its first study.</p>';
    grid.setAttribute('aria-busy', 'false');
    return;
  }
  grid.innerHTML = modelMeta.slice(0, 3).map((m, i) => `<article class="home-model-card" data-model-id="${escapeHtml(m.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(m.title)}">
    <div class="home-model-visual"><span>${String(i + 1).padStart(2, '0')}</span><div class="home-model-fallback">Loading model…</div><model-viewer id="home-mv-${escapeHtml(m.id)}" auto-rotate interaction-prompt="none" shadow-intensity="0.7" exposure="1" style="display:none"></model-viewer></div>
    <div><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.note || 'A piece kept in the round.')}</p></div><b>↗</b>
  </article>`).join('');
  grid.setAttribute('aria-busy', 'false');
  hydrateHomeModels();
}

async function hydrateHomeModels() {
  const grid = $('#homeModelsGrid');
  if (!grid) return;
  for (const meta of modelMeta.slice(0, 3)) {
    const viewer = $(`#home-mv-${meta.id}`);
    const fallback = viewer?.previousElementSibling;
    if (!viewer) continue;
    try {
      const url = await resolveModelUrl(meta);
      if (!url) throw new Error('missing');
      viewer.src = url;
      viewer.style.display = 'block';
      if (fallback) fallback.style.display = 'none';
    } catch {
      if (fallback) fallback.textContent = 'Model unavailable.';
    }
  }
}

let activeModelId = null;

function syncModelDownloadUi() {
  const downloadBtn = $('#modelDownloadBtn');
  const hint = $('#modelDownloadHint');
  if (downloadBtn) downloadBtn.hidden = !activeModelId;
  if (hint) {
    hint.hidden = !activeModelId || canDownload();
    hint.innerHTML = canDownload()
      ? ''
      : 'Log in required — <a href="#login">Log in</a> or <a href="#signup">Sign up</a> to download.';
  }
}

async function openModelDetail(id) {
  const meta = modelMeta.find((m) => m.id === id);
  if (!meta) return;
  const index = modelMeta.findIndex((m) => m.id === id);
  activeModelId = id;
  $('#modelDetailTitle').textContent = meta.title;
  $('#modelDetailNote').textContent = meta.note || 'A piece kept in the round.';
  $('#modelDetailNote').hidden = false;
  $('#modelDetailIndex').textContent = String(index + 1).padStart(2, '0');
  const ext = (meta.filename || '').split('.').pop()?.toUpperCase() || 'GLB';
  $('#modelDetailFile').textContent = `.${ext.toLowerCase()}`;
  $('#modelDetailCrumb').textContent = `ATHAR'S SHELF / 3D · ${meta.title.toUpperCase()}`;
  renderRelatedModels(id);
  syncModelDownloadUi();

  const viewer = $('#modelDetailViewer');
  const fallback = $('#modelDetailFallback');
  fallback.style.display = 'grid';
  fallback.textContent = 'Loading model…';
  viewer.style.display = 'none';

  try {
    const url = await resolveModelUrl(meta);
    if (!url) throw new Error('missing');
    viewer.src = url;
    viewer.style.display = 'block';
    fallback.style.display = 'none';
  } catch {
    fallback.textContent = 'Could not open this model.';
  }

  $('#modelDetail').classList.add('show');
  $('#modelDetail').setAttribute('aria-hidden', 'false');
  $('#modelDetail').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function renderRelatedModels(activeId) {
  const grid = $('#relatedModelsGrid');
  if (!grid) return;
  const related = modelMeta.filter((m) => m.id !== activeId).slice(0, 3);
  if (!related.length) {
    grid.innerHTML = '<p class="model-related-empty">Add more models to build out the spatial library.</p>';
    return;
  }
  grid.innerHTML = related.map((m, i) => `<article class="related-model-card" data-model-id="${escapeHtml(m.id)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(m.title)}">
    <div><span>${String(i + 1).padStart(2, '0')}</span><div class="related-model-fallback">Loading model…</div><model-viewer id="related-mv-${escapeHtml(m.id)}" auto-rotate interaction-prompt="none" shadow-intensity="0.6" exposure="1" style="display:none"></model-viewer></div>
    <h4>${escapeHtml(m.title)}</h4><p>${escapeHtml(m.note || 'A piece kept in the round.')}</p><b>↗</b>
  </article>`).join('');
  hydrateRelatedModels(related);
}

async function hydrateRelatedModels(models) {
  for (const meta of models) {
    const viewer = $(`#related-mv-${meta.id}`);
    const fallback = viewer?.previousElementSibling;
    if (!viewer) continue;
    try {
      const url = await resolveModelUrl(meta);
      if (!url) throw new Error('missing');
      viewer.src = url;
      viewer.style.display = 'block';
      if (fallback) fallback.style.display = 'none';
    } catch {
      if (fallback) fallback.textContent = 'Model unavailable.';
    }
  }
}

function closeModelDetail() {
  activeModelId = null;
  $('#modelDetail').classList.remove('show');
  $('#modelDetail').setAttribute('aria-hidden', 'true');
  if (!$('#siteDetail')?.classList.contains('show')) document.body.style.overflow = '';
  syncModelDownloadUi();
}

async function downloadActiveModel(skipAuthCheck = false) {
  if (!activeModelId) return;
  if (!skipAuthCheck && !canDownload()) {
    requireDownloadAuth('model', { id: activeModelId });
    return;
  }
  const meta = modelMeta.find((m) => m.id === activeModelId);
  if (!meta) return;
  try {
    let blob = null;
    let filename = meta.filename || `${meta.title.replace(/\s+/g, '-').toLowerCase()}.glb`;
    if (meta.src) {
      const response = await fetch(meta.src);
      blob = await response.blob();
    } else {
      const record = await getModelBlob(activeModelId);
      if (!record?.blob) return;
      blob = record.blob;
      filename = record.filename || filename;
    }
    const url = createObjectUrl(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    if (meta.src) window.open(meta.src, '_blank', 'noopener');
  }
}

function closeDetail() {
  $('#siteDetail').classList.remove('show');
  $('#siteDetail').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openDetail(index) {
  const s = sites[index];
  if (!s) return;
  const cover = s.image || fallbackImage;
  const gallery = parseGallery(s.gallery).filter(Boolean);
  const thumbs = [cover, ...gallery.filter((src) => src !== cover)].filter(
    (src, i, all) => src && all.indexOf(src) === i
  );
  const look = lookOf(s);

  $('#detailTitle').textContent = s.title;
  $('#detailCategory').textContent = categoryLabel(s.category).toUpperCase();
  $('#detailCrumb').textContent = `ATHAR'S SHELF / ${categoryLabel(s.category).toUpperCase()}`;
  $('#detailBlurb').textContent = s.blurb || '';
  $('#detailBlurb').hidden = !s.blurb;
  const heroImg = $('#detailImage');
  heroImg.classList.remove('is-swapping');
  heroImg.src = cover;
  heroImg.alt = `Preview of ${s.title}`;
  heroImg.style.objectPosition = look.imagePosition;
  $('#detailDescription').textContent = s.description;
  $('#detailIndex').textContent = String(index + 1).padStart(2, '0');
  $('#detailArchiveIndex').textContent = `ARCHIVE / ${String(index + 1).padStart(2, '0')}`;
  $('#detailFormat').textContent = `${categoryLabel(s.category)} website`;
  $('#detailEntry').textContent = `${String(index + 1).padStart(2, '0')} / ${String(sites.length).padStart(2, '0')}`;
  $('#detailVisit').href = s.url;
  $('#detailUrl').href = s.url;
  $('#detailUrl').textContent = s.url.replace(/^https?:\/\//, '');
  $('#detailTags').innerHTML = [categoryLabel(s.category), 'website', 'selected']
    .map((t) => `<span>${escapeHtml(t)}</span>`)
    .join('');

  const exploreBlock = $('#exploreNoteBlock');
  if (s.exploreNote) {
    $('#detailExploreNote').textContent = s.exploreNote;
    exploreBlock.hidden = false;
  } else {
    $('#detailExploreNote').textContent = '';
    exploreBlock.hidden = true;
  }

  const panel = $('#detailGallery');
  const thumbsWrap = $('#detailThumbs');
  if (thumbs.length > 1) {
    thumbsWrap.innerHTML = thumbs
      .map(
        (image, i) =>
          `<button type="button" class="gallery-thumb ${i === 0 ? 'active' : ''}" aria-label="View image ${i + 1}"><img src="${image}" alt="${escapeHtml(s.title)} highlight ${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span></button>`
      )
      .join('');
    panel.hidden = false;
  } else {
    thumbsWrap.innerHTML = '';
    panel.hidden = true;
  }

  renderDetailExtras(index);

  $('#siteDetail').classList.add('show');
  $('#siteDetail').setAttribute('aria-hidden', 'false');
  $('#siteDetail').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function renderDetailExtras(index) {
  const site = sites[index];
  const key = `athar-results-${site.url}`;
  const votes = get(key, []);
  const metrics = [
    ['Visual craft', 'visual'],
    ['Flow', 'flow'],
    ['Originality', 'originality'],
    ['Story', 'story'],
  ];
  const average = (values, field) =>
    values.length
      ? (values.reduce((sum, v) => sum + v[field], 0) / values.length).toFixed(1)
      : '—';
  const overall = votes.length
    ? (
        votes.reduce(
          (sum, v) => sum + metrics.reduce((total, [, field]) => total + v[field], 0) / metrics.length,
          0
        ) / votes.length
      ).toFixed(1)
    : '—';

  let panel = $('#shelfSignal');
  if (!panel) {
    document
      .querySelector('.detail-body')
      .insertAdjacentHTML('beforeend', '<section class="shelf-signal" id="shelfSignal"></section>');
    panel = $('#shelfSignal');
  }

  panel.dataset.index = index;
  panel.innerHTML = `<div class="result-head"><div><p class="eyebrow">THE SHELF SIGNAL</p><h3>How this one<br>lands.</h3><p>Four quiet readings from people who stopped to look.</p></div><div class="overall-score"><b>${overall}</b><span>OVERALL<br>SIGNAL</span></div></div>
    <div class="metric-grid">${metrics
      .map(([label, field]) => `<div><span>${label}</span><b>${average(votes, field)}</b></div>`)
      .join('')}</div>
    <div class="vote-builder"><div><p class="eyebrow">LEAVE A READING</p><p class="vote-prompt">What does this website leave you with?</p></div>
    <div class="vote-fields">${metrics
      .map(
        ([label, field]) =>
          `<div class="vote-field"><span>${label}</span><div>${[1, 2, 3, 4, 5]
            .map(
              (n) =>
                `<button type="button" class="field-choice" data-field="${field}" data-value="${n}" aria-label="${label}: ${n} out of 5">${n}</button>`
            )
            .join('')}</div></div>`
      )
      .join('')}<button type="button" class="results-submit">Save my reading <span>↗</span></button><p class="results-note"></p></div></div>
    <div class="results-board"><div class="board-head"><span>RECENT READINGS</span><span>VISUAL</span><span>FLOW</span><span>ORIGINAL</span><span>STORY</span><span>OVERALL</span></div>${
      votes.length
        ? votes
            .slice(-5)
            .reverse()
            .map((vote, i) => {
              const total = ((vote.visual + vote.flow + vote.originality + vote.story) / 4).toFixed(1);
              return `<div class="board-row"><span><i>${String(votes.length - i).padStart(2, '0')}</i> Shelf visitor</span><span>${vote.visual}</span><span>${vote.flow}</span><span>${vote.originality}</span><span>${vote.story}</span><strong>${total}</strong></div>`;
            })
            .join('')
        : '<p class="empty-results">Be the first person to leave a reading for this one.</p>'
    }</div>`;
}

function openDashboard() {
  if (!isLoggedIn()) return;
  $('#dashboard').classList.add('show');
  renderDash();
}

function closeDashboard() {
  $('#dashboard').classList.remove('show');
}

function resetEditor() {
  editingSiteIndex = null;
  const form = $('#addSiteForm');
  form.reset();
  Object.entries(lookDefaults).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  clearDraftMedia();
  $('#add h2').textContent = 'Add a website.';
  form.querySelector('[type="submit"]').innerHTML = 'Publish to shelf <span>↗</span>';
  $('#addStatus').textContent = '';
  refreshPreview();
}

function refreshPreview() {
  const fields = $('#addSiteForm').elements;
  const look = {
    background: fields.cardBg?.value || lookDefaults.cardBg,
    title: fields.titleColor?.value || lookDefaults.titleColor,
    body: fields.bodyColor?.value || lookDefaults.bodyColor,
    accent: fields.accentColor?.value || lookDefaults.accentColor,
    position: fields.imagePosition?.value || lookDefaults.imagePosition,
    align: fields.textAlign?.value || lookDefaults.textAlign,
  };
  const card = $('.preview-card');
  $('#previewTitle').textContent = fields.title.value || 'Your website';
  $('#previewBlurb').textContent = fields.blurb?.value || 'Short line under the title';
  $('#previewDescription').textContent = '';
  $('#previewDescription').hidden = true;
  $('#previewCategory').textContent = categoryLabel(fields.category.value || 'studio').toUpperCase();
  $('#previewImage').src = draftCover || fields.image.value || fallbackImage;
  card.style.background = look.background;
  card.style.textAlign = look.align;
  $('#previewTitle').style.color = look.title;
  $('#previewDescription').style.color = look.body;
  $('#previewCategory').style.color = look.title;
  $('#previewCategory').style.borderColor = look.accent;
  $('#previewImage').style.objectPosition = look.position;
}

function showLoginError(message) {
  const note = $('#memberLoginNote');
  if (!note) return;
  note.textContent = message;
  note.classList.add('error');
}

function clearLoginError() {
  const note = $('#memberLoginNote');
  if (!note) return;
  note.textContent = 'Members and owner use the same door.';
  note.classList.remove('error');
}

/* ——— Events ——— */

$('#filters').onclick = (e) => {
  const button = e.target.closest('button');
  if (!button || !button.dataset.filter) return;
  document.querySelectorAll('#filters button').forEach((b) => b.classList.remove('active'));
  button.classList.add('active');
  activeFilter = button.dataset.filter;
  renderSites();
};

$('#search').oninput = (e) => {
  query = e.target.value;
  renderSites();
};

$('#sortBtn').onclick = () => {
  reverse = !reverse;
  $('#sortBtn').innerHTML = `${reverse ? 'Oldest' : 'Newest'} <span>⌄</span>`;
  renderSites();
};

window.addEventListener('scroll', () => {
  $('.reading-line').style.width = `${(scrollY / (document.body.scrollHeight - innerHeight)) * 100}%`;
  document.documentElement.style.setProperty('--parallax', `${Math.min(scrollY * .08, 56)}px`);
  document.querySelectorAll('.home-site-grid .site-card[data-depth]').forEach((card) => {
    const offset = (window.innerHeight - card.getBoundingClientRect().top) * Number(card.dataset.depth) * .018;
    card.style.setProperty('--card-parallax', `${Math.max(-20, Math.min(offset, 42))}px`);
  });
});

$('#jumpContact').onclick = () => {
  if (window.location.hash === '#contact') {
    $('#contact')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  window.location.hash = 'contact';
};

function closeOverlaysForRoute() {
  if ($('#ideaLightbox')?.classList.contains('show')) closeIdea();
  if ($('#modelDetail')?.classList.contains('show')) closeModelDetail();
  if ($('#siteDetail')?.classList.contains('show')) closeDetail();
}

function syncHeaderHeight() {
  const header = document.querySelector('header');
  if (!header) return;
  document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
}

function setActivePage() {
  const requested = window.location.hash.replace('#', '');
  if ((requested === 'login' || requested === 'signup') && (isAdmin() || isMember()) && !pendingDownload) {
    window.location.hash = 'home';
    return;
  }

  closeOverlaysForRoute();

  const page = ['discover', 'ideas', 'models', 'login', 'signup'].includes(requested) ? requested : 'home';
  document.body.dataset.page = page;
  document.querySelectorAll('.page-view').forEach((view) => {
    const active = view.dataset.page === page;
    view.classList.toggle('is-active', active);
    view.hidden = !active;
    view.setAttribute('aria-hidden', active ? 'false' : 'true');
  });
  document.querySelectorAll('[data-route]').forEach((link) => link.classList.toggle('is-active', link.dataset.route === page));

  // Force layout so the footer never keeps short-route height from a prior page.
  void document.body.offsetHeight;
  syncHeaderHeight();

  if (requested === 'creator' || requested === 'contact') {
    window.setTimeout(() => {
      document.getElementById(requested)?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#search').focus();
  } else if (e.key === 'Escape') {
    if ($('#ideaSidePanel')?.classList.contains('is-open')) closeIdeaPanel();
    else if ($('#ideaLightbox')?.classList.contains('show')) closeIdea();
    else if ($('#modelDetail')?.classList.contains('show')) closeModelDetail();
    else closeDetail();
    closeDashboard();
  }
});

$('#modelsGrid').onclick = (e) => {
  const card = e.target.closest('.model-card');
  if (card?.dataset.modelId) openModelDetail(card.dataset.modelId);
};

$('#homeModelsGrid').onclick = (e) => {
  const card = e.target.closest('.home-model-card');
  if (card?.dataset.modelId) openModelDetail(card.dataset.modelId);
};

$('#homeModelsGrid').onkeydown = (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.home-model-card');
  if (!card?.dataset.modelId) return;
  e.preventDefault();
  openModelDetail(card.dataset.modelId);
};

$('#modelsGrid').onkeydown = (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.model-card');
  if (!card?.dataset.modelId) return;
  e.preventDefault();
  openModelDetail(card.dataset.modelId);
};

$('#modelDetailClose').onclick = closeModelDetail;
$('#modelDownloadBtn').onclick = () => downloadActiveModel();
$('#modelDownloadHint')?.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="#login"], a[href="#signup"]');
  if (!link || !activeModelId) return;
  pendingDownload = { kind: 'model', id: activeModelId };
  closeModelDetail();
});

$('#relatedModelsGrid').onclick = (e) => {
  const card = e.target.closest('.related-model-card');
  if (card?.dataset.modelId) openModelDetail(card.dataset.modelId);
};

$('#relatedModelsGrid').onkeydown = (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.related-model-card');
  if (!card?.dataset.modelId) return;
  e.preventDefault();
  openModelDetail(card.dataset.modelId);
};

$('#siteGrid').onclick = (e) => {
  const card = e.target.closest('.site-card');
  if (card) openDetail(Number(card.dataset.siteIndex));
};

$('#ideasWall').onclick = (e) => {
  const pin = e.target.closest('.idea-pin');
  if (pin) openIdea(Number(pin.dataset.ideaIndex));
};
$('#ideasWall').onkeydown = (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const pin = e.target.closest('.idea-pin');
  if (!pin) return;
  e.preventDefault();
  openIdea(Number(pin.dataset.ideaIndex));
};
$('#ideaLightboxClose').onclick = closeIdea;
$('#ideaLightbox').onclick = (e) => {
  if (e.target === $('#ideaLightbox') || e.target === $('.idea-lightbox-stage')) closeIdea();
};
$('#ideaPanelOpen')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openIdeaPanel();
});
$('#ideaPanelClose')?.addEventListener('click', closeIdeaPanel);
$('#ideaDownloadBtn').onclick = () => downloadActiveIdea();
$('#ideaLikeBtn')?.addEventListener('click', toggleIdeaLike);
$('#ideaCommentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = String(new FormData(e.target).get('comment') || '').trim();
  if (!text) return;
  if (await postIdeaComment(text)) e.target.reset();
});
$('#ideaDownloadHint')?.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="#login"], a[href="#signup"]');
  if (!link || activeIdeaIndex === null) return;
  pendingDownload = { kind: 'idea', index: activeIdeaIndex };
  closeIdea();
});
$('#ideaSidePanel')?.addEventListener('click', (e) => e.stopPropagation());
$('#ideaPanelOpen')?.addEventListener('keydown', (e) => e.stopPropagation());


$('#homeSiteGrid').onclick = (e) => {
  const card = e.target.closest('.site-card');
  if (card) openDetail(Number(card.dataset.siteIndex));
};

$('#homeSiteGrid').onkeydown = (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.site-card');
  if (!card) return;
  e.preventDefault();
  openDetail(Number(card.dataset.siteIndex));
};

$('#detailClose').onclick = closeDetail;

$('#siteDetail').onclick = (e) => {
  const thumb = e.target.closest('.gallery-thumb');
  if (thumb) {
    const thumbImage = thumb.querySelector('img');
    const hero = $('#detailImage');
    if (thumbImage && hero) {
      hero.classList.add('is-swapping');
      window.setTimeout(() => {
        hero.src = thumbImage.src;
        hero.alt = thumbImage.alt || 'Preview';
        hero.classList.remove('is-swapping');
      }, 180);
    }
    document.querySelectorAll('.gallery-thumb').forEach((x) => x.classList.toggle('active', x === thumb));
    return;
  }

  const choice = e.target.closest('.field-choice');
  const submit = e.target.closest('.results-submit');
  const panel = $('#shelfSignal');
  if (!panel) return;

  if (choice) {
    panel.querySelectorAll(`.field-choice[data-field="${choice.dataset.field}"]`).forEach((button) =>
      button.classList.toggle('active', button === choice)
    );
    panel.dataset[choice.dataset.field] = choice.dataset.value;
  }

  if (submit) {
    const fields = ['visual', 'flow', 'originality', 'story'];
    const vote = Object.fromEntries(fields.map((field) => [field, Number(panel.dataset[field])]));
    const note = panel.querySelector('.results-note');
    if (fields.some((field) => !vote[field])) {
      note.textContent = 'Choose a score for each of the four fields.';
      return;
    }
    const site = sites[Number(panel.dataset.index)];
    const key = `athar-results-${site.url}`;
    const votes = get(key, []);
    votes.push(vote);
    set(key, votes);
    renderDetailExtras(Number(panel.dataset.index));
  }
};

const dashboard = $('#dashboard');

async function maybeSeedAsAdmin() {
  if (!supabaseReady || !isAdmin()) return;
  try {
    const data = await loadShelf();
    if (!data.sites.length || !data.ideas.length || !data.models.length) {
      await seedDefaults({
        sites: defaults,
        ideas: defaultIdeas,
        models: defaultModels,
        categories: defaultCategories,
      });
      await applyShelfData(await loadShelf());
      renderFilters();
      renderCategorySelect();
      renderSites();
      renderIdeas();
      await renderModels();
      renderHomeModels();
      renderDash();
    }
  } catch (err) {
    console.error(err);
  }
}

async function loginAsAdmin() {
  syncAccountUi();
  await maybeSeedAsAdmin();
  window.location.hash = 'home';
  openDashboard();
}

$('#navAdmin')?.addEventListener('click', () => {
  if (!isAdmin()) {
    window.location.hash = 'login';
    return;
  }
  openDashboard();
});

$('#memberLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const note = $('#memberLoginNote');
  if (!isSupabaseConfigured) {
    if (note) {
      note.textContent = 'Add Supabase keys to .env first (see .env.example).';
      note.classList.add('error');
    }
    return;
  }
  const data = Object.fromEntries(new FormData(e.target));
  const email = data.email.trim().toLowerCase();
  const password = data.password;
  if (note) {
    note.textContent = 'Signing in…';
    note.classList.remove('error');
  }
  try {
    await signIn(email, password);
    currentProfile = await fetchProfile();
    e.target.reset();
    syncAccountUi();
    if (isAdmin()) {
      if (note) note.textContent = 'Welcome back, Athar.';
      loginAsAdmin();
      return;
    }
    if (note) note.textContent = 'Logged in.';
    const job = pendingDownload;
    await resumePendingDownload();
    if (!job) window.location.hash = 'home';
  } catch (err) {
    const msg = err.message || 'Wrong email or password.';
    if (note) {
      if (/email not confirmed/i.test(msg)) {
        note.innerHTML =
          'Email not confirmed yet. In Supabase → <b>Authentication → Users</b>, open your user and click <b>Confirm email</b> (or disable Confirm email under Providers).';
      } else if (/invalid login credentials/i.test(msg) && email === ADMIN.email.toLowerCase()) {
        note.innerHTML =
          'No admin account yet. <a href="#signup">Sign up</a> with this email first (same password), after running <code>supabase/bootstrap.sql</code>.';
      } else if (/invalid login credentials/i.test(msg)) {
        note.innerHTML = 'Wrong email or password — or create an account on <a href="#signup">Sign up</a>.';
      } else {
        note.textContent = msg;
      }
      note.classList.add('error');
    }
  }
});

$('#memberSignupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const note = $('#memberSignupNote');
  if (!isSupabaseConfigured) {
    note.textContent = 'Add Supabase keys to .env first (see .env.example).';
    note.classList.add('error');
    return;
  }
  const data = Object.fromEntries(new FormData(e.target));
  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();
  const password = data.password;
  if (password.length < 6) {
    note.textContent = 'Use at least 6 characters for your password.';
    note.classList.add('error');
    return;
  }
  note.textContent = 'Creating account…';
  note.classList.remove('error');
  try {
    const result = await signUp(name, email, password);
    if (!result.session) {
      note.textContent = 'Account created. Check your email to confirm, then log in.';
      e.target.reset();
      return;
    }
    currentProfile = await fetchProfile();
    e.target.reset();
    syncAccountUi();
    note.textContent = 'Account created.';
    const job = pendingDownload;
    await resumePendingDownload();
    if (!job) window.location.hash = 'home';
  } catch (err) {
    note.textContent = err.message || 'Could not create that account.';
    note.classList.add('error');
  }
});

async function handleSignOut() {
  pendingDownload = null;
  try {
    await signOut();
  } catch {
    /* ignore */
  }
  currentProfile = null;
  closeDashboard();
  resetEditor();
  syncAccountUi();
  window.location.hash = 'home';
}

$('#memberSignOut')?.addEventListener('click', () => {
  handleSignOut();
});

$('#dashClose').onclick = closeDashboard;

$('#signout').onclick = () => {
  handleSignOut();
};

document.querySelectorAll('.dash-link').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('.dash-link, .panel').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    $('#' + b.dataset.panel).classList.add('active');
    if (b.dataset.panel === 'add' && editingSiteIndex === null) resetEditor();
  };
});

$('#manageList').onclick = (e) => {
  const edit = e.target.closest('[data-edit]');
  const remove = e.target.closest('[data-remove]');
  if (edit) {
    const i = Number(edit.dataset.edit);
    const s = sites[i];
    const form = $('#addSiteForm');
    editingSiteIndex = i;
    const look = lookOf(s);
    const gallery = parseGallery(s.gallery);
    draftCover = s.image && s.image.startsWith('data:') ? s.image : '';
    draftGallery = gallery.filter((src) => src.startsWith('data:'));
    const urlGallery = gallery.filter((src) => !src.startsWith('data:'));
    renderCategorySelect(s.category);
    Object.entries({
      title: s.title,
      blurb: s.blurb || '',
      url: s.url,
      category: s.category,
      description: s.description,
      exploreNote: s.exploreNote || '',
      image: draftCover ? '' : s.image || '',
      gallery: urlGallery.join('\n'),
      ...look,
    }).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
    syncCoverUploadUi();
    renderGalleryUploads();
    document.querySelectorAll('.dash-link, .panel').forEach((x) => x.classList.remove('active'));
    document.querySelector('.dash-link[data-panel="add"]').classList.add('active');
    $('#add').classList.add('active');
    $('#add h2').textContent = 'Edit website.';
    form.querySelector('[type="submit"]').innerHTML = 'Save changes <span>↗</span>';
    refreshPreview();
  }
  if (remove) {
    const index = Number(remove.dataset.remove);
    const site = sites[index];
    if (!site) return;
    (async () => {
      try {
        if (supabaseReady && site.id) await deleteSite(site.id);
        sites.splice(index, 1);
        renderFilters();
        renderSites();
        renderDash();
      } catch (err) {
        alert(err.message || 'Could not remove that site.');
      }
    })();
  }
};

const editorForm = $('#addSiteForm');
editorForm.addEventListener('input', refreshPreview);
editorForm.addEventListener('change', refreshPreview);

$('#coverUpload').onchange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    draftCover = await readFileAsDataUrl(file);
    editorForm.elements.image.value = '';
    syncCoverUploadUi();
    refreshPreview();
  } catch (err) {
    $('#coverUploadStatus').textContent = err.message;
  }
};

$('#clearCover').onclick = () => {
  draftCover = '';
  $('#coverUpload').value = '';
  syncCoverUploadUi();
  refreshPreview();
};

$('#galleryUpload').onchange = async (e) => {
  const files = [...(e.target.files || [])];
  if (!files.length) return;
  try {
    const uploads = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
    draftGallery = [...draftGallery, ...uploads];
    renderGalleryUploads();
  } catch (err) {
    $('#addStatus').textContent = err.message;
  } finally {
    e.target.value = '';
  }
};

$('#clearGallery').onclick = () => {
  draftGallery = [];
  $('#galleryUpload').value = '';
  renderGalleryUploads();
};

$('#galleryUploads').onclick = (e) => {
  const btn = e.target.closest('[data-remove-gallery]');
  if (!btn) return;
  draftGallery.splice(Number(btn.dataset.removeGallery), 1);
  renderGalleryUploads();
};

editorForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!isAdmin()) {
    $('#addStatus').textContent = 'Admin login required.';
    return;
  }
  const data = Object.fromEntries(new FormData(editorForm));
  delete data.coverUpload;
  delete data.galleryUpload;
  const status = $('#addStatus');
  status.textContent = 'Saving…';
  try {
    let image = data.image || '';
    if (draftCover?.startsWith('data:')) {
      const uploaded = await uploadDataUrl('covers', draftCover, 'cover.jpg');
      image = uploaded.url;
    } else if (draftCover) {
      image = draftCover;
    }
    const urlGallery = parseGallery(data.gallery);
    const galleryUploads = [];
    for (const item of draftGallery) {
      if (item.startsWith('data:')) {
        const uploaded = await uploadDataUrl('gallery', item, 'gallery.jpg');
        galleryUploads.push(uploaded.url);
      } else {
        galleryUploads.push(item);
      }
    }
    const entry = {
      ...(editingSiteIndex !== null ? sites[editingSiteIndex] : {}),
      ...data,
      image,
      gallery: [...galleryUploads, ...urlGallery],
    };
    if (supabaseReady) {
      const saved = await upsertSite(entry, editingSiteIndex === null ? 0 : editingSiteIndex);
      if (editingSiteIndex === null) sites.unshift(saved);
      else sites[editingSiteIndex] = saved;
    } else if (editingSiteIndex === null) {
      sites.unshift(entry);
    } else {
      sites[editingSiteIndex] = entry;
    }
    renderFilters();
    renderSites();
    renderDash();
    const wasEdit = editingSiteIndex !== null;
    editingSiteIndex = null;
    $('#add h2').textContent = 'Add a website.';
    editorForm.querySelector('[type="submit"]').innerHTML = 'Publish to shelf <span>↗</span>';
    editorForm.reset();
    Object.entries(lookDefaults).forEach(([key, value]) => {
      if (editorForm.elements[key]) editorForm.elements[key].value = value;
    });
    clearDraftMedia();
    renderCategorySelect();
    refreshPreview();
    status.textContent = wasEdit ? 'Changes saved.' : 'Published to Athar’s Shelf.';
  } catch (err) {
    status.textContent = err.message || 'Could not save that website.';
  }
};

$('#categoryForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = String(new FormData(e.target).get('name') || '').trim();
  const status = $('#categoryStatus');
  if (!name) {
    status.textContent = 'Enter a category name.';
    return;
  }
  const id = slugifyCategory(name);
  if (categories.some((cat) => cat.id === id || cat.label.toLowerCase() === name.toLowerCase())) {
    status.textContent = 'That category already exists.';
    return;
  }
  const category = { id, label: name };
  try {
    if (supabaseReady) await upsertCategory(category);
    categories.push(category);
    e.target.reset();
    status.textContent = `“${name}” added.`;
    renderFilters();
    renderCategorySelect(id);
    renderDash();
  } catch (err) {
    status.textContent = err.message || 'Could not add category.';
  }
};

$('#categoryList').onclick = async (e) => {
  const button = e.target.closest('[data-remove-category]');
  if (!button) return;
  const id = button.dataset.removeCategory;
  if (defaultCategories.some((cat) => cat.id === id)) return;
  const used = sites.filter((s) => s.category === id).length;
  if (used && !confirm(`Remove “${categoryLabel(id)}”? ${used} site${used === 1 ? '' : 's'} will move to Studios.`)) {
    return;
  }
  try {
    if (supabaseReady) await deleteCategory(id);
    categories = categories.filter((cat) => cat.id !== id);
    if (used) {
      sites = sites.map((site) => (site.category === id ? { ...site, category: 'studio' } : site));
      if (supabaseReady) {
        await Promise.all(
          sites
            .filter((site) => site.category === 'studio' && site.id)
            .map((site, i) => upsertSite(site, i))
        );
      }
    }
    if (activeFilter === id) activeFilter = 'all';
    $('#categoryStatus').textContent = 'Category removed.';
    renderFilters();
    renderCategorySelect();
    renderSites();
    renderDash();
  } catch (err) {
    $('#categoryStatus').textContent = err.message || 'Could not remove category.';
  }
};

$('#ideaUpload')?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  const status = $('#ideaUploadStatus');
  if (!file) return;
  try {
    draftIdeaImage = await readFileAsDataUrl(file, 1600, 0.85);
    syncIdeaUploadUi();
  } catch (err) {
    draftIdeaImage = '';
    syncIdeaUploadUi();
    if (status) status.textContent = err.message || 'Could not use that image.';
  }
});

$('#clearIdeaUpload')?.addEventListener('click', () => {
  clearIdeaDraft();
  const form = $('#ideaForm');
  if (form?.elements.image) form.elements.image.value = '';
});

$('#ideaForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isAdmin()) return;
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const status = $('#ideaStatus');
  status.textContent = 'Publishing…';
  try {
    let image = String(data.image || '').trim();
    if (draftIdeaImage?.startsWith('data:')) {
      const uploaded = await uploadDataUrl('ideas', draftIdeaImage, 'idea.jpg');
      image = uploaded.url;
    } else if (draftIdeaImage) {
      image = draftIdeaImage;
    }
    if (!image) {
      status.textContent = 'Upload an image or paste an image URL.';
      return;
    }
    const access = data.access === 'paid' ? 'paid' : 'free';
    const idea = {
      id: `idea-${Date.now()}`,
      title: String(data.title || '').trim(),
      type: String(data.type || '').trim(),
      access,
      price: access === 'paid' ? Number(data.price) || 0 : undefined,
      image,
      createdAt: Date.now(),
    };
    if (supabaseReady) {
      const saved = await upsertIdea(idea, 0);
      ideas.unshift(saved);
    } else {
      ideas.unshift(idea);
    }
    form.reset();
    clearIdeaDraft();
    status.textContent = 'Idea published to the pinboard.';
    renderIdeas();
    renderDash();
  } catch (err) {
    status.textContent = err.message || 'Could not publish that idea.';
  }
});

$('#ideaManageList')?.addEventListener('click', async (e) => {
  const button = e.target.closest('[data-remove-idea]');
  if (!button || !isAdmin()) return;
  const index = Number(button.dataset.removeIdea);
  if (!Number.isInteger(index) || !ideas[index]) return;
  if (!confirm(`Remove “${ideas[index].title}” from the pinboard?`)) return;
  const removed = ideas[index];
  try {
    if (supabaseReady && removed?.id) await deleteIdea(removed.id);
    ideas.splice(index, 1);
    const notes = getIdeaNotes();
    if (removed?.id && notes[removed.id]) {
      delete notes[removed.id];
      saveIdeaNotes(notes);
    }
    renderIdeas();
    renderDash();
  } catch (err) {
    alert(err.message || 'Could not remove that idea.');
  }
});

$('#userManageList')?.addEventListener('click', (e) => {
  const button = e.target.closest('[data-remove-user]');
  if (!button || !isAdmin()) return;
  alert('Remove members from the Supabase Auth dashboard (Authentication → Users).');
});

const MODEL_MAX_BYTES = 150 * 1024 * 1024;

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

$('#modelUpload').onchange = (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    $('#modelFileName').textContent = 'No file chosen.';
    return;
  }
  $('#modelFileName').textContent = `${file.name} · ${formatFileSize(file.size)}`;
};

$('#modelForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const file = form.elements.modelFile?.files?.[0];
  const status = $('#modelStatus');
  if (!isAdmin()) {
    status.textContent = 'Admin login required.';
    return;
  }
  if (!file) {
    status.textContent = 'Choose a .glb or .gltf file.';
    return;
  }
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
    status.textContent = 'Please upload a .glb or .gltf model.';
    return;
  }
  if (file.size > MODEL_MAX_BYTES) {
    status.textContent = `Model is too large (max 150MB). This file is ${formatFileSize(file.size)}.`;
    return;
  }
  if (!supabaseReady) {
    status.textContent = 'Configure Supabase in .env before uploading models.';
    return;
  }

  status.textContent = file.size > 20 * 1024 * 1024 ? 'Uploading large model… this can take a moment.' : 'Uploading…';
  const id = `model-${Date.now()}`;
  try {
    const upload = await uploadModelFile(file);
    const saved = await upsertModel({
      id,
      title: String(data.title || '').trim(),
      note: String(data.note || '').trim(),
      filename: file.name,
      storagePath: upload.path,
      src: upload.url,
      size: file.size,
      sample: false,
    });
    modelMeta.unshift(saved);
    form.reset();
    $('#modelFileName').textContent = 'No file chosen.';
    status.textContent = 'Model published to the shelf.';
    renderDash();
    await renderModels();
    renderHomeModels();
  } catch (err) {
    status.textContent = err.message || 'Could not save that model.';
  }
};

$('#modelManageList').onclick = async (e) => {
  const button = e.target.closest('[data-remove-model]');
  if (!button) return;
  const id = button.dataset.removeModel;
  try {
    await deleteModelBlob(id);
    modelMeta = modelMeta.filter((m) => m.id !== id);
    if (modelObjectUrls.has(id)) {
      URL.revokeObjectURL(modelObjectUrls.get(id));
      modelObjectUrls.delete(id);
    }
    renderDash();
    await renderModels();
    renderHomeModels();
  } catch (err) {
    alert(err.message || 'Could not remove that model.');
  }
};

$('#contactForm').onsubmit = async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target));
  try {
    if (supabaseReady) await insertMessage(payload);
    messages.unshift(payload);
    renderDash();
    e.target.reset();
    $('#formStatus').textContent = 'Message sent — thank you.';
  } catch (err) {
    $('#formStatus').textContent = err.message || 'Could not send message.';
  }
};

function showConfigBanner(message) {
  let banner = document.getElementById('supabaseBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'supabaseBanner';
    banner.style.cssText =
      'position:fixed;left:16px;right:16px;bottom:16px;z-index:200;background:#1f201e;color:#f5f1ea;padding:14px 16px;font:13px/1.4 "DM Sans",sans-serif;border-left:4px solid #ff7556;box-shadow:0 12px 40px rgba(0,0,0,.25)';
    document.body.appendChild(banner);
  }
  banner.innerHTML = message;
}

async function applyShelfData(data) {
  sites = normalizeSites(data.sites?.length ? data.sites : defaults);
  ideas = normalizeIdeas(data.ideas?.length ? data.ideas : defaultIdeas);
  categories = data.categories?.length ? data.categories : loadCategories();
  modelMeta = data.models?.length ? data.models : ensureSampleModels([]);
  messages = data.messages || [];
  if (!data.usersError && data.users) saveUsers(data.users);
  ideaNotesCache = Object.keys(buildIdeaNotes(data.likes, data.comments)).length
    ? buildIdeaNotes(data.likes, data.comments)
    : { ...ideaSeedNotes };
}

async function boot() {
  renderSitesSkeleton();
  renderModelsSkeleton();
  syncCoverUploadUi();
  renderGalleryUploads();
  refreshPreview();
  syncModelDownloadUi();

  if (!isSupabaseConfigured) {
    showConfigBanner(
      'Supabase env vars are missing. Locally: add <code>VITE_SUPABASE_URL</code> + <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>. On Vercel: set those same names (or keep the Supabase integration’s <code>NEXT_PUBLIC_SUPABASE_*</code> vars) and redeploy.'
    );
    sites = normalizeSites(defaults);
    ideas = normalizeIdeas(defaultIdeas);
    modelMeta = ensureSampleModels([]);
    categories = loadCategories();
    ideaNotesCache = { ...ideaSeedNotes };
  } else {
    try {
      currentProfile = await fetchProfile();
      let data = await loadShelf();
      if ((!data.sites.length || !data.ideas.length || !data.models.length) && isAdmin()) {
        await seedDefaults({
          sites: defaults,
          ideas: defaultIdeas,
          models: defaultModels,
          categories: defaultCategories,
        });
        data = await loadShelf();
      }
      supabaseReady = true;
      await applyShelfData(data);
      if (!data.sites.length) sites = normalizeSites(defaults);
      if (!data.ideas.length) ideas = normalizeIdeas(defaultIdeas);
      if (!data.models.length) modelMeta = ensureSampleModels([]);
      const old = document.getElementById('supabaseBanner');
      if (old) old.remove();
    } catch (err) {
      console.error(err);
      const detail = err?.message || String(err);
      showConfigBanner(
        `Connected to Supabase, but loading failed: <code>${detail}</code>. Usually the schema isn’t applied yet — run <code>supabase/schema.sql</code> in the SQL Editor, then refresh.`
      );
      sites = normalizeSites(defaults);
      ideas = normalizeIdeas(defaultIdeas);
      modelMeta = ensureSampleModels([]);
      categories = loadCategories();
      ideaNotesCache = { ...ideaSeedNotes };
    }
  }

  renderFilters();
  renderCategorySelect();
  renderSites();
  await renderModels();
  renderHomeModels();
  renderIdeas();
  renderDash();
  syncAccountUi();
  syncHeaderHeight();
  setActivePage();

  if (supabase) {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      currentProfile = session ? await fetchProfile() : null;
      syncAccountUi();
      if (isAdmin()) await maybeSeedAsAdmin();
      renderDash();
    });
  }
}

window.addEventListener('hashchange', setActivePage);
window.addEventListener('resize', syncHeaderHeight);
boot();