import './styles/styles.css';
import './styles/overrides.css';
import './styles/results.css';
import './styles/values.css';
import './styles/editor.css';
import './styles/appearance.css';
import './styles/extras.css';
import './styles/models.css';
import {
  createObjectUrl,
  deleteModelBlob,
  getModelBlob,
  getModelMeta,
  saveModelBlob,
  setModelMeta,
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

const get = (k, f = []) => JSON.parse(localStorage.getItem(k) || JSON.stringify(f));
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const $ = (s) => document.querySelector(s);

let sites = get('athar-shelf-sites', defaults);
let messages = get('athar-shelf-messages');
let activeFilter = 'all';
let query = '';
let reverse = false;
let editingSiteIndex = null;
let draftCover = '';
let draftGallery = [];
let modelMeta = getModelMeta();
const modelObjectUrls = new Map();

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
  const stored = get('athar-shelf-categories', defaultCategories);
  const map = new Map();
  [...defaultCategories, ...stored].forEach((cat) => {
    if (!cat?.id) return;
    map.set(cat.id, { id: cat.id, label: cat.label || cat.id });
  });
  sites.forEach((site) => {
    if (!site.category || map.has(site.category)) return;
    map.set(site.category, {
      id: site.category,
      label: site.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  });
  return [...map.values()];
}

let categories = loadCategories();

function saveCategories() {
  set('athar-shelf-categories', categories);
}

function categoryLabel(id) {
  return categories.find((c) => c.id === id)?.label || id;
}

sites = sites.map((site, index) => {
  const cover = site.image || fallbackImage;
  let gallery = parseGallery(site.gallery).filter(Boolean);
  gallery = gallery.filter((src, i, all) => src && all.indexOf(src) === i);
  if (!gallery.length || (gallery.length === 1 && gallery[0] === cover)) {
    gallery = [cover, galleryFallbacks[index % galleryFallbacks.length]].filter(
      (src, i, all) => all.indexOf(src) === i
    );
  }
  site.gallery = gallery;
  if (!site.blurb && site.description) site.blurb = site.description;
  return site;
});

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

function isLoggedIn() {
  return localStorage.getItem('athar-shelf-auth') === 'true';
}

function setLoggedIn(on) {
  if (on) localStorage.setItem('athar-shelf-auth', 'true');
  else localStorage.removeItem('athar-shelf-auth');
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
  const countEl = $('#siteCount');
  if (countEl) countEl.textContent = String(sites.length).padStart(2, '0');
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
  renderCategoryList();
  renderModelManageList();
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

function renderModelManageList() {
  const list = $('#modelManageList');
  if (!list) return;
  list.innerHTML =
    modelMeta
      .map(
        (m, i) =>
          `<div class="manage-item"><div><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.filename || '3D model')}${m.note ? ` · ${escapeHtml(m.note)}` : ''}</p></div><button type="button" class="delete" data-remove-model="${escapeHtml(m.id)}">Remove</button></div>`
      )
      .join('') || '<p>No 3D models yet.</p>';
}

async function renderModels() {
  const grid = $('#modelsGrid');
  if (!grid) return;
  if (!modelMeta.length) {
    grid.innerHTML = '<p class="models-empty">No 3D models on the shelf yet. Upload one from the dashboard.</p>';
    return;
  }

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
      const record = await getModelBlob(meta.id);
      if (!record?.blob) {
        const card = grid.querySelector(`[data-model-id="${meta.id}"] .model-fallback`);
        if (card) card.textContent = 'Model file missing.';
        continue;
      }
      if (modelObjectUrls.has(meta.id)) {
        URL.revokeObjectURL(modelObjectUrls.get(meta.id));
      }
      const url = createObjectUrl(record.blob);
      modelObjectUrls.set(meta.id, url);
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

let activeModelId = null;

function syncModelDownloadUi() {
  const downloadBtn = $('#modelDownloadBtn');
  const hint = $('#modelDownloadHint');
  const loggedIn = isLoggedIn();
  if (downloadBtn) downloadBtn.hidden = !loggedIn || !activeModelId;
  if (hint) hint.hidden = loggedIn || !activeModelId;
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
  syncModelDownloadUi();

  const viewer = $('#modelDetailViewer');
  const fallback = $('#modelDetailFallback');
  fallback.style.display = 'grid';
  fallback.textContent = 'Loading model…';
  viewer.style.display = 'none';

  try {
    let url = modelObjectUrls.get(id);
    if (!url) {
      const record = await getModelBlob(id);
      if (!record?.blob) throw new Error('missing');
      url = createObjectUrl(record.blob);
      modelObjectUrls.set(id, url);
    }
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

function closeModelDetail() {
  activeModelId = null;
  $('#modelDetail').classList.remove('show');
  $('#modelDetail').setAttribute('aria-hidden', 'true');
  if (!$('#siteDetail')?.classList.contains('show')) document.body.style.overflow = '';
  syncModelDownloadUi();
}

async function downloadActiveModel() {
  if (!isLoggedIn() || !activeModelId) return;
  const meta = modelMeta.find((m) => m.id === activeModelId);
  if (!meta) return;
  try {
    const record = await getModelBlob(activeModelId);
    if (!record?.blob) return;
    const url = createObjectUrl(record.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = meta.filename || `${meta.title.replace(/\s+/g, '-').toLowerCase()}.glb`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
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
  const note = $('#loginNote');
  note.textContent = message;
  note.classList.add('error');
}

function clearLoginError() {
  const note = $('#loginNote');
  note.textContent = 'Owner access only.';
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
});

$('#jumpContact').onclick = () => $('#contact').scrollIntoView({ behavior: 'smooth' });

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#search').focus();
  } else if (e.key === 'Escape') {
    if ($('#modelDetail')?.classList.contains('show')) closeModelDetail();
    else closeDetail();
    $('#loginModal').classList.remove('show');
  }
});

$('#modelsGrid').onclick = (e) => {
  const card = e.target.closest('.model-card');
  if (card?.dataset.modelId) openModelDetail(card.dataset.modelId);
};

$('#modelsGrid').onkeydown = (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.model-card');
  if (!card?.dataset.modelId) return;
  e.preventDefault();
  openModelDetail(card.dataset.modelId);
};

$('#modelDetailClose').onclick = closeModelDetail;
$('#modelDownloadBtn').onclick = downloadActiveModel;

$('#siteGrid').onclick = (e) => {
  const card = e.target.closest('.site-card');
  if (card) openDetail(Number(card.dataset.siteIndex));
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

const modal = $('#loginModal');
const dashboard = $('#dashboard');

$('#loginBtn').onclick = () => {
  if (isLoggedIn()) {
    openDashboard();
    return;
  }
  clearLoginError();
  modal.classList.add('show');
};

$('[data-close]').onclick = () => modal.classList.remove('show');

$('#loginForm').onsubmit = (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  if (
    data.email.trim().toLowerCase() !== ADMIN.email.toLowerCase() ||
    data.password !== ADMIN.password
  ) {
    showLoginError('Wrong email or password.');
    return;
  }
  setLoggedIn(true);
  clearLoginError();
  e.target.reset();
  modal.classList.remove('show');
  syncModelDownloadUi();
  openDashboard();
};

$('#dashClose').onclick = closeDashboard;

$('#signout').onclick = () => {
  setLoggedIn(false);
  closeDashboard();
  resetEditor();
  syncModelDownloadUi();
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
    sites.splice(Number(remove.dataset.remove), 1);
    set('athar-shelf-sites', sites);
    renderFilters();
    renderSites();
    renderDash();
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

editorForm.onsubmit = (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(editorForm));
  delete data.coverUpload;
  delete data.galleryUpload;
  const urlGallery = parseGallery(data.gallery);
  const entry = {
    ...data,
    image: draftCover || data.image || '',
    gallery: [...draftGallery, ...urlGallery],
  };
  if (editingSiteIndex === null) sites.unshift(entry);
  else sites[editingSiteIndex] = { ...sites[editingSiteIndex], ...entry };
  try {
    set('athar-shelf-sites', sites);
  } catch {
    $('#addStatus').textContent = 'Images are too large for browser storage. Try fewer or smaller files.';
    return;
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
  $('#addStatus').textContent = wasEdit ? 'Changes saved.' : 'Published to Athar’s Shelf.';
};

$('#categoryForm').onsubmit = (e) => {
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
  categories.push({ id, label: name });
  saveCategories();
  e.target.reset();
  status.textContent = `“${name}” added.`;
  renderFilters();
  renderCategorySelect(id);
  renderDash();
};

$('#categoryList').onclick = (e) => {
  const button = e.target.closest('[data-remove-category]');
  if (!button) return;
  const id = button.dataset.removeCategory;
  if (defaultCategories.some((cat) => cat.id === id)) return;
  const used = sites.filter((s) => s.category === id).length;
  if (used && !confirm(`Remove “${categoryLabel(id)}”? ${used} site${used === 1 ? '' : 's'} will move to Studios.`)) {
    return;
  }
  categories = categories.filter((cat) => cat.id !== id);
  saveCategories();
  if (used) {
    sites = sites.map((site) => (site.category === id ? { ...site, category: 'studio' } : site));
    set('athar-shelf-sites', sites);
  }
  if (activeFilter === id) activeFilter = 'all';
  $('#categoryStatus').textContent = 'Category removed.';
  renderFilters();
  renderCategorySelect();
  renderSites();
  renderDash();
};

$('#modelUpload').onchange = (e) => {
  const file = e.target.files?.[0];
  $('#modelFileName').textContent = file ? file.name : 'No file chosen.';
};

$('#modelForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const file = form.elements.modelFile?.files?.[0];
  const status = $('#modelStatus');
  if (!file) {
    status.textContent = 'Choose a .glb or .gltf file.';
    return;
  }
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
    status.textContent = 'Please upload a .glb or .gltf model.';
    return;
  }
  if (file.size > 40 * 1024 * 1024) {
    status.textContent = 'Model is too large (max about 40MB).';
    return;
  }

  status.textContent = 'Uploading…';
  const id = `model-${Date.now()}`;
  try {
    await saveModelBlob(id, file, file.name, file.type || 'model/gltf-binary');
    modelMeta.unshift({
      id,
      title: String(data.title || '').trim(),
      note: String(data.note || '').trim(),
      filename: file.name,
      createdAt: Date.now(),
    });
    setModelMeta(modelMeta);
    form.reset();
    $('#modelFileName').textContent = 'No file chosen.';
    status.textContent = 'Model published to the shelf.';
    renderDash();
    await renderModels();
  } catch {
    status.textContent = 'Could not save that model. Try a smaller file.';
  }
};

$('#modelManageList').onclick = async (e) => {
  const button = e.target.closest('[data-remove-model]');
  if (!button) return;
  const id = button.dataset.removeModel;
  modelMeta = modelMeta.filter((m) => m.id !== id);
  setModelMeta(modelMeta);
  if (modelObjectUrls.has(id)) {
    URL.revokeObjectURL(modelObjectUrls.get(id));
    modelObjectUrls.delete(id);
  }
  try {
    await deleteModelBlob(id);
  } catch {
    /* ignore */
  }
  renderDash();
  await renderModels();
};

$('#contactForm').onsubmit = (e) => {
  e.preventDefault();
  messages.unshift(Object.fromEntries(new FormData(e.target)));
  set('athar-shelf-messages', messages);
  renderDash();
  e.target.reset();
  $('#formStatus').textContent = 'Message sent — thank you.';
};

renderFilters();
renderCategorySelect();
renderSites();
renderDash();
renderModels();
syncCoverUploadUi();
renderGalleryUploads();
refreshPreview();
syncModelDownloadUi();
