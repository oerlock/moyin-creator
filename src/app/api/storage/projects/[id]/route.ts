import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

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

async function writeProjects(projects: ProjectRecord[]) {
  await ensureStore();
  await fs.writeFile(PROJECT_FILE, JSON.stringify({ projects }, null, 2), 'utf-8');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await request.json()) as ProjectRecord;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }

  const projects = await readProjects();
  const nextProject: ProjectRecord = {
    id: params.id,
    name: body.name.trim(),
    updatedAt: body.updatedAt || new Date().toISOString(),
  };

  const filtered = projects.filter((item) => item.id !== params.id);
  filtered.push(nextProject);
  await writeProjects(filtered);

  return NextResponse.json({ project: nextProject });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projects = await readProjects();
  const filtered = projects.filter((item) => item.id !== params.id);
  await writeProjects(filtered);
  return NextResponse.json({ success: true });
}
