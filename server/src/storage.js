import * as Minio from 'minio';

const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = Number(process.env.MINIO_PORT || 9000);
const useSSL = String(process.env.MINIO_USE_SSL || 'false') === 'true';
const accessKey = process.env.MINIO_ROOT_USER || 'minioadmin';
const secretKey = process.env.MINIO_ROOT_PASSWORD || 'minioadmin';
export const bucket = process.env.MINIO_BUCKET || 'media';
const publicBase = (process.env.PUBLIC_MEDIA_BASE || '/media').replace(/\/$/, '');

export const minio = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey,
});

export async function ensureBucket() {
  const exists = await minio.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await minio.makeBucket(bucket, 'us-east-1');
  }
  try {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await minio.setBucketPolicy(bucket, JSON.stringify(policy));
  } catch {
    /* optional */
  }
}

export function publicObjectUrl(objectName) {
  if (!objectName) return '';
  if (/^https?:\/\//i.test(objectName)) return objectName;
  return `${publicBase}/${objectName.split('/').map(encodeURIComponent).join('/')}`;
}

export async function putObject(objectName, buffer, contentType) {
  await minio.putObject(bucket, objectName, buffer, buffer.length, {
    'Content-Type': contentType || 'application/octet-stream',
  });
  return { path: objectName, url: publicObjectUrl(objectName) };
}

export async function removeObject(objectName) {
  if (!objectName || /^https?:\/\//i.test(objectName)) return;
  await minio.removeObject(bucket, objectName);
}

export async function getObjectStream(objectName) {
  return minio.getObject(bucket, objectName);
}
