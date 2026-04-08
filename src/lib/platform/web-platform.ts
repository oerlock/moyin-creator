import { PlatformAdapter, PlatformProject } from './types';

export class WebPlatform implements PlatformAdapter {
  async listProjects(): Promise<PlatformProject[]> {
    const response = await fetch('/api/storage/projects', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to list projects');
    }

    const payload = (await response.json()) as { projects: PlatformProject[] };
    return payload.projects;
  }

  async saveProject(project: PlatformProject): Promise<void> {
    const response = await fetch(`/api/storage/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error('Failed to save project');
    }
  }

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`/api/storage/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }
}
