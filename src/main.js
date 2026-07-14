import './styles/styles.css';
import './styles/overrides.css';
import './styles/results.css';
import './styles/values.css';
import './styles/editor.css';
import './styles/appearance.css';
import './styles/extras.css';

const ADMIN = {
  email: 'atharqulimoon@gmail.com',
  password: 'Roll#947131',
};

const defaults = [
  {
    title: 'Other Means',
    category: 'studio',
    description: 'A studio for culture and brand moments.',
    url: 'https://othermeans.studio',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Noma Projects',
    category: 'shop',
    description: 'Curiosities from the Noma universe.',
    url: 'https://nomaprojects.com',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Field Notes',
    category: 'culture',
    description: 'Notes from a slower kind of life.',
    url: 'https://fieldnotesbrand.com',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Mina Kwon',
    category: 'portfolio',
    description: 'Soft colours, sharp perspective.',
    url: 'https://example.com',
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Aesop',
    category: 'shop',
    description: 'A sensory world, beautifully built.',
    url: 'https://www.aesop.com',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Yuko Shimizu',
    category: 'portfolio',
    description: 'Ink, instinct and wildness.',
    url: 'https://yukoart.com',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80',
  },
];

const fallbackImage =
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80';

const get = (k, f = []) => JSON.parse(localStorage.getItem(k) || JSON.stringify(f));
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const $ = (s) => document.querySelector(s);

let sites = get('athar-shelf-sites', defaults);
let messages = get('athar-shelf-messages');
let activeFilter = 'all';
let query = '';
let reverse = false;
let editingSiteIndex = null;

sites = sites.map((site, index) => {
  if (!site.gallery || !site.gallery.length) {
    site.gallery = [
      site.image,
      `https://images.unsplash.com/photo-${['1497366811353-6870744d04b2', '1497366754035-f200968a6e72', '1499750310107-5fef28a66643'][index % 3]}?auto=format&fit=crop&w=900&q=80`,
    ].filter(Boolean);
  }
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
      `${s.title} ${s.description} ${s.category}`.toLowerCase().includes(query.toLowerCase())
  );
  if (reverse) shown = [...shown].reverse();

  $('#siteGrid').innerHTML =
    shown
      .map((s, i) => {
        const look = lookOf(s);
        const index = sites.indexOf(s);
        return `<article class="site-card" data-site-index="${index}" style="--site-background:${look.cardBg};--site-title:${look.titleColor};--site-body:${look.bodyColor};--site-accent:${look.accentColor};text-align:${look.textAlign}">
          <div class="cover"><img src="${escapeHtml(s.image || fallbackImage)}" alt="${escapeHtml(s.title)}" style="object-position:${look.imagePosition}"><span class="card-top">${escapeHtml(s.category)}</span><div class="card-overlay"><span class="open">↗</span></div></div>
          <div class="card-info"><div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.description)}</p></div><span class="card-index">${String(i + 1).padStart(2, '0')}</span></div>
        </article>`;
      })
      .join('') || '<p>No websites match that search.</p>';

  $('#resultCount').textContent = `${String(shown.length).padStart(2, '0')} results`;
  $('#siteCount').textContent = String(sites.length).padStart(2, '0');
}

function renderDash() {
  $('#manageCount').textContent = sites.length;
  $('#messageCount').textContent = messages.length;
  $('#manageList').innerHTML =
    sites
      .map(
        (s, i) => `<div class="manage-item"><div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.category)} · ${escapeHtml(s.url)}</p></div><div class="manage-actions"><button type="button" class="edit" data-edit="${i}">Edit</button><button type="button" class="delete" data-remove="${i}">Remove</button></div></div>`
      )
      .join('') || '<p>No sites yet.</p>';
  $('#messageList').innerHTML =
    messages
      .map(
        (m) => `<article class="message-item"><p class="message-meta">${escapeHtml(m.name)} · ${escapeHtml(m.email)}</p><h3>${escapeHtml(m.name)}</h3><p>${escapeHtml(m.message)}</p></article>`
      )
      .join('') || '<p>No messages yet.</p>';
}

function closeDetail() {
  $('#siteDetail').classList.remove('show');
  $('#siteDetail').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openDetail(index) {
  const s = sites[index];
  if (!s) return;
  const gallery = parseGallery(s.gallery);
  const look = lookOf(s);

  $('#detailTitle').textContent = s.title;
  $('#detailCategory').textContent = s.category.toUpperCase();
  $('#detailCrumb').textContent = `ATHAR'S SHELF / ${s.category.toUpperCase()}`;
  $('#detailImage').src = s.image || fallbackImage;
  $('#detailImage').alt = `Preview of ${s.title}`;
  $('#detailImage').style.objectPosition = look.imagePosition;
  $('#detailDescription').textContent = s.description;
  $('#detailIndex').textContent = String(index + 1).padStart(2, '0');
  $('#detailVisit').href = s.url;
  $('#detailUrl').href = s.url;
  $('#detailUrl').textContent = s.url.replace(/^https?:\/\//, '');
  $('#detailTags').innerHTML = [s.category, 'website', 'selected']
    .map((t) => `<span>${escapeHtml(t)}</span>`)
    .join('');

  let panel = $('#detailGallery');
  if (!panel) {
    document
      .querySelector('.detail-cover')
      .insertAdjacentHTML('afterend', '<section class="detail-gallery" id="detailGallery"></section>');
    panel = $('#detailGallery');
  }

  panel.innerHTML = gallery.length
    ? `<p class="eyebrow">HIGHLIGHTS / ${String(gallery.length).padStart(2, '0')} VIEWS</p>
       <p class="highlight-intro">A closer look at the details that made this one worth keeping.</p>
       <div class="gallery-strip">${gallery
         .map(
           (image, i) =>
             `<button type="button" class="gallery-thumb ${i === 0 ? 'active' : ''}" data-image="${escapeHtml(image)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(s.title)} gallery image ${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span></button>`
         )
         .join('')}</div>`
    : '';
  panel.style.display = gallery.length ? 'block' : 'none';

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
      .querySelector('.detail-info')
      .insertAdjacentHTML('afterend', '<section class="shelf-signal" id="shelfSignal"></section>');
    panel = $('#shelfSignal');
  }

  panel.dataset.index = index;
  panel.innerHTML = `<div class="result-head"><div><p class="eyebrow">THE SHELF SIGNAL</p><h3>The response<br>so far.</h3><p>Four small dimensions for a more useful point of view.</p></div><div class="overall-score"><b>${overall}</b><span>OVERALL<br>SIGNAL</span></div></div>
    <div class="metric-grid">${metrics
      .map(([label, field]) => `<div><span>${label}</span><b>${average(votes, field)}</b></div>`)
      .join('')}</div>
    <div class="vote-builder"><div><p class="eyebrow">ADD YOUR RESPONSE</p><p class="vote-prompt">How does this website feel to you?</p></div>
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
      .join('')}<button type="button" class="results-submit">Save my response <span>↗</span></button><p class="results-note"></p></div></div>
    <div class="results-board"><div class="board-head"><span>RECENT SIGNALS</span><span>VISUAL</span><span>FLOW</span><span>ORIGINAL</span><span>STORY</span><span>OVERALL</span></div>${
      votes.length
        ? votes
            .slice(-5)
            .reverse()
            .map((vote, i) => {
              const total = ((vote.visual + vote.flow + vote.originality + vote.story) / 4).toFixed(1);
              return `<div class="board-row"><span><i>${String(votes.length - i).padStart(2, '0')}</i> Shelf visitor</span><span>${vote.visual}</span><span>${vote.flow}</span><span>${vote.originality}</span><span>${vote.story}</span><strong>${total}</strong></div>`;
            })
            .join('')
        : '<p class="empty-results">Be the first person to leave a signal for this one.</p>'
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
  $('#previewDescription').textContent = fields.description.value || 'Your description will appear here.';
  $('#previewCategory').textContent = (fields.category.value || 'studio').toUpperCase();
  $('#previewImage').src = fields.image.value || fallbackImage;
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
  if (e.target.tagName !== 'BUTTON') return;
  document.querySelectorAll('#filters button').forEach((b) => b.classList.remove('active'));
  e.target.classList.add('active');
  activeFilter = e.target.dataset.filter;
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
    closeDetail();
    $('#loginModal').classList.remove('show');
  }
});

$('#siteGrid').onclick = (e) => {
  const card = e.target.closest('.site-card');
  if (card) openDetail(Number(card.dataset.siteIndex));
};

$('#detailClose').onclick = closeDetail;

$('#siteDetail').onclick = (e) => {
  const thumb = e.target.closest('.gallery-thumb');
  if (thumb) {
    $('#detailImage').src = thumb.dataset.image;
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
  openDashboard();
};

$('#dashClose').onclick = closeDashboard;

$('#signout').onclick = () => {
  setLoggedIn(false);
  closeDashboard();
  resetEditor();
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
    Object.entries({
      title: s.title,
      url: s.url,
      category: s.category,
      description: s.description,
      image: s.image || '',
      gallery: parseGallery(s.gallery).join('\n'),
      ...look,
    }).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
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
    renderSites();
    renderDash();
  }
};

const editorForm = $('#addSiteForm');
editorForm.addEventListener('input', refreshPreview);
editorForm.addEventListener('change', refreshPreview);

editorForm.onsubmit = (e) => {
  e.preventDefault();
  const entry = Object.fromEntries(new FormData(editorForm));
  entry.gallery = parseGallery(entry.gallery);
  if (editingSiteIndex === null) sites.unshift(entry);
  else sites[editingSiteIndex] = { ...sites[editingSiteIndex], ...entry };
  set('athar-shelf-sites', sites);
  renderSites();
  renderDash();
  $('#addStatus').textContent =
    editingSiteIndex === null ? 'Published to Athar’s Shelf.' : 'Changes saved.';
  const wasEdit = editingSiteIndex !== null;
  editingSiteIndex = null;
  $('#add h2').textContent = 'Add a website.';
  editorForm.querySelector('[type="submit"]').innerHTML = 'Publish to shelf <span>↗</span>';
  editorForm.reset();
  Object.entries(lookDefaults).forEach(([key, value]) => {
    if (editorForm.elements[key]) editorForm.elements[key].value = value;
  });
  refreshPreview();
  if (wasEdit) $('#addStatus').textContent = 'Changes saved.';
};

$('#contactForm').onsubmit = (e) => {
  e.preventDefault();
  messages.unshift(Object.fromEntries(new FormData(e.target)));
  set('athar-shelf-messages', messages);
  renderDash();
  e.target.reset();
  $('#formStatus').textContent = 'Message sent — thank you.';
};

renderSites();
renderDash();
refreshPreview();
