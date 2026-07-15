import { isApiConfigured, api } from './lib/api.js';
import { deleteModel as deleteModelRow, removeMedia, upsertModel, uploadMedia } from './lib/db.js';

export async function uploadModelFile(file, onProgress) {
  return uploadMedia('models', file, file.name, onProgress);
}

export async function saveModelRecord(meta) {
  return upsertModel(meta);
}

export async function getModelBlob(id) {
  if (!isApiConfigured) return null;
  const shelf = await api('/api/shelf');
  const row = (shelf.models || []).find((m) => m.id === id);
  if (!row?.src) return null;
  const response = await fetch(row.src);
  if (!response.ok) return null;
  const blob = await response.blob();
  return { id, blob, filename: row.filename, type: blob.type };
}

export async function deleteModelBlob(id) {
  await deleteModelRow(id);
}

export function createObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

export function getModelMeta() {
  return [];
}

export function setModelMeta() {}

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

export { removeMedia };
