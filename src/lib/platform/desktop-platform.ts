import { PlatformAdapter, PlatformProject } from './types';

export class DesktopPlatform implements PlatformAdapter {
  async listProjects(): Promise<PlatformProject[]> {
    if (!window.fileStorage?.listDirs) {
      return [];
    }

    const ids = await window.fileStorage.listDirs('_p');
    return ids.map((id) => ({ id, name: id, updatedAt: new Date(0).toISOString() }));
  }

  async saveProject(project: PlatformProject): Promise<void> {
    if (!window.fileStorage?.setItem) {
      return;
    }

    await window.fileStorage.setItem(`_p/${project.id}/meta`, JSON.stringify(project));
  }

  async deleteProject(id: string): Promise<void> {
    if (!window.fileStorage?.removeDir) {
      return;
    }

    await window.fileStorage.removeDir(`_p/${id}`);
  }
}
