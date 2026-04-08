import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const DATA_DIR = path.join(process.cwd(), '.next-mvp-data');
const PROJECT_FILE = path.join(DATA_DIR, 'projects.json');

type ProjectRecord = {
  id: string;
  name: string;
  updatedAt: string;
};

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PROJECT_FILE);
  } catch {
    await fs.writeFile(PROJECT_FILE, JSON.stringify({ projects: [] }, null, 2), 'utf-8');
  }
}

async function readProjects(): Promise<ProjectRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(PROJECT_FILE, 'utf-8');
  const payload = JSON.parse(raw) as { projects?: ProjectRecord[] };
  return payload.projects ?? [];
}

export async function GET() {
  const projects = await readProjects();
  projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ projects });
}
