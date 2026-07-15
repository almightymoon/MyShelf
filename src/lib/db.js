import { isSupabaseConfigured, publicMediaUrl, supabase } from './supabase.js';

function lookFromRow(look) {
  if (!look || typeof look !== 'object') return {};
  return look;
}

export function mapSiteRow(row) {
  if (!row) return null;
  const look = lookFromRow(row.look);
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

export function siteToRow(site, sortOrder = 0) {
  return {
    title: site.title,
    blurb: site.blurb || '',
    url: site.url,
    category: site.category || null,
    description: site.description || '',
    explore_note: site.exploreNote || '',
    image_url: site.image || '',
    gallery: site.gallery || [],
    look: {
      cardBg: site.cardBg,
      titleColor: site.titleColor,
      bodyColor: site.bodyColor,
      accentColor: site.accentColor,
      imagePosition: site.imagePosition,
      textAlign: site.textAlign,
    },
    sort_order: sortOrder,
  };
}

export function mapIdeaRow(row) {
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

export function mapModelRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    note: row.note || '',
    filename: row.filename || '',
    storagePath: row.storage_path || '',
    src: row.src_url || (row.storage_path ? publicMediaUrl(row.storage_path) : ''),
    size: row.size || 0,
    sample: Boolean(row.sample),
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
}

export async function fetchProfile() {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return null;
  const email = String(user.email || '').toLowerCase();
  const adminEmail = 'atharqulimoon@gmail.com';
  const fallback = {
    id: user.id,
    email,
    name: user.user_metadata?.name || '',
    role: email === adminEmail ? 'admin' : 'member',
    blocked: false,
  };
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) {
    console.warn('profiles lookup failed:', error.message);
    return fallback;
  }
  if (!data) return fallback;
  if (data.blocked && email !== adminEmail) {
    await supabase.auth.signOut();
    const err = new Error('Your account has been blocked from Athar’s Shelf.');
    err.code = 'blocked';
    throw err;
  }
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role === 'admin' || email === adminEmail ? 'admin' : data.role,
    blocked: Boolean(data.blocked),
  };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await fetchProfile();
  return data;
}

export async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function loadShelf() {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false, sites: [], ideas: [], categories: [], models: [], messages: [], users: [], likes: [], comments: [] };
  }

  const [sitesRes, ideasRes, catsRes, modelsRes, messagesRes, usersRes, likesRes, commentsRes] = await Promise.all([
    supabase.from('sites').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('ideas').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('label'),
    supabase.from('models').select('*').order('created_at', { ascending: false }),
    supabase.from('messages').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id,email,name,role,blocked,created_at').order('created_at', { ascending: false }),
    supabase.from('idea_likes').select('idea_id,user_id'),
    supabase.from('idea_comments').select('*').order('created_at', { ascending: true }),
  ]);

  const errors = [sitesRes, ideasRes, catsRes, modelsRes, likesRes, commentsRes]
    .map((r) => r.error)
    .filter(Boolean);
  if (errors.length) throw errors[0];

  return {
    configured: true,
    sites: (sitesRes.data || []).map(mapSiteRow),
    ideas: (ideasRes.data || []).map(mapIdeaRow),
    categories: catsRes.data || [],
    models: (modelsRes.data || []).map(mapModelRow),
    messages: (messagesRes.data || []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      message: m.body,
      createdAt: m.created_at,
    })),
    messagesError: messagesRes.error || null,
    users: (usersRes.data || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      blocked: Boolean(u.blocked),
      createdAt: u.created_at ? Date.parse(u.created_at) : Date.now(),
    })),
    usersError: usersRes.error || null,
    likes: likesRes.data || [],
    comments: commentsRes.data || [],
  };
}

export async function seedDefaults({ sites, ideas, models, categories }) {
  if (!supabase) return;
  const { count: siteCount } = await supabase.from('sites').select('*', { count: 'exact', head: true });
  const { count: ideaCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true });
  const { count: modelCount } = await supabase.from('models').select('*', { count: 'exact', head: true });

  if (!siteCount && sites?.length) {
    await supabase.from('sites').insert(sites.map((s, i) => siteToRow(s, i)));
  }
  if (!ideaCount && ideas?.length) {
    await supabase.from('ideas').insert(
      ideas.map((idea, i) => ({
        id: idea.id,
        title: idea.title,
        type: idea.type,
        access: idea.access || 'free',
        price: idea.price ?? null,
        image_url: idea.image,
        sort_order: i,
      }))
    );
  }
  if (!modelCount && models?.length) {
    await supabase.from('models').insert(
      models.map((m) => ({
        id: m.id,
        title: m.title,
        note: m.note || '',
        filename: m.filename || '',
        src_url: m.src || null,
        sample: true,
        size: null,
      }))
    );
  }
  if (categories?.length) {
    await supabase.from('categories').upsert(categories.map((c) => ({ id: c.id, label: c.label })), {
      onConflict: 'id',
    });
  }
}

export async function upsertSite(site, sortOrder = 0) {
  const row = siteToRow(site, sortOrder);
  if (site.id) {
    const { data, error } = await supabase.from('sites').update(row).eq('id', site.id).select('*').single();
    if (error) throw error;
    return mapSiteRow(data);
  }
  const { data, error } = await supabase.from('sites').insert(row).select('*').single();
  if (error) throw error;
  return mapSiteRow(data);
}

export async function deleteSite(id) {
  const { error } = await supabase.from('sites').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCategory(category) {
  const { data, error } = await supabase.from('categories').upsert(category, { onConflict: 'id' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertIdea(idea, sortOrder = 0) {
  const row = {
    id: idea.id,
    title: idea.title,
    type: idea.type || 'Reference',
    access: idea.access === 'paid' ? 'paid' : 'free',
    price: idea.access === 'paid' ? idea.price ?? 0 : null,
    image_url: idea.image,
    sort_order: sortOrder,
  };
  const { data, error } = await supabase.from('ideas').upsert(row).select('*').single();
  if (error) throw error;
  return mapIdeaRow(data);
}

export async function deleteIdea(id) {
  const { error } = await supabase.from('ideas').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertModel(meta) {
  const row = {
    id: meta.id,
    title: meta.title,
    note: meta.note || '',
    filename: meta.filename || '',
    storage_path: meta.storagePath || null,
    src_url: meta.src || (meta.storagePath ? publicMediaUrl(meta.storagePath) : null),
    size: meta.size ?? null,
    sample: Boolean(meta.sample),
  };
  const { data, error } = await supabase.from('models').upsert(row).select('*').single();
  if (error) throw error;
  return mapModelRow(data);
}

export async function deleteModel(id) {
  const { error } = await supabase.from('models').delete().eq('id', id);
  if (error) throw error;
}

export async function insertMessage({ name, email, message }) {
  const { error } = await supabase.from('messages').insert({
    name,
    email,
    body: message,
  });
  if (error) throw error;
}

export async function toggleIdeaLike(ideaId, userId, liked) {
  if (liked) {
    const { error } = await supabase.from('idea_likes').delete().eq('idea_id', ideaId).eq('user_id', userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('idea_likes').insert({ idea_id: ideaId, user_id: userId });
  if (error) throw error;
  return true;
}

export async function addIdeaComment(ideaId, userId, name, text) {
  const { data, error } = await supabase
    .from('idea_comments')
    .insert({ idea_id: ideaId, user_id: userId, name, body: text })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

function mapProfileRow(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    blocked: Boolean(u.blocked),
    createdAt: u.created_at ? Date.parse(u.created_at) : Date.now(),
  };
}

export async function createMember({ name, email, password }) {
  const { data, error } = await supabase.rpc('admin_create_member', {
    new_email: email,
    new_password: password,
    new_name: name || '',
  });
  if (error) throw error;
  return mapProfileRow(data);
}

export async function updateMember(id, { name, blocked }) {
  const { data, error } = await supabase.rpc('admin_update_member', {
    target_id: id,
    new_name: name ?? null,
    new_blocked: typeof blocked === 'boolean' ? blocked : null,
  });
  if (error) throw error;
  return mapProfileRow(data);
}

export async function deleteMember(id) {
  const { error } = await supabase.rpc('admin_delete_member', { target_id: id });
  if (error) throw error;
}

function extFromFile(file, fallback = 'bin') {
  const name = file?.name || '';
  const dot = name.lastIndexOf('.');
  if (dot >= 0) return name.slice(dot + 1).toLowerCase();
  if (file?.type?.includes('png')) return 'png';
  if (file?.type?.includes('jpeg') || file?.type?.includes('jpg')) return 'jpg';
  if (file?.type?.includes('webp')) return 'webp';
  return fallback;
}

export async function uploadMedia(folder, file, preferredName) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const safe = (preferredName || file.name || `file.${extFromFile(file)}`)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-');
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path, url: publicMediaUrl(path) };
}

export async function uploadDataUrl(folder, dataUrl, filename = 'image.jpg') {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  return uploadMedia(folder, file, filename);
}

export async function removeMedia(path) {
  if (!supabase || !path || /^https?:\/\//i.test(path)) return;
  await supabase.storage.from('media').remove([path]);
}

export { isSupabaseConfigured, supabase, publicMediaUrl };
