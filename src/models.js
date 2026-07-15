import { deleteModel as deleteModelRow, publicMediaUrl, removeMedia, supabase, upsertModel, uploadMedia } from './lib/db.js';

export async function uploadModelFile(file) {
  return uploadMedia('models', file, file.name);
}

export async function saveModelRecord(meta) {
  return upsertModel(meta);
}

export async function getModelBlob(id) {
  if (!supabase) return null;
  const { data: row, error } = await supabase.from('models').select('*').eq('id', id).maybeSingle();
  if (error || !row) return null;
  const url = row.src_url || (row.storage_path ? publicMediaUrl(row.storage_path) : '');
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  const blob = await response.blob();
  return { id, blob, filename: row.filename, type: blob.type };
}

export async function deleteModelBlob(id) {
  if (!supabase) return;
  const { data: row } = await supabase.from('models').select('storage_path').eq('id', id).maybeSingle();
  if (row?.storage_path) await removeMedia(row.storage_path);
  await deleteModelRow(id);
}

export function createObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

export function getModelMeta() {
  return [];
}

export function setModelMeta() {}

/** @deprecated use uploadModelFile + saveModelRecord */
export async function saveModelBlob(id, file, filename) {
  const upload = await uploadModelFile(file);
  return saveModelRecord({
    id,
    title: filename || file.name,
    filename: filename || file.name,
    storagePath: upload.path,
    src: upload.url,
    size: file.size,
    sample: false,
  });
}
