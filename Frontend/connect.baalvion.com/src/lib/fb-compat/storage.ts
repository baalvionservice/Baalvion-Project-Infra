/**
 * firebase/storage-compatible shim, backed by Baalvion OS S3/MinIO presigned URLs.
 * Replaces Firebase Storage uploads/downloads.
 */
import baalvion from '@/lib/baalvion';

export type FirebaseStorage = any;
export type StorageReference = { path: string };

export function getStorage(_app?: any): FirebaseStorage {
  return { __storage: true };
}

export function ref(_storage: any, path: string): StorageReference {
  return { path };
}

export async function getDownloadURL(r: StorageReference): Promise<string> {
  const { data } = await baalvion.get('/files/signed', { params: { key: r.path } });
  return (data?.data ?? data)?.downloadUrl;
}

async function presignPut(filename: string, contentType: string) {
  const { data } = await baalvion.post('/files/presign', { filename, contentType, scope: 'image' });
  return data?.data ?? data;
}

export interface UploadSnapshot { ref: StorageReference; bytesTransferred: number; totalBytes: number; state: string }
export interface UploadTask {
  snapshot: UploadSnapshot;
  on: (evt: string, next?: (s: UploadSnapshot) => void, error?: (e: any) => void, complete?: () => void) => () => void;
  then: (res: (s: UploadSnapshot) => any, rej?: (e: any) => any) => Promise<any>;
  catch: (rej: (e: any) => any) => Promise<any>;
}

/** Minimal re-implementation of the resumable-upload task surface the app uses. */
export function uploadBytesResumable(r: StorageReference, file: any, _meta?: any): UploadTask {
  const listeners: any = {};
  let started = false;
  let promise: Promise<any>;
  const task: any = {
    snapshot: { ref: r, bytesTransferred: 0, totalBytes: file?.size ?? 0, state: 'running' },
  };
  const doUpload = async () => {
    const name = file?.name ?? r.path?.split('/').pop() ?? 'file';
    const meta = await presignPut(name, file?.type ?? 'application/octet-stream');
    await fetch(meta.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: file?.type ? { 'Content-Type': file.type } : undefined,
    });
    task.snapshot = { ref: { path: meta.key }, bytesTransferred: file?.size ?? 0, totalBytes: file?.size ?? 0, state: 'success' };
    listeners.next?.(task.snapshot);
    listeners.complete?.();
    return task.snapshot;
  };
  const run = () => {
    if (!started) {
      started = true;
      promise = doUpload().catch((e) => { listeners.error?.(e); throw e; });
    }
    return promise;
  };
  task.on = (_evt: string, next?: any, error?: any, complete?: any) => {
    listeners.next = next; listeners.error = error; listeners.complete = complete;
    run();
    return () => {};
  };
  task.then = (res: any, rej: any) => run().then(res, rej);
  task.catch = (rej: any) => run().catch(rej);
  return task as UploadTask;
}

export async function uploadBytes(r: StorageReference, file: any) {
  const task = uploadBytesResumable(r, file);
  await task.then(() => {}, () => {});
  return { ref: task.snapshot.ref, metadata: {} };
}

export async function deleteObject(r: StorageReference) {
  await baalvion.delete('/files', { params: { key: r.path } });
}
