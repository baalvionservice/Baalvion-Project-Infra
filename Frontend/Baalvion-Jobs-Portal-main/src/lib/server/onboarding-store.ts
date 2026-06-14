/**
 * File-backed persistence for college & student self-onboarding applications.
 *
 * This is intentionally dependency-free (Node `fs` only) so the onboarding flow
 * works end-to-end on a local/PM2 deployment without a running jobs-service.
 * Records live under `<cwd>/.data/onboarding/*.json`. The module is server-only:
 * import it from Route Handlers / Server Components, never from client code.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  type CollegeApplication,
  type StudentApplication,
  type ApplicationStatus,
  type CollegeApplicationInput,
  type StudentApplicationInput,
} from './onboarding-schemas';

const DATA_DIR = path.join(process.cwd(), '.data', 'onboarding');
const COLLEGE_FILE = path.join(DATA_DIR, 'colleges.json');
const STUDENT_FILE = path.join(DATA_DIR, 'students.json');

// Serialize read-modify-write cycles so concurrent POSTs don't clobber each other.
let writeChain: Promise<unknown> = Promise.resolve();

async function readCollection<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function writeCollection<T>(file: string, records: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(records, null, 2), 'utf-8');
}

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const next = writeChain.then(task, task);
  // Keep the chain alive but swallow rejections so one failure can't poison it.
  writeChain = next.catch(() => undefined);
  return next;
}

function makeReferenceId(prefix: string): string {
  // Human-friendly reference for applicants to quote in follow-ups.
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

// ─── Colleges ──────────────────────────────────────────────────────────────
export async function createCollegeApplication(
  input: CollegeApplicationInput,
): Promise<CollegeApplication> {
  return withLock(async () => {
    const records = await readCollection<CollegeApplication>(COLLEGE_FILE);
    const now = new Date().toISOString();
    const record: CollegeApplication = {
      id: randomUUID(),
      referenceId: makeReferenceId('COL'),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      reviewNotes: null,
      ...input,
    };
    await writeCollection(COLLEGE_FILE, [record, ...records]);
    return record;
  });
}

export async function listCollegeApplications(
  status?: ApplicationStatus,
): Promise<CollegeApplication[]> {
  const records = await readCollection<CollegeApplication>(COLLEGE_FILE);
  return status ? records.filter((r) => r.status === status) : records;
}

// ─── Students ──────────────────────────────────────────────────────────────
export async function createStudentApplication(
  input: StudentApplicationInput,
): Promise<StudentApplication> {
  return withLock(async () => {
    const records = await readCollection<StudentApplication>(STUDENT_FILE);
    const now = new Date().toISOString();
    const record: StudentApplication = {
      id: randomUUID(),
      referenceId: makeReferenceId('STU'),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      reviewNotes: null,
      ...input,
    };
    await writeCollection(STUDENT_FILE, [record, ...records]);
    return record;
  });
}

export async function listStudentApplications(
  status?: ApplicationStatus,
): Promise<StudentApplication[]> {
  const records = await readCollection<StudentApplication>(STUDENT_FILE);
  return status ? records.filter((r) => r.status === status) : records;
}

// ─── Status updates (admin review) ───────────────────────────────────────────
type Collection = 'college' | 'student';

export async function updateApplicationStatus(
  collection: Collection,
  id: string,
  status: ApplicationStatus,
  reviewNotes?: string,
): Promise<CollegeApplication | StudentApplication | null> {
  const file = collection === 'college' ? COLLEGE_FILE : STUDENT_FILE;
  return withLock(async () => {
    const records = await readCollection<CollegeApplication | StudentApplication>(file);
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return null;
    const updated = {
      ...records[index],
      status,
      reviewNotes: reviewNotes ?? records[index].reviewNotes ?? null,
      updatedAt: new Date().toISOString(),
    };
    const next = [...records];
    next[index] = updated;
    await writeCollection(file, next);
    return updated;
  });
}
