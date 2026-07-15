import { api, getToken, isApiConfigured, isSupabaseConfigured, publicMediaUrl, setToken, supabase, API_BASE } from './api.js';

export function mapSiteRow(site) {
  return site;
}

export function siteToRow(site) {
  return site;
}

export function mapIdeaRow(idea) {
  return idea;
}

export function mapModelRow(model) {
  return model;
}

export async function fetchProfile() {
  if (!isApiConfigured || !getToken()) return null;
  try {
    const data = await api('/api/auth/me');
    return data.user;
  } catch (err) {
    if (err.code === 'blocked' || /blocked/i.test(err.message || '')) {
      setToken('');
      err.code = 'blocked';
      throw err;
    }
    if (err.status === 401) {
      setToken('');
      return null;
    }
    throw err;
  }
}

export async function signIn(email, password) {
  const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  setToken(data.token);
  return data;
}

export async function signUp(name, email, password) {
  const data = await api('/api/auth/signup', { method: 'POST', body: { name, email, password } });
  setToken(data.token);
  return { ...data, session: { access_token: data.token } };
}

export async function signOut() {
  setToken('');
}

export async function loadShelf() {
  if (!isApiConfigured) {
    return {
      configured: false,
      sites: [],
      ideas: [],
      categories: [],
      models: [],
      messages: [],
      users: [],
      likes: [],
      comments: [],
    };
  }
  return api('/api/shelf');
}

export async function seedDefaults() {
  /* VPS schema seeds sample models; admin publishes the rest */
}

export async function upsertSite(site, sortOrder = 0) {
  const body = { ...site, sortOrder };
  if (site.id) return api(`/api/sites/${site.id}`, { method: 'PUT', body });
  return api('/api/sites', { method: 'POST', body });
}

export async function deleteSite(id) {
  await api(`/api/sites/${id}`, { method: 'DELETE' });
}

export async function upsertCategory(category) {
  return api('/api/categories', { method: 'POST', body: category });
}

export async function deleteCategory(id) {
  await api(`/api/categories/${id}`, { method: 'DELETE' });
}

export async function upsertIdea(idea, sortOrder = 0) {
  return api('/api/ideas', { method: 'POST', body: { ...idea, sortOrder } });
}

export async function deleteIdea(id) {
  await api(`/api/ideas/${id}`, { method: 'DELETE' });
}

export async function upsertModel(meta) {
  return api('/api/models', { method: 'POST', body: meta });
}

export async function deleteModel(id) {
  await api(`/api/models/${id}`, { method: 'DELETE' });
}

export async function insertMessage({ name, email, message }) {
  await api('/api/messages', { method: 'POST', body: { name, email, message } });
}

export async function toggleIdeaLike(ideaId, _userId, liked) {
  const data = await api(`/api/ideas/${ideaId}/like`, { method: 'POST', body: { liked } });
  return data.liked;
}

export async function addIdeaComment(ideaId, _userId, name, text) {
  return api(`/api/ideas/${ideaId}/comments`, { method: 'POST', body: { name, text } });
}

export async function createMember({ name, email, password }) {
  const user = await api('/api/users', { method: 'POST', body: { name, email, password } });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    blocked: Boolean(user.blocked),
    createdAt: user.created_at ? Date.parse(user.created_at) : Date.now(),
  };
}

export async function updateMember(id, { name, blocked }) {
  const user = await api(`/api/users/${id}`, { method: 'PATCH', body: { name, blocked } });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    blocked: Boolean(user.blocked),
    createdAt: user.created_at ? Date.parse(user.created_at) : Date.now(),
  };
}

export async function deleteMember(id) {
  await api(`/api/users/${id}`, { method: 'DELETE' });
}

export async function uploadMedia(folder, file, preferredName, onProgress) {
  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('file', file, preferredName || file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return;
      onProgress(Math.min(1, event.loaded / event.total));
    });
    xhr.addEventListener('load', () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        data = { error: xhr.responseText };
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (typeof onProgress === 'function') onProgress(1);
        resolve(data);
        return;
      }
      reject(new Error(data?.error || data?.message || `Upload failed (${xhr.status})`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error while uploading.')));
    xhr.open('POST', `${API_BASE}/api/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

export async function uploadDataUrl(folder, dataUrl, filename = 'image.jpg') {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  return uploadMedia(folder, file, filename);
}

export async function removeMedia(path) {
  if (!path || /^https?:\/\//i.test(path)) return;
  await api('/api/upload', { method: 'DELETE', body: { path } });
}

export { isApiConfigured, isSupabaseConfigured, publicMediaUrl, supabase };
